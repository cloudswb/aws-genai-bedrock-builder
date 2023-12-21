import { BedrockAgentClient, StartIngestionJobCommand } from "@aws-sdk/client-bedrock-agent"; // ES Modules import
// const { BedrockAgentClient, StartIngestionJobCommand } = require("@aws-sdk/client-bedrock-agent"); // CommonJS import

const region = process.env.REGION;
const client = new BedrockAgentClient( { region: region } );


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
  
  if (!param.hasOwnProperty("knowledgeBaseId") || param.knowledgeBaseId == undefined || param.knowledgeBaseId == "") {
      return {
          statusCode: 400,
          body: JSON.stringify({ message: 'Invalid knowledgeBaseId' })
      };
  }
  if (!param.hasOwnProperty("dataSourceId") || param.dataSourceId == undefined || param.dataSourceId == "") {
      return {
          statusCode: 400,
          body: JSON.stringify({ message: 'Invalid dataSourceId' })
      };
  }
  
  const input = { // StartIngestionJobRequest
    knowledgeBaseId: param.knowledgeBaseId,
    dataSourceId: param.dataSourceId
  };
  const command = new StartIngestionJobCommand(input);
  const responseObj = await client.send(command);

  const response = {
    statusCode: 200,
    body: JSON.stringify(responseObj),
  };
  return response;
};
