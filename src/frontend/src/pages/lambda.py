import boto3
import json

brt = boto3.client(service_name='bedrock-runtime')

body = json.dumps({
    'prompt': '\n\nHuman: write an essay for living on mars in 1000 words\n\nAssistant:',
    'max_tokens_to_sample': 100
})
                   
response = brt.invoke_model_with_response_stream(
    modelId='anthropic.claude-v2', 
    body=body
)
    
stream = response.get('body')
if stream:
    for event in stream:
        chunk = event.get('chunk')
        if chunk:
            print(json.loads(chunk.get('bytes').decode()))











import sys
from pip._internal import main

main(['install', '-I', '-q', 'boto3', '--target', '/tmp/', '--no-cache-dir', '--disable-pip-version-check'])
sys.path.insert(0,'/tmp/')

import boto3
import json

brt = boto3.client(service_name='bedrock-runtime')

def lambda_handler(event, context):
    
    print("Received event: " + json.dumps(event))
    
     # Access POST parameters from the event object
    try:
        # Check if 'event' attribute is present in the event
        # if 'event' not in event:
        #     raise ValueError('Request event is missing')
        
        # Access individual parameters
        modelId = event.get('modelId', 'anthropic.claude-v2')
        max_tokens_to_sample = event.get('max_tokens_to_sample', 200)
        temperature = event.get('temperature', 0.1)
        top_p = event.get('top_p', 0.9)
        prompt = event.get('prompt')
        if not prompt:
            raise ValueError('Request prompt should not empty')
        
        # Compose the Bedrock request parameter.
        prompt_body = json.dumps({
            "prompt": prompt,
            "max_tokens_to_sample": max_tokens_to_sample, 
            "temperature": temperature,
            "top_p": top_p
        })

        accept = 'application/json'
        contentType = 'application/json'
        
        response = brt.invoke_model(body=prompt_body, modelId=modelId, accept=accept, contentType=contentType)
        response_body = json.loads(response.get('body').read())
        print(response_body.get('completion'))
        
        response = {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'OPTIONS,POST,GET'
            },
            'body': response_body.get('completion')
        }
    except Exception as e:
        response = {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }

    return response
    
    
    # body = json.dumps({
    #     "prompt": "\n\nHuman: What is EC2?\n\nAssistant:",
    #     "max_tokens_to_sample": 300,
    #     "temperature": 0.1,
    #     "top_p": 0.9,
    # })
    
    # modelId = 'anthropic.claude-v2'
    # accept = 'application/json'
    # contentType = 'application/json'
    
    # response = brt.invoke_model(body=body, modelId=modelId, accept=accept, contentType=contentType)
    
    # response_body = json.loads(response.get('body').read())
    # # text
    # print(response_body.get('completion'))
    
    # # TODO implement
    # return {
    #     'statusCode': 200,
    #     'body': response_body.get('completion')
    # }
