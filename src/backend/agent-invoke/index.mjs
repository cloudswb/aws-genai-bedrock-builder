import { BedrockAgentRuntimeClient, InvokeAgentCommand } from "@aws-sdk/client-bedrock-agent-runtime"; // ES Modules import
// const { BedrockAgentRuntimeClient, InvokeAgentCommand } = require("@aws-sdk/client-bedrock-agent-runtime"); // CommonJS import

import { DynamoDBClient, PutItemCommand, QueryCommand } from "@aws-sdk/client-dynamodb";

const region = process.env.REGION;
const dynamodb = new DynamoDBClient( { region: region } );

import moment from 'moment'; 
import {v4 as uuidv4} from 'uuid';

const client = new BedrockAgentRuntimeClient({ region: region });

export const handler = awslambda.streamifyResponse(
  async (event, responseStream, context) => {

    console.log('event:', event);
    let param = {}
    if (event.headers.auth == 'iam') {
      let decodedString = Buffer.from(event.body, 'base64').toString('utf-8');
      console.log('decodedString:', decodedString);
      param = JSON.parse(decodedString);
    }
    else {
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

    if (!param.hasOwnProperty("agentId") || param.agentId == undefined || param.agentId == "") {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Invalid event parameter agentId' })
      };
    }
    const agentId = param.agentId

    if (!param.hasOwnProperty("agentAliasId") || param.agentAliasId == undefined || param.agentAliasId == "") {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Invalid event parameter agentAliasId' })
      };
    }
    const agentAliasId = param.agentAliasId

    if (!param.hasOwnProperty("sessionId") || param.sessionId == undefined || param.sessionId == "") {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Invalid event parameter sessionId' })
      };
    }
    const sessionId = param.sessionId;

    if (!param.hasOwnProperty("username") || param.username == undefined || param.username == "") {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Invalid event parameter username' })
      };
    }
    const username = param.username;

    console.log('prompt:', prompt);

    const input = {
      agentId: agentId, // required
      agentAliasId: agentAliasId, // required
      sessionId: sessionId, // required
      endSession: false,
      enableTrace: false,
      inputText: prompt, // required
    };

    console.log(input);

    const command = new InvokeAgentCommand(input);

    const response = await client.send(command);
    const chunks = [];


    for await (const chunk of response.completion) {
      if (chunk.hasOwnProperty("chunk") && chunk.chunk.hasOwnProperty("bytes")) {

        var chunkStr = Buffer.from(chunk.chunk.bytes, "base64").toString("utf-8");
        chunks.push(chunkStr);
        responseStream.write(chunkStr);
      }
    }

    console.log(chunks.join(""));
    responseStream.end();

    // start add log
    const logid = generateUUID();
    const conversationid = uuidv4();
    const now = moment().format();
    const setting = input;
    delete setting.inputText

    const newLog = {
            "logid": logid,
            "conversationid": conversationid,
            "username": username,
            "createtime": now,
            "type": "chatagent",
            "prompt": prompt,
            "setting": JSON.stringify(setting),
            "question": JSON.stringify(input),
            "answer": chunks.join("")
        }
        
    console.log("newLog:", newLog)
    addGenLog(process.env.RECORDS_TABLENAME, newLog);
    // end add log
  }
);

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
    console.log("input", input)

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