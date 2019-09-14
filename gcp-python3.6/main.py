from google.cloud import pubsub_v1
import base64
import os
import pkgutil
import json
import asyncio
from importlib import import_module


def dynamic_import(abs_module_path, class_name):
    module_object = import_module(abs_module_path)
    target_class = getattr(module_object, class_name)
    return target_class

def message_sent_callback(message_future):
    # When timeout is unspecified, the exception method waits indefinitely.
    if message_future.exception(timeout=30):
        print('Publishing message threw an Exception {}.'.format(message_future.exception()))
    else:
        print(message_future.result())

async def process(data, context):
    """Background Cloud Function.
    Args:
         data (dict): The dictionary with data specific to the given event.
         context (google.cloud.functions.Context): The Cloud Functions event
         metadata.
    """

    if 'data' in data:
        event = json.loads(base64.b64decode(data['data']).decode('utf-8'))

        if event is not None:
            if len(lambda_array) > 1:
                new_event = event
                for fnc in lambda_array:
                    new_event = await fnc['function'](new_event, context)
                processed_result = new_event
            else:
                processed_result = await furnace.processEvent(event, context)

            if 'STREAM_NAME' in os.environ:
                publisher = pubsub_v1.PublisherClient()
                topic_path = publisher.topic_path(os.getenv('GCP_PROJECT'), os.getenv('STREAM_NAME'))

                data = str(json.dumps(processed_result)).encode('utf-8')
                
                # When you publish a message, the client returns a Future.
                message_future = publisher.publish(topic_path, data=data)
                message_future.add_done_callback(message_sent_callback)

lambda_array = []

if 'COMBINED' in os.environ:
    BASE_PATH = os.path.dirname(__file__) + '/combined/'

    for (a, name, c) in pkgutil.iter_modules([BASE_PATH]):
        if os.path.isdir(BASE_PATH + '/' + name + '/gcp'):
            lambda_array.append({'name': name, 'function': dynamic_import('combined.' + name + '.gcp.furnace', 'lambda_handler')})
        else:
            lambda_array.append({'name': name, 'function': dynamic_import('combined.' + name + '.furnace', 'lambda_handler')})
else:
    if os.path.isdir(os.path.dirname(__file__) + '/gcp'):
        import gcp.furnace as furnace
    else:
        import furnace
