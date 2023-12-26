import cdk = require("aws-cdk-lib")

import { CDKLambdaLayerStack } from "../lib/stack/lambda-layers-stack"
import { CDKIAMUserRoleStack } from "../lib/stack/iam-user-role-stack"
import { CdkCognitoUserPoolStack } from "../lib/stack/cognito-userpool-stack"

import { CDKLambdaStack } from "../lib/stack/lambda-stack"
import { DynamoDBStack } from "../lib/stack/dynamo-db-stack"
import { LambdaLayers } from "../lib/stack/lambda-common"
import { Config } from "./config"
import { CDKCloudFrontWebsiteStack } from "../lib/stack/cloudfront-s3-web-stack"
import { BedrockKBStack } from "../lib/stack/bedrock-kb-stack"
import { OpenSearchVectorDBStack } from "../lib/stack/opensearch-vector-stack"


const app = new cdk.App()

let prefix = app.node.tryGetContext("prefix")
if(prefix == undefined || prefix == ""){
    prefix = "GenAIBuilder"
}


if (app.node.tryGetContext("target") === 'backend') {

    const lambdaIamUserStack = new CDKIAMUserRoleStack(app, `${prefix}IAMUserRoleStack`, prefix)
    const cognitoUserPoolStack = new CdkCognitoUserPoolStack(app, `${prefix}CognitoUserPoolStack`, {
        functionName: `${prefix}CognitoUserPoolFunction`
    })


    const dynamoDBStack = new DynamoDBStack(app, `${prefix}DynamoDBStack`, prefix)

    const layerStack = new CDKLambdaLayerStack(app, `${prefix}LambdaLayerStack`)

    const lambdaLayers = new LambdaLayers(
        layerStack.clientBedrockAgent,
        layerStack.clientBedrockAgentRuntime,
        layerStack.clientBedrockRuntime,
        layerStack.jsonwebtoken,
        layerStack.awsJwtVerify,
        layerStack.awsSdk,
        layerStack.cryptoJs,
        layerStack.moment
    )

    const lambdaStack = new CDKLambdaStack(app, `${prefix}LambdaFunctionStack`, prefix, {
        functionName: ``,
        lambdaIamUser: lambdaIamUserStack.lambdaIAMUser,
        lambdaLayers: lambdaLayers,
        userPool: cognitoUserPoolStack.userPool,
        lambdaIamUserAccessKey: lambdaIamUserStack.lambdaIamUserAccessKey,
        lambdaIamUserSecretKey: lambdaIamUserStack.lambdaIamUserSecretKey,
        RecordsTableName: dynamoDBStack.RecordsTableName,
        
    })

    lambdaStack.addDependency(layerStack)
    lambdaStack.addDependency(cognitoUserPoolStack)
    lambdaStack.addDependency(dynamoDBStack)
    lambdaStack.addDependency(lambdaIamUserStack)

    // 
    const callerUserArn = app.node.tryGetContext("callerUserArn")
    const openSearchVectorDBStack = new OpenSearchVectorDBStack(app,`${prefix}OpenSearchVectorDBStack`, prefix, callerUserArn)
    openSearchVectorDBStack.addDependency(lambdaIamUserStack)


}
else if (app.node.tryGetContext("target") === 'kb') {

    const kbS3Arn = app.node.tryGetContext("kbS3Arn")
    const kbRoleArn = app.node.tryGetContext("kbRoleArn")
    const collectionArn = app.node.tryGetContext("collectionArn")

    const bedrockKBStack = new BedrockKBStack(app, `${prefix}BedrockKBStack`, collectionArn, kbRoleArn, kbS3Arn)

}
else if (app.node.tryGetContext("target") === 'frontend') {
    const cloudFrontWebsiteStack = new CDKCloudFrontWebsiteStack(app, `${prefix}CloudFrontWebsiteStack`, {
        domainName: Config.DomainName,
        siteSubDomain: Config.SiteSubDomain,
    })

}