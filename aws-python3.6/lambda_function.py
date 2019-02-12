from __future__ import print_function
import boto3
import handler
import base64
import json
import os
import asyncio

STREAM_NAME = ""
AWS_REGION = os.environ["AWS_REGION"]

try:
    STREAM_NAME = os.environ["STREAM_NAME"]
except:
    pass

async def process_event(record):
    payload = base64.b64decode(record['kinesis']['data'])
    processed_result = await handler.processEvent(payload)
    return processed_result


print('Loading function')

def lambda_handler(event, context):

    processed_records = []
    futures = [process_event(record) for record in event['Records']]
    loop = asyncio.get_event_loop()
    done, _ = loop.run_until_complete(asyncio.wait(futures))
    loop.close()

    for fut in done:
        record = {'Data': json.dumps(fut.result()),'PartitionKey': os.environ["PARTITION_KEY"]}
        processed_records.append(record)


    if len(processed_records) > 0 and STREAM_NAME:
        print(AWS_REGION)
        print(STREAM_NAME)
        kinesis_client = boto3.client('kinesis', region_name=AWS_REGION)
        put_response = kinesis_client.put_records(Records=processed_records, StreamName=STREAM_NAME)
        print(put_response)

    return 'Successfully processed {} records.'.format(len(event['Records']))

