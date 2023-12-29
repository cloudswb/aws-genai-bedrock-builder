import { BedrockAgentClient, CreateKnowledgeBaseCommand, ListKnowledgeBasesCommand, ListDataSourcesCommand, GetDataSourceCommand } from "@aws-sdk/client-bedrock-agent"; // ES Modules import
// const { BedrockAgentClient, ListKnowledgeBasesCommand } = require("@aws-sdk/client-bedrock-agent"); // CommonJS import

import { OpenSearchServerlessClient, CreateCollectionCommand } from "@aws-sdk/client-opensearchserverless"; // ES Modules import
// const { OpenSearchServerlessClient, CreateCollectionCommand } = require("@aws-sdk/client-opensearchserverless"); // CommonJS import

const region = process.env.REGION;
const agentClient = new BedrockAgentClient({ region: region });
const ossClient = new OpenSearchServerlessClient({ region: region });

export const handler = async (event) => {

  console.log('event:', event);

  let param = {}
  if(event.headers.auth =='iam'){
    let decodedString = Buffer.from(event.body, 'base64').toString('utf-8');
    console.log('decodedString:', decodedString);
    param = JSON.parse(decodedString);
  }
  else{
    param = JSON.parse(event.body);
  }

  if (!param.hasOwnProperty("actionType") || param.actionType == undefined || param.actionType == "") {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Invalid actionType' })
    };
  }

  // Check if there are any query parameters
  // Access individual parameters

  const actionType = param.actionType;

  // Your business logic goes here, using the parameters as needed
  console.log('actionType:', actionType);

  if (actionType === 'create') {
    if (!param.hasOwnProperty("kbName") || param.kbName == undefined || param.kbName == "") {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Invalid kbName' })
      };
    }

    const kbName = param.kbName;
    console.log('kbName:', kbName);
    // return await createKb(kbName);
  }
  else if (actionType === 'listKb') {
    return await listKb()
  }
  else if (actionType === 'listKBDataSource') {
    if (!param.hasOwnProperty("knowledgeBaseId") || param.knowledgeBaseId == undefined || param.knowledgeBaseId == "") {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Invalid knowledgeBaseId' })
      };
    }
    const knowledgeBaseId = param.knowledgeBaseId;
    return await listKBDataSource(knowledgeBaseId)
  }
  else if (actionType === 'getDataSourceDetail') {
    if (!param.hasOwnProperty("knowledgeBaseId") || param.knowledgeBaseId == undefined || param.knowledgeBaseId == "") {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Invalid knowledgeBaseId' })
      };
    }
    const knowledgeBaseId = param.knowledgeBaseId;

    if (!param.hasOwnProperty("dataSourceId") || param.dataSourceId == undefined || param.dataSourceId == "") {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Invalid dataSourceId' })
      };
    }
    const dataSourceId = param.dataSourceId;
    return await getDataSourceDetail(knowledgeBaseId, dataSourceId)
  }
  else {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Action Type Invalid.' }),
    };
  }


};


// export const createKb = async (name, clientToken) => {
//   const collectionArn = createOssCollection();

//   const input = { // CreateKnowledgeBaseRequest
//     name: name,
//     clientToken: "1b250368-cffc-4653-a05f-3f1d234e0825",
//     roleArn: "arn:aws:iam::629244530291:role/service-role/AmazonBedrockExecutionRoleForKnowledgeBase_role", // required
//     knowledgeBaseConfiguration: { // KnowledgeBaseConfiguration
//       type: "VECTOR", // required
//       vectorKnowledgeBaseConfiguration: { // VectorKnowledgeBaseConfiguration
//         embeddingModelArn: `arn:aws:bedrock:${region}::foundation-model/amazon.titan-embed-text-v1`, // required
//       },
//     },
//     storageConfiguration: { // StorageConfiguration
//       type: "OPENSEARCH_SERVERLESS", // required
//       opensearchServerlessConfiguration: { // OpenSearchServerlessConfiguration
//         collectionArn: collectionArn, // required
//         vectorIndexName: "bedrock-knowledge-base-default-index", // required
//         fieldMapping: { // OpenSearchServerlessFieldMapping
//           vectorField: "bedrock-knowledge-base-default-vector", // required
//           textField: "AMAZON_BEDROCK_TEXT_CHUNK", // required
//           metadataField: "AMAZON_BEDROCK_METADATA", // required
//         },
//       },
//     }
//   };
//   const command = new CreateKnowledgeBaseCommand(input);
//   const response = await agentClient.send(command);
// }

export const createOssCollection = async () => {

  const input = { // CreateCollectionRequest
    name: "STRING_VALUE", // required
    type: "VECTORSEARCH",
    description: "STRING_VALUE",
    // tags: [ // Tags
    //   { // Tag
    //     key: "STRING_VALUE", // required
    //     value: "STRING_VALUE", // required
    //   },
    // ],
    // standbyReplicas: "STRING_VALUE",
    // clientToken: "STRING_VALUE",
  };
  const command = new CreateCollectionCommand(input);
  const response = await ossClient.send(command);
  return response.arn;
}

export const listKb = async () => {
  // TODO implement

  const input = {
    maxResults: 10,
  };

  console.log("input:", input);
  const command = new ListKnowledgeBasesCommand(input);
  const responseData = await agentClient.send(command);
  console.log("listKb responseData:", JSON.stringify(responseData.knowledgeBaseSummaries));

  const response = {
    statusCode: 200,
    body: responseData.knowledgeBaseSummaries, //JSON.stringify(responseData.knowledgeBaseSummaries),
  };
  return response;
}

export const listKBDataSource = async (knowledgeBaseId) => {

  const input = { // ListDataSourcesRequest
    knowledgeBaseId: knowledgeBaseId, // required
    maxResults: 20,
  };
  const command = new ListDataSourcesCommand(input);
  const responseData = await agentClient.send(command);
  console.log("listKBDataSource responseData:", responseData);

  const response = {
    statusCode: 200,
    body:responseData.dataSourceSummaries, // JSON.stringify(responseData.dataSourceSummaries),
  };
  return response;
}

export const getDataSourceDetail = async (knowledgeBaseId, dataSourceId) => {

  const input = { // GetDataSourceRequest
    knowledgeBaseId: knowledgeBaseId, // required
    dataSourceId: dataSourceId, // required
  };
  const command = new GetDataSourceCommand(input);
  const responseData = await agentClient.send(command);
  console.log("getDataSourceDetail responseData:", responseData);
  console.log("responseData.dataSource.dataSourceConfiguration:", responseData.dataSource.dataSourceConfiguration.s3Configuration);

  const response = {
    statusCode: 200,
    body: responseData.dataSource.dataSourceConfiguration.s3Configuration, //JSON.stringify(responseData.dataSource.dataSourceConfiguration.s3Configuration),
  };
  return response;
}
