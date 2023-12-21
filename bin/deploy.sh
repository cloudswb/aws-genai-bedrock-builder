#!/bin/bash

echo "Waiting for the stack creation to complete..."

echo "Target is: $1" 
target=$1

if [ "$target" == "backend" ]; then

  # 1. Deploy CDK stack and output to file 
  cdk deploy --all --require-approval never --context target=$target --outputs-file src/frontend/backend.json

  echo "Waiting for the stack creation to complete..."
  # Wait until deploy finishes 
  while [ ! -f src/frontend/backend.json ] || [ ! -s src/frontend/backend.json ]
  do
    sleep 5
  done

  echo "Tthe stack creation completed!"

  # Load outputs and extract values
  outputs=$(cat src/frontend/backend.json)

  # if [ -f src/frontend/config.js ]; then
  #   rm config.js
  # fi

  # value=$(echo $outputs | jq -r '.DynamoDBStack.RecordsTableName') 
  kbRoleArn=$(echo $outputs | jq -r '.DebugGenAIBuilderIAMUserRoleStack.kbRoleArn')
  kbS3Arn=$(echo $outputs | jq -r '.DebugGenAIBuilderIAMUserRoleStack.kbS3Arn')
  LambdaIamUserArn=$(echo $outputs | jq -r '.DebugGenAIBuilderIAMUserRoleStack.LambdaIamUserArn') 
  lambdaIamUserAccessKey=$(echo $outputs | jq -r '.DebugGenAIBuilderIAMUserRoleStack.lambdaIamUserAccessKey') 
  lambdaIamUserSecretKey=$(echo $outputs | jq -r '.DebugGenAIBuilderIAMUserRoleStack.lambdaIamUserSecretKey') 
  bedrockAgentAuth=$(echo $outputs | jq -r '.DebugGenAIBuilderIAMUserRoleStack.auth') 
  REGION=$(echo $outputs | jq -r '.DebugGenAIBuilderIAMUserRoleStack.region') 
  kbEmbeddingModelArn='arn:aws:bedrock:us-east-1::foundation-model/amazon.titan-embed-text-v1'

  backend_json=$(cat src/frontend/backend.json)

  echo "CDK deploy frist stage  completed"

  ## 2. create bedrock agent
  # createAgentOutput=$(aws bedrock-agent create-agent --agent-name GenAIBuilderBedrockAgent-1 \
  # --instruction "You are a powerful, helpful, honest, and harmless AI systems." \
  # --foundation-model anthropic.claude-v2 \
  # --agent-resource-role-arn $kbRoleArn \
  # --prompt-override-configuration file://bin/bedrock.json \
  # --output json
  # )

  # echo "Starting create bedrock agent..."
  # echo $kbRoleArn

  # createAgentOutput=$(aws bedrock-agent create-agent --agent-name test-agent-16 \
  # --instruction "You are a powerful, helpful, honest, and harmless AI systems." \
  # --foundation-model anthropic.claude-v2 \
  # --agent-resource-role-arn arn:aws:iam::629244530291:role/DebugGenAIBuilderIAMUserR-GenAiBuilderKBbedrockRole-mYMwXAjgAYur \
  # --prompt-override-configuration file://bin/bedrock.json \
  # --output json
  # )

  # # --agent-resource-role-arn arn:aws:iam::629244530291:role/service-role/AmazonBedrockExecutionRoleForAgents_5P7SHSPN6QX \
  # #                           arn:aws:iam::629244530291:role/DebugGenAIBuilderIAMUserR-GenAiBuilderKBbedrockRole-mYMwXAjgAYur

  # agentId=$(echo "$createAgentOutput" | jq -r '.agent.agentId')

  # echo "agentId:"
  # echo $agentId


  # aws bedrock-agent prepare-agent --agent-id $agentId
  # agentAliasOutput=$(aws bedrock-agent create-agent-alias --agent-id $agentId --agent-alias-name GenAIBuilderBedrockAgent-Alias)
  # agentAlias=$(echo "$agentAliasOutput" | jq -r '.agentAlias.agentAliasId')

  # backend_json=$(echo $backend_json | jq '.bedrockAgentId='.$agentId.'')

  # Define the variable to use as the property value  


  # Use jq to add new property with variable value
  # backend_json=$(echo "$backend_json" | jq --arg val "$agentId" '.agentId = $val')


  # backend_json=$(echo "$backend_json" | jq --arg agentId "$agentId" --arg agentAlias "$agentAlias" '. + {agentId: $agentId, agentAlias: $agentAlias}')
  backend_json=$(echo "$backend_json" | jq --arg agentId "$agentId" --arg agentAlias "$agentAlias" '. + {agentId: "", agentAlias: ""}')

  echo $backend_json > src/frontend/backend.json

  echo "End create bedrock agent..."
  ## 3. create kb

  # # echo "Start create bedrock knowledge base..."
  # createKbOutput=$(aws bedrock-agent create-knowledge-base \
  # --name GenAIBuilder-Knowledge-Base \
  # --role-arn $kbRoleArn \
  # --knowledge-base-configuration type=string,vectorKnowledgeBaseConfiguration={embeddingModelArn=$kbEmbeddingModelArn} \
  # --storage-configuration type=string,opensearchServerlessConfiguration={collectionArn=$kbRoleArn,vectorIndexName=bedrock-knowledge-base-default-index,fieldMapping={vectorField=bedrock-knowledge-base-default-vector,textField=AMAZON_BEDROCK_TEXT_CHUNK,metadataField=AMAZON_BEDROCK_METADATA}}
  # )
  # echo $createKbOutput
  # echo "End create bedrock knowledge base..."


  ## 4. create kb datasource

  # echo "Start create bedrock knowledge base datasource..."
  # createKbDatasourceOutput=$(aws bedrock-agent create-data-source \
  # --knowledge-base-id GenAIBuilder-Knowledge-Base-ID \
  # --name GenAIBuilder-Knowledge-Base \
  # --data-source-configuration type=string,s3Configuration={bucketArn=$kbS3Arn} \
  # --vector-ingestion-configuration chunkingConfiguration={chunkingStrategy=FIXED_SIZE,fixedSizeChunkingConfiguration={maxTokens=1000,overlapPercentage=20}}
  # )
  # echo $createKbDatasourceOutput
  # echo "End create bedrock knowledge base datasource..."

  # ## 5. run CDK deploy website
  # echo "Start deploy website..."
  # # echo $value > $output_file


  # echo "End deploy website..."

  # Print value
  # echo "LambdaIamUserArn is: $LambdaIamUserArn"
  # echo "lambdaIamUserAccessKey is: $lambdaIamUserAccessKey"
  # echo "lambdaIamUserSecretKey is: $lambdaIamUserSecretKey"
  # echo "AUTH is: $AUTH"
  # echo "REGION is: $REGION"

  echo "All deploy task has finished."


  # Read JSON content 
  # configJson=$(cat src/frontend/backend.json)

  ## DynamoDB table name
  # PROJECT_NAME="zk" 
  # TABLE_NAME="$PROJECT_NAME-genai-builder-logs" 

  # aws dynamodb create-table \
  #     --table-name $TABLE_NAME \
  #     --attribute-definitions \
  #         AttributeName=username,AttributeType=S \
  #         AttributeName=logid,AttributeType=S \
  #     --key-schema \
  #         AttributeName=username,KeyType=HASH \
  #         AttributeName=logid,KeyType=RANGE \
  #     --provisioned-throughput \
  #         ReadCapacityUnits=5,WriteCapacityUnits=5

  # if [ $? -eq 0 ]; then
  #   echo "DynamoDB table '$TABLE_NAME' created successfully."
  #   exit 1
  # else
  #   echo "Failed to create DynamoDB table '$TABLE_NAME'"
  #   exit 1
  # fi

elif [ "$target" == "frontend" ]; then
  cdk deploy --all --require-approval never --context target=$target --outputs-file src/frontend/frontend.json

fi