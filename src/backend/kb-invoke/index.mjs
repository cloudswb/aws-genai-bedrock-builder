import { BedrockAgentRuntimeClient, RetrieveAndGenerateCommand } from "@aws-sdk/client-bedrock-agent-runtime"; // ES Modules import
// const { BedrockAgentRuntimeClient, RetrieveAndGenerateCommand } = require("@aws-sdk/client-bedrock-agent-runtime"); // CommonJS import

import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
const region = process.env.REGION;
const llm = process.env.LLM;
const dynamodb = new DynamoDBClient( { region: region } );

import moment from 'moment'; 
import {v4 as uuidv4} from 'uuid';


const client = new BedrockAgentRuntimeClient({ region: region });

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

  // Check if the 'event' parameter exists and is an object
  if (!param.hasOwnProperty("prompt") || param.prompt == undefined || param.prompt == "") {
      return {
          statusCode: 400,
          body: JSON.stringify({ message: 'Invalid event parameter prompt' })
      };
  }
  const prompt = param.prompt
  
  if (!param.hasOwnProperty("knowledgeBaseId") || param.knowledgeBaseId == undefined || param.knowledgeBaseId == "") {
      return {
          statusCode: 400,
          body: JSON.stringify({ message: 'Invalid event parameter knowledgeBaseId' })
      };
  }
  const knowledgeBaseId = param.knowledgeBaseId
  
  if (!param.hasOwnProperty("username") || param.username == undefined || param.username == "") {
      return {
          statusCode: 400,
          body: JSON.stringify({ message: 'Invalid event parameter username' })
      };
  }
  const username = param.username;

  const input = { // RetrieveAndGenerateRequest
    input: { // RetrieveAndGenerateInput
      text: prompt, // required
    },
    retrieveAndGenerateConfiguration: { // RetrieveAndGenerateConfiguration
      type: "KNOWLEDGE_BASE", // required
      knowledgeBaseConfiguration: { // KnowledgeBaseRetrieveAndGenerateConfiguration
        knowledgeBaseId: knowledgeBaseId, //"", // required
        modelArn: `arn:aws:bedrock:${region}::foundation-model/${llm}`
      },
    },
  };

  if(param.sessionId != undefined && param.sessionId != "" && param.sessionId != "NONE")
  {
    input.sessionId = param.sessionId;
  }


  console.log("input:", input);

  const command = new RetrieveAndGenerateCommand(input);
  const response = await client.send(command);

  console.log("response:", response)

  // start add log
  const logid = generateUUID();
  const conversationid = uuidv4();
  const now = moment().format();
  const setting = input;
  delete input.input
  const newLog = {
          "logid": logid,
          "conversationid": conversationid,
          "username": username,
          "createtime": now,
          "type": "kbsearch",
          "prompt": prompt,
          "setting": JSON.stringify(setting),
          "question": prompt,
          "answer": JSON.stringify(response)
      }
      
  console.log("newLog:", newLog)
  
  await addGenLog(process.env.RECORDS_TABLENAME, newLog);
  // end add log

  
  // TODO implement
  return {
    statusCode: 200,
    body: response,
  };
};



async function addGenLog(tableName, newItem) {

  try {
    const input = {
      TableName: tableName,
      Item: {
          "logid": {"S": newItem.logid },
          "conversationid": {"S": newItem.conversationid },
          "username": {"S": newItem.username },
          "createtime": {"S": newItem.createtime },
          "type": {"S": newItem.type },
          "prompt": {"S": newItem.prompt },
          "attribute": {"S": newItem.setting },
          "question": {"S": newItem.question },
          "answer": {"S": newItem.answer }
      }
    };
  
    // const tableName = process.env.tableName
    console.log("input:", input)

    const command = new PutItemCommand(input);
    const addLogResponse = await dynamodb.send(command);

    
    console.log("addLogResponse:", addLogResponse)
  } catch (error) {
    console.log("addLog Error:", error)
  }
}

  function generateUUID() {
    const uuid = uuidv4();
    const timestamp = Date.now();
    
    return `${timestamp}-${uuid}`;
  }