#!/bin/bash

prefix=$1
if [ -z "$prefix" ]; then
  prefix="GenAIBuilder"
fi

echo $prefix

echo "Waiting for the stack creation to complete..."

echo "Start check the crenditional info..."
configRegion=$(aws configure get region)
echo $configRegion

callerIdentity=$(aws sts get-caller-identity)
echo $callerIdentity
callerAccount=$(echo $callerIdentity | jq -r '.Account')
callerUserArn=$(echo $callerIdentity | jq -r '.Arn')
echo $callerAccount
echo $callerUserArn

echo "Start initialize the cdk bootstrap..."
cd bin/
cdk bootstrap aws://$callerAccount/$configRegion
cd ..
echo "Finished initialize the cdk bootstrap..."