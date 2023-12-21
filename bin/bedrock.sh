#!/bin/bash

echo "Waiting for the stack creation to complete..."

# createAgentOutput=$(aws bedrock-agent create-agent --agent-name test-agent-11 \
# --instruction "You are a powerful, helpful, honest, and harmless AI systems." \
# --foundation-model anthropic.claude-v2 \
# --agent-resource-role-arn arn:aws:iam::629244530291:role/service-role/AmazonBedrockExecutionRoleForAgents_5P7SHSPN6QX \
# --prompt-override-configuration file://bin/bedrock.json \
# --output json
# )

# agentId=$(echo "$createAgentOutput" | jq -r '.agent.agentId')

# echo $agentId



# agentAliasId="TSTALIASID"

# echo $agentId
# echo "agentAliasId: $agentAliasId"

kbS3Arn='arn:aws:s3:::kb-piyao.com'
kbRoleArn='arn:aws:iam::629244530291:role/DebugGenAIBuilderIAMUserR-GenAiBuilderKBbedrockRole-mYMwXAjgAYur'
kbEmbeddingModelArn='arn:aws:bedrock:us-east-1::foundation-model/amazon.titan-embed-text-v1'

aws opensearchserverless create-security-policy \
  --name genai-kb-opensearch-policy \
  --type encryption --policy "{\"Rules\":[{\"ResourceType\":\"collection\",\"Resource\":[\"collection\/genai-kb-opensearch\"]}],\"AWSOwnedKey\":true}"

createCollection=$(aws opensearchserverless create-collection --name "genai-kb-opensearch" --type VECTORSEARCH --description "A collection for Genai builder Knowledge base")
echo $createCollection
createCollectionArn=$(echo $createCollection | jq -r '.createCollectionDetail.arn')
echo $createCollectionArn

bedrockAgent=$(aws bedrock-agent create-knowledge-base \
--name GenAIBuilder-Knowledge-Base-1 \
--role-arn $kbRoleArn \
--knowledge-base-configuration "type=string,vectorKnowledgeBaseConfiguration={embeddingModelArn=$kbEmbeddingModelArn}" \
--storage-configuration "type=string,opensearchServerlessConfiguration={collectionArn=$createCollectionArn,vectorIndexName=bedrock-knowledge-base-default-index,fieldMapping={vectorField=bedrock-knowledge-base-default-vector,textField=AMAZON_BEDROCK_TEXT_CHUNK,metadataField=AMAZON_BEDROCK_METADATA}}"
)

aws bedrock-agent create-knowledge-base \
--name GenAIBuilder-Knowledge-Base-1 \
--role-arn arn:aws:iam::629244530291:role/DebugGenAIBuilderIAMUserR-GenAiBuilderKBbedrockRole-mYMwXAjgAYur \
--knowledge-base-configuration "type=string,vectorKnowledgeBaseConfiguration={embeddingModelArn=arn:aws:bedrock:us-east-1::foundation-model/amazon.titan-embed-text-v1}" \
--storage-configuration "type=string,opensearchServerlessConfiguration={collectionArn=arn:aws:aoss:us-east-1:629244530291:collection/1d5lrq6b887z7plaww2f,vectorIndexName=bedrock-knowledge-base-default-index,fieldMapping={vectorField=bedrock-knowledge-base-default-vector,textField=AMAZON_BEDROCK_TEXT_CHUNK,metadataField=AMAZON_BEDROCK_METADATA}}"


echo $bedrockAgent

# $(aws bedrock-agent create-data-source \
# --knowledge-base-id GenAIBuilder-Knowledge-Base-ID \
# --name GenAIBuilder-Knowledge-Base \
# --data-source-configuration type=string,s3Configuration={bucketArn=$kbS3Arn} \
# --vector-ingestion-configuration chunkingConfiguration={chunkingStrategy=FIXED_SIZE,fixedSizeChunkingConfiguration={maxTokens=1000,overlapPercentage=20}}
# )