from __future__ import print_function
import boto3
import gzip
import base64
import json
import os
import pkgutil
import asyncio
from importlib import import_module

def dynamic_import(abs_module_path, class_name):
    module_object = import_module(abs_module_path)
    target_class = getattr(module_object, class_name)
    return target_class

async def process_event(record, context):
    if len(lambda_array) > 1:
        new_event = record
        for fnc in lambda_array:
            new_event = await fnc['function'](new_event, context)
        processed_result = new_event
    else:
        processed_result = await furnace.processEvent(record, context)

    return processed_result

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

def process_kinesis(event):
    records = event['Records']
    events = []
    
    for record in records:
        kinesis_event = record['kinesis']
        data = kinesis_event['data']
        payload = base64.b64decode(data)
        events.append(json.loads(payload))
    
    return events
        

def passtrough(event):
    return event

def handler(event, context):
    
    if 'awslogs' in event:
        processed_events = process_awslogs(event)
    elif 'Records' in event:
        processed_events = process_kinesis(event)
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
        record = {'Data': json.dumps(fut.result()),'PartitionKey': os.environ['PARTITION_KEY']}
        processed_records.append(record)

    if len(processed_records) > 0 and 'STREAM_NAME' in os.environ:
        kinesis_client = boto3.client('kinesis', region_name=os.environ['AWS_REGION'])
        put_response = kinesis_client.put_records(Records=processed_records, StreamName=os.environ['STREAM_NAME'])

    return 'Successfully processed {} records.'.format(len(processed_events))

lambda_array = []

if 'COMBINED' in os.environ:
    BASE_PATH = os.path.dirname(__file__) + '/combined/'

    for (a, name, c) in pkgutil.iter_modules([BASE_PATH]):
        lambda_array.append({'name': name, 'function': dynamic_import('combined.' + name + '.furnace', 'lambda_handler')})
else:
    import furnace
