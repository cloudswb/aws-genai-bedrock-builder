#!/bin/bash

prefix=$1
if [ -z "$prefix" ]; then
  prefix="GenAIBuilder"
fi

echo $prefix


echo "Starting to destroy all resources..."

outputs=$(cat src/frontend/backend.json)
agentId=$(echo $outputs | jq -r '.agentId')
echo $agentId

aws bedrock-agent delete-agent --agent-id $agentId

echo "Start check the crenditional info..."
callerIdentity=$(aws sts get-caller-identity)
echo $callerIdentity
callerUserArn=$(echo $callerIdentity | jq -r '.Arn')
echo $callerUserArn



outputs=$(cat src/frontend/backend.json)

kbS3Arn=$(echo $outputs | jq -r ".${prefix}IAMUserRoleStack.kbS3Arn")
kbRoleArn=$(echo $outputs | jq -r ".${prefix}OpenSearchVectorDBStack.kbRoleArn")
collectionArn=$(echo $outputs | jq -r ".${prefix}OpenSearchVectorDBStack.CollectionArn")


cdk destroy --all --force --context target=backend  --context prefix=$prefix --context callerUserArn=$callerUserArn
cdk destroy --all --force --context target=kb --context prefix=$prefix  --context collectionArn=$collectionArn --context kbRoleArn=$kbRoleArn --context kbS3Arn=$kbS3Arn
cdk destroy --all --force --context target=frontend  --context prefix=$prefix 
aws dynamodb delete-table --table-name "$prefix"RecordsTable