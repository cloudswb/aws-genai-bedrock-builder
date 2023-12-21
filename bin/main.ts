import cdk = require("aws-cdk-lib")

import { CDKLambdaLayerStack } from "../lib/stack/lambda-layers-stack"
import { CDKIAMUserRoleStack } from "../lib/stack/iam-user-role-stack"
import { CdkCognitoUserPoolStack } from "../lib/stack/cognito-userpool-stack"

import { CDKLambdaStack } from "../lib/stack/lambda-stack"
import { DynamoDBStack } from "../lib/stack/dynamo-db-stack"
import { LambdaLayers } from "../lib/stack/lambda-common"
import { Config } from "./config"
import { CDKCloudFrontWebsiteStack } from "../lib/stack/cloudfront-s3-web-stack"


const app = new cdk.App()

let prefix = Config.ProjectPrefix

if (app.node.tryGetContext("target") === 'backend') {



    const lambdaIamUserStack = new CDKIAMUserRoleStack(app, `${prefix}IAMUserRoleStack`)
    const cognitoUserPoolStack = new CdkCognitoUserPoolStack(app, `${prefix}CognitoUserPoolStack`, {
        functionName: `${prefix}CognitoUserPoolFunction`
    })


    const dynamoDBStack = new DynamoDBStack(app, `${prefix}DynamoDBStack`, {
        tableName: `${prefix}RecordsTable`
    })

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

    const lambdaStack = new CDKLambdaStack(app, `${prefix}LambdaFunctionStack`, {
        functionName: ``,
        lambdaIamUser: lambdaIamUserStack.lambdaIAMUser,
        lambdaLayers: lambdaLayers,
        userPool: cognitoUserPoolStack.userPool,
        lambdaIamUserAccessKey: lambdaIamUserStack.lambdaIamUserAccessKey,
        lambdaIamUserSecretKey: lambdaIamUserStack.lambdaIamUserSecretKey,
        RecordsTableName: dynamoDBStack.RecordsTableName
    })

    lambdaStack.addDependency(layerStack)
    lambdaStack.addDependency(cognitoUserPoolStack)
    lambdaStack.addDependency(dynamoDBStack)
    lambdaStack.addDependency(lambdaIamUserStack)

}
else if (app.node.tryGetContext("target") === 'frontend') {

    const cloudFrontWebsiteStack =new CDKCloudFrontWebsiteStack(app, `${prefix}CloudFrontWebsiteStack`, {
        domainName: Config.DomainName,
        siteSubDomain: Config.SiteSubDomain,
    })

    // cloudFrontWebsiteStack.addDependency(layerStack);
    // cloudFrontWebsiteStack.addDependency(cognitoUserPoolStack);
    // cloudFrontWebsiteStack.addDependency(lambdaStack);

}
else {
    

}