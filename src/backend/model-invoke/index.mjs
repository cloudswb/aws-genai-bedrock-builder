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
      anthropic_version: "bedrock-2023-05-31",
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: [{ type: "text", text: `${prompt}` }],
        },
      ],
      temperature: 0.5,
      top_p: 0.5,
      top_k: 250,
      stop_sequences: ["\n\nHuman:"],
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
    
    // const chunks = [];
    let completeMessage = "";
    for await (const item of response.body) {
      const chunk = JSON.parse(new TextDecoder().decode(item.chunk.bytes));
      
      const chunk_type = chunk.type;
  
      if (chunk_type === "content_block_delta") {
        const text = chunk.delta.text;
        completeMessage = completeMessage + text;
        responseStream.write(text);
        console.log("text", text)
      }
    }

    console.log("completeMessage", completeMessage);
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
            "answer": completeMessage
        }
        
    console.log("newLog:", newLog)
    addGenLog(process.env.RECORDS_TABLENAME, newLog);
    // end add log
    
    return completeMessage;
  }
  

);

  function generateUUID() {
    const uuid = uuidv4();
    const timestamp = Date.now();
    
    return `${timestamp}-${uuid}`;
  }