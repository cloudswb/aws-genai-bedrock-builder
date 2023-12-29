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


### 1. Deploy CDK stack and output to file 
echo "Start to use CDK to deploy..."
cdk deploy --all --require-approval never --context target=backend --context callerUserArn=$callerUserArn --outputs-file src/frontend/backend.json
echo "Waiting for the stack creation to complete..."

# Wait until deploy finishes 
while [ ! -f src/frontend/backend.json ] || [ ! -s src/frontend/backend.json ]
do
  sleep 5
done

echo "The stack creation completed!"

# Load outputs and extract values
outputs=$(cat src/frontend/backend.json)
agentRoleArn=$(echo $outputs | jq -r ".${prefix}IAMUserRoleStack.agentRoleArn")

kbS3Arn=$(echo $outputs | jq -r ".${prefix}IAMUserRoleStack.kbS3Arn")
LambdaIamUserArn=$(echo $outputs | jq -r ".${prefix}IAMUserRoleStack.LambdaIamUserArn") 
lambdaIamUserAccessKey=$(echo $outputs | jq -r ".${prefix}IAMUserRoleStack.lambdaIamUserAccessKey") 
lambdaIamUserSecretKey=$(echo $outputs | jq -r ".${prefix}IAMUserRoleStack.lambdaIamUserSecretKey") 
bedrockAgentAuth=$(echo $outputs | jq -r ".${prefix}IAMUserRoleStack.auth") 
REGION=$(echo $outputs | jq -r ".${prefix}IAMUserRoleStack.region")
kbRoleArn=$(echo $outputs | jq -r ".${prefix}OpenSearchVectorDBStack.kbRoleArn")
collectionId=$(echo $outputs | jq -r ".${prefix}OpenSearchVectorDBStack.CollectionId")
collectionArn=$(echo $outputs | jq -r ".${prefix}OpenSearchVectorDBStack.CollectionArn")
AgentLLMName=$(echo $outputs | jq -r ".${prefix}LambdaFunctionStack.AgentLLMName")

echo "CDK deploy frist stage  completed"

### 2. create bedrock agent

echo "Starting create bedrock agent..."

getAgentList=$(aws bedrock-agent list-agents --output json)
# echo $getAgentList
agentId=$(echo "$getAgentList" | jq -r '.agentSummaries[] | select(.agentName == "genai-builder-agent") | .agentId')
echo "$agentId"

agentAliasId=""
if [ -z "$agentId" ]; then
  echo "No matched agent."

  createAgentOutput=$(aws bedrock-agent create-agent --agent-name genai-builder-agent \
  --instruction "You are a powerful, helpful, honest, and harmless AI systems." \
  --foundation-model $AgentLLMName \
  --agent-resource-role-arn $agentRoleArn \
  --prompt-override-configuration file://bin/bedrock.json \
  --output json
  )
  echo $createAgentOutput
  agentId=$(echo "$createAgentOutput" | jq -r '.agent.agentId')
  echo "Finished create bedrock agent..."
  sleep 30
  echo "Starting prepare bedrock agent..."
  aws bedrock-agent prepare-agent --agent-id $agentId
  echo "Finished prepare bedrock agent..."
  sleep 10

  echo "Starting create bedrock agent alias for $agentId ..."
  createAgentAliasOutput=$(aws bedrock-agent create-agent-alias --agent-id $agentId --agent-alias-name genai-builder-alias-prod)
  echo $createAgentAliasOutput
  agentAliasId=$(echo "$createAgentAliasOutput" | jq -r '.agentAlias.agentAliasId')
  echo "Finished create bedrock agent alias $agentAliasId for $agentId ..."

else
  getAgentAliasList=$(aws bedrock-agent list-agent-aliases --agent-id $agentId --output json)
  # echo $getAgentAliasList
  agentAliasId=$(echo "$getAgentAliasList" | jq -r '.agentAliasSummaries[] | select(.agentAliasName == "genai-builder-alias-prod") | .agentAliasId')

  if [ -z "$agentAliasId" ]; then
      echo "Starting prepare bedrock agent..."
      aws bedrock-agent prepare-agent --agent-id $agentId
      echo "Finished prepare bedrock agent..."
      sleep 10

      echo "Starting create bedrock agent alias for $agentId ..."
      createAgentAliasOutput=$(aws bedrock-agent create-agent-alias --agent-id $agentId --agent-alias-name genai-builder-alias-prod)
      echo $createAgentAliasOutput
      agentAliasId=$(echo "$createAgentAliasOutput" | jq -r '.agentAlias.agentAliasId')
      echo "Finished create bedrock agent alias $agentAliasId for $agentId ..."
  else
    echo $agentAliasId
  fi

fi

### 3. create opensearch

echo "Start create opensearch collection index ..."
sleep 30
awscurl --service aoss --region $REGION \
  -X PUT \
  -H "Content-Type: application/json" \
  -d @bin/index.json \
  https://$collectionId.$REGION.aoss.amazonaws.com/bedrock-knowledge-base-default-index
echo "Finished create opensearch collection index ..."

### 4. create kb & datasource
echo "Appending bedrock agent ..."
outputs=$(echo "$outputs" | jq ". + {agentId: \"${agentId}\", agentAlias: \"${agentAliasId}\", prefix: \"${prefix}\"}")
echo $outputs > src/frontend/backend.json

echo "Start create KB datasource ..."
kbOutput=$(cdk deploy --all --require-approval never --context target=kb --context collectionArn=$collectionArn --context kbRoleArn=$kbRoleArn --context kbS3Arn=$kbS3Arn)
# outputs=$(echo $outputs $kbOutput | jq -s add)
echo "Finished create KB datasource ..."


echo "Finished output bedrock agent json file..."

cd src/frontend/
npm install
npm run build
cd ../../
cdk deploy --all --require-approval never --context target=frontend --outputs-file src/frontend/frontend.json

echo "All deploy tasks are done..."