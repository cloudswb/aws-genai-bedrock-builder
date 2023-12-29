import { DynamoDBClient, PutItemCommand, QueryCommand } from "@aws-sdk/client-dynamodb";

const region = process.env.REGION;
const client = new DynamoDBClient( { region: region } );


async function queryUserLogList(tableName, userName, startKey) {

  console.log("tableName:", tableName)
  console.log("userName:", userName)
  console.log("startKey:", startKey)
  
  try {
    const input = {
      "ExpressionAttributeValues": {
        ":username": {
          "S": userName
        }
      },
      "KeyConditionExpression": "username = :username",
      "TableName": tableName,
      "ScanIndexForward": false,
      "ExclusiveStartKey": startKey == ""? null : startKey,
      "Limit": 35,
    };
    
    console.log("input:", input)

    const command = new QueryCommand(input);
    const responseObj = await client.send(command);
    console.log("responseObj:", responseObj)
    
    const logItems = [];
    const logsCount = responseObj.Count;
    const lastKey = responseObj.LastEvaluatedKey;

    responseObj.Items.map((item)=>{
      logItems.push({
        logid: item.logid.S,
        conversationid: item.conversationid.S,
        username: item.username.S,
        createtime: item.createtime.S,
        prompt: item.prompt.S,
        attribute: item.attribute.S,
        question: item.question.S,
        answer: item.answer.S,
        type: item.type.S,
        header: `${item.createtime.S} - ${item.logid.S} - ${item.type.S}`
      })
      
    })
    
    
    
    const response = {
      statusCode: 200,
      body: {
        count: logsCount,
        items: logItems,
        lastKey: lastKey
      }
    };
    
    console.log("response:", response)
    return response;

  } catch (error) {
    console.log(error)
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Query log failed.', detail: error }),
    };

  }
}

export const handler = async (event) => {

  console.log('event:', event);

  let param = {}
  if(event.headers.auth =='iam'){
    let decodedString = Buffer.from(event.body, 'base64').toString('utf-8');
    console.log('decodedString:', decodedString);
    param = JSON.parse(decodedString);
  }
  else{
    param = event.body //JSON.parse(event.body);
  }

  console.log("tableName:", param.tableName)
  if (!param.hasOwnProperty("tableName") || param.tableName == undefined || param.tableName == "") {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Invalid tableName' })
    };
  }
  
  if (!param.hasOwnProperty("userName") || param.userName == undefined || param.userName == "") {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Invalid userName' })
    };
  }
  
  return queryUserLogList(param.tableName, param.userName, param.startKey)

}