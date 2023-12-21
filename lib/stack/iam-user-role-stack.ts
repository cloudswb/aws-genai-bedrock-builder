// import { LambdaIntegration, MethodLoggingLevel, RestApi } from "aws-cdk-lib/aws-apigateway"
import {CfnOutput} from "aws-cdk-lib"
import * as cdk from 'aws-cdk-lib';
import { Stack, RemovalPolicy} from "aws-cdk-lib"
import s3 = require("aws-cdk-lib/aws-s3")
import { HttpMethods } from "aws-cdk-lib/aws-s3"
import { Construct } from "constructs"
// import * as iam from 'aws-cdk-lib/aws-iam';
import { aws_iam as iam } from 'aws-cdk-lib';
import { Config } from "../../bin/config"
import { config } from "process";
import { CfnRole, PolicyDocument, PolicyStatement } from "@aws-cdk/aws-iam";
export class CDKIAMUserRoleStack extends Stack {

    public readonly lambdaIAMUser: iam.User;
    public readonly lambdaIamUserAccessKey?: string;
    public readonly lambdaIamUserSecretKey?: string;

    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props)
        
        // Create IAM user
        const lambdaIAMUser = new iam.User(this, 'S3User');

        // Attach S3 policy to user
        lambdaIAMUser.attachInlinePolicy(new iam.Policy(this, 'S3Policy', {
        statements: [
            new iam.PolicyStatement({
            actions: ['s3:*'], 
            resources: ['*']
            })
        ]
        }));

        lambdaIAMUser.attachInlinePolicy(new iam.Policy(this, 'BedrockPolicy', {
            statements: [
                new iam.PolicyStatement({
                actions: ['bedrock:*'], 
                resources: ['*']
                })
            ]
            }));
          
        lambdaIAMUser.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AWSLambda_FullAccess'));
        lambdaIAMUser.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('IAMFullAccess'));

        this.lambdaIAMUser = lambdaIAMUser
        new CfnOutput(this, `LambdaIamUserArn`, {
            value: lambdaIAMUser.userArn
        });

        const accessKey = new iam.CfnAccessKey(this, 'AccessKey', {
            userName: lambdaIAMUser.userName 
        });



        /////

        const kbDefaultBucket = new s3.Bucket(this, 'SiteBucket', {
            bucketName: `kb-${Config.DomainName}`,
            publicReadAccess: false,
            blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,

            removalPolicy: RemovalPolicy.DESTROY, // NOT recommended for production code
            autoDeleteObjects: true,
            cors: [{
                allowedOrigins: ['*'],
                allowedHeaders: ['*'],
                allowedMethods: [HttpMethods.POST, HttpMethods.PUT, HttpMethods.GET],
            }],
          });

        /////


        /////
        const kbRolePolicy = new PolicyDocument({
            statements: [
              new PolicyStatement({
                actions: ["bedrock:InvokeModel"],
                resources: ["*"] 
              }),
              new PolicyStatement({
                actions: ["aoss:APIAccessAll"],
                resources: ["arn:aws:s3:::mybucket/*"]
              }),
              new PolicyStatement({
                actions: ["s3:GetObject", "s3:ListBucket"],
                resources: ["*"]
              })
            ]
          });

          const kbRoleArn = new iam.Role(this, 'GenAiBuilder-KB-bedrock-Role', {
            assumedBy: new iam.ServicePrincipal('bedrock.amazonaws.com')
          });
          
          kbRoleArn.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonS3FullAccess'));
          kbRoleArn.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonBedrockFullAccess'));
          kbRoleArn.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AWSLambda_FullAccess'));
          // kbRoleArn.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AWSLambdaBasicExecutionRole'));
          kbRoleArn.addToPolicy(
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              resources: ["*"],
              actions: [
                "bedrock:InvokeModel",
                "aoss:APIAccessAll"
              ],
            })
          );
          

        this.lambdaIamUserAccessKey = accessKey.ref;
        this.lambdaIamUserSecretKey = accessKey.attrSecretAccessKey;
  
        new CfnOutput(this, `lambdaIamUserAccessKey`, {
            value: accessKey.ref
        });

        new CfnOutput(this, `lambdaIamUserSecretKey`, {
            value: accessKey.attrSecretAccessKey
        });

        new CfnOutput(this, `auth`, {
            value: Config.Auth
        });
        
        new CfnOutput(this, `region`, {
            value: Config.Region
        });

        new CfnOutput(this, `kbS3Arn`, {
            value: kbDefaultBucket.bucketArn
        });

        new CfnOutput(this, `kbRoleArn`, {
            value: kbRoleArn.roleArn
        });
    }
}
