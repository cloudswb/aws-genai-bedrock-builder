import { BedrockRuntimeClient, InvokeModelWithResponseStreamCommand } from "@aws-sdk/client-bedrock-runtime"; // ES Modules import
import { DynamoDBClient, PutItemCommand, QueryCommand } from "@aws-sdk/client-dynamodb";

const region = process.env.REGION;
const bedrock = new BedrockRuntimeClient({ region: region });
const dynamodb = new DynamoDBClient( { region: region } );

import moment from 'moment'; 
import {v4 as uuidv4} from 'uuid';

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

export const handler = awslambda.streamifyResponse(
  async (event, responseStream, context) => {
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

    const prompt = param.prompt; 
    const modelId = param.modelId;
    const username = param.username;
    
    console.log('prompt:', prompt);
    
    const body = JSON.stringify({
        prompt: `${prompt}`,
        max_tokens_to_sample: 2048,
        temperature: 0.1,
        top_k: 250,
        top_p: 0.5,
        stop_sequences: ["\n\nHuman:"],
        anthropic_version: "bedrock-2023-05-31",
      });
      
    console.log('body:', body);
    const params = {
      modelId: modelId,
      contentType: "application/json",
      accept: "*/*",
      body: body,
    };

    console.log(params);

    const command = new InvokeModelWithResponseStreamCommand(params);

    const response = await bedrock.send(command);
    console.log("response:", response);
    
    const chunks = [];

    for await (const chunk of response.body) {
      if(chunk.hasOwnProperty("chunk") && chunk.chunk.hasOwnProperty("bytes")){
        const parsed = JSON.parse(
          Buffer.from(chunk.chunk.bytes, "base64").toString("utf-8")
        );
        chunks.push(parsed.completion);
        responseStream.write(parsed.completion);
      }
    }

    console.log(chunks.join(""));
    responseStream.end();
    

    // start add log
    const logid = generateUUID();
    const conversationid = uuidv4();
    const now = moment().format();
    const setting = body;
    delete setting.prompt
    const newLog = {
            "logid": logid,
            "conversationid": conversationid,
            "username": username,
            "createtime": now,
            "type": "chatmodel",
            "prompt": prompt,
            "setting": setting,
            "question": body,
            "answer": chunks.join("")
        }
        
    console.log("newLog:", newLog)
    addGenLog(process.env.RECORDS_TABLENAME, newLog);
    // end add log
  }
  

);

  function generateUUID() {
    const uuid = uuidv4();
    const timestamp = Date.now();
    
    return `${timestamp}-${uuid}`;
  }