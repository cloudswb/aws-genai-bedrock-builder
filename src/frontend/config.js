import cdkOut from './backend.json';

console.log(cdkOut.property);


function getValue(propertyPath) {
  const keys = propertyPath.split('.');
  let obj = cdkOut;

  for (let key of keys) {
    if (obj && obj.hasOwnProperty(key)) {
      obj = obj[key];
    } else {
      return null;
    }
  }

  return obj;
}

const prefix = cdkOut.prefix;

export const config = {

  // Setting the Lambda Auth type (IAM or NON)
  AUTH: getValue(`${prefix}IAMUserRoleStack.auth`),
  REGION: getValue(`${prefix}IAMUserRoleStack.region`),

  AGW_AUTH: getValue(`${prefix}LambdaFunctionStack.${prefix}SecuritySignFunctionUrl`), 
  LOG_TABLE_NAME: getValue(`${prefix}DynamoDBStack.RecordsTableName`), 

  // Setting the lambda function URL
  Lambda_URL_BASE: "https://",
  LambdaRecordsList_URL: getValue(`${prefix}LambdaFunctionStack.${prefix}RecordsListFunctionUrl`).split('/')[2], 
  LambdaAgentInvoke_URL: getValue(`${prefix}LambdaFunctionStack.${prefix}AgentInvokeFunctionUrl`).split('/')[2], 
  LambdaModelInvoke_URL: getValue(`${prefix}LambdaFunctionStack.${prefix}ModelInvokeFunctionUrl`).split('/')[2], 
  LambdaKBInvoke_URL: getValue(`${prefix}LambdaFunctionStack.${prefix}KBInvokeFunctionUrl`).split('/')[2], 
  LambdaKBList_URL: getValue(`${prefix}LambdaFunctionStack.${prefix}KBListFunctionUrl`).split('/')[2], 
  LambdaKBIngest_URL: getValue(`${prefix}LambdaFunctionStack.${prefix}KBIngestFunctionUrl`).split('/')[2], 
  LambdaS3Presign_URL: getValue(`${prefix}LambdaFunctionStack.${prefix}S3PresignFunctionUrl`).split('/')[2], 
  LambdaS3Query_URL: getValue(`${prefix}LambdaFunctionStack.${prefix}S3QueryFunctionUrl`).split('/')[2], 

  // Setting the Bedrock Agent ID, ALIAS_ID can keep by default
  BEDROCK_AGENT_ID: cdkOut.agentId, 
  BEDROCK_AGENT_ALIAS_ID: cdkOut.agentAlias, //"TSTALIASID",

  POOL_DATA: {
    UserPoolId: getValue(`${prefix}CognitoUserPoolStack.userPoolId`),
    ClientId: getValue(`${prefix}CognitoUserPoolStack.userPoolClientId`),
    Region: getValue(`${prefix}IAMUserRoleStack.region`),
  }


}
