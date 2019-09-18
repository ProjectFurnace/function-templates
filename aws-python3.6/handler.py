from __future__ import print_function
import boto3
import gzip
import base64
import json
import os
import uuid
import pkgutil
import asyncio
from importlib import import_module

source_type = ''
output_type = ''
queue_url = ''
lambda_array = []

def dynamic_import(abs_module_path, class_name):
    module_object = import_module(abs_module_path)
    target_class = getattr(module_object, class_name)
    return target_class

# process an event
async def process_event(record, context):
    # if we have a set of combined functions, run them all, otherwise just run this one
    if len(lambda_array) > 1:
        new_event = record
        for fnc in lambda_array:
            new_event = await fnc['function'](new_event, context)
        processed_result = new_event
    else:
        processed_result = await furnace.processEvent(record, context)

    return processed_result

# specific case to process AWS logs
def process_awslogs(event):
    data = event['awslogs']['data']
    compressed_payload = base64.b64decode(data)
    if compressed_payload[0:2] == b'\x1f\x8b':
        uncompressed_payload = gzip.decompress(compressed_payload)
        payload = json.loads(uncompressed_payload)
    else:
        payload = json.loads(compressed_payload)
  
    log_events = payload['logEvents']
    return log_events

# decode incoming kinesis data
def process_kinesis(event):
    records = event['Records']
    events = []
    
    for record in records:
        kinesis_event = record['kinesis']
        data = kinesis_event['data']
        payload = base64.b64decode(data)
        events.append(json.loads(payload))
    
    return events

#decode incoming SQS data
def process_sqs(event):
    records = event['Records']
    events = []
    
    for record in records:
        data = record['body']
        events.append(json.loads(data))
    
    return events
        
# define a passthrough for when we have no clue what an event is
def passtrough(event):
    return event

# handle events based on the structure
def handler(event, context):
    global output_type
    global source_type
    global queue_url

    if 'awslogs' in event:
        processed_events = process_awslogs(event)
    elif 'Records' in event:
        if event['Records'][0]['eventSource'] == 'aws:kinesis':
            source_type = 'aws.kinesis.stream'
            processed_events = process_kinesis(event)
        elif event['Records'][0]['eventSource'] == 'aws:sqs':
            source_type = 'aws.sqs.queue'
            processed_events = process_sqs(event)
        else:
            raise TypeError('Unsupported event type: ' + event['Records'][0]['eventSource'])
    else:
        processed_events = passtrough(event)
    
    
    processed_records = []
    futures = [process_event(record, context) for record in processed_events]
    loop = asyncio.new_event_loop()
    done, _ = loop.run_until_complete(asyncio.wait(futures))
    loop.stop()
    loop.run_forever()
    loop.close()

    for fut in done:
        # the structure is different depending on if we output SQS or kinesis
        # deciding between kinesis/SQS output is based on input and on whether we have OUTPUT_TYPE
        if os.environ.get('OUTPUT_TYPE', source_type) == 'aws.kinesis.stream':
            output_type = 'aws.kinesis.stream'
            record = {'Data': json.dumps(fut.result()),'PartitionKey': os.environ['PARTITION_KEY']}
            processed_records.append(record)
        elif os.environ.get('OUTPUT_TYPE', source_type) == 'aws.sqs.queue':
            output_type = 'aws.sqs.queue'
            record = {'MessageBody': json.dumps(fut.result()),'Id': str(uuid.uuid4())}
            processed_records.append(record)
            # get also the output queue url if we don't have it yet
            if queue_url == '':
                queue_url = boto3.client('sqs', region_name=os.environ['AWS_REGION']).get_queue_url(QueueName=os.environ['STREAM_NAME'])['QueueUrl']

    # output based on the input and on whether we have an output type defined or not
    if len(processed_records) > 0 and 'STREAM_NAME' in os.environ:
        if output_type == 'aws.kinesis.stream':
            kinesis_client = boto3.client('kinesis', region_name=os.environ['AWS_REGION'])
            put_response = kinesis_client.put_records(Records=processed_records, StreamName=os.environ['STREAM_NAME'])
        elif output_type == 'aws.sqs.queue':
            sqs_client = boto3.client('sqs', region_name=os.environ['AWS_REGION'])
            put_response = sqs_client.send_message_batch(QueueUrl=queue_url, Entries=processed_records)

    return 'Successfully processed {} records.'.format(len(processed_events))

if 'COMBINED' in os.environ:
    BASE_PATH = os.path.dirname(__file__) + '/combined/'

    for (a, name, c) in pkgutil.iter_modules([BASE_PATH]):
        if os.path.isdir(BASE_PATH + '/' + name + '/aws'):
            lambda_array.append({'name': name, 'function': dynamic_import('combined.' + name + '.aws.furnace', 'lambda_handler')})
        else:
            lambda_array.append({'name': name, 'function': dynamic_import('combined.' + name + '.furnace', 'lambda_handler')})
else:
    if os.path.isdir(os.path.dirname(__file__) + '/aws'):
        import aws.furnace as furnace
    else:
        import furnace
