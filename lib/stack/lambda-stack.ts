// import { LambdaIntegration, MethodLoggingLevel, RestApi } from "aws-cdk-lib/aws-apigateway"
import { PolicyStatement } from "aws-cdk-lib/aws-iam"
import { CfnOutput, CfnParameter, CustomResource } from "aws-cdk-lib"
import { FunctionUrlAuthType } from '@aws-cdk/aws-lambda'
import { InvokeMode } from 'aws-cdk-lib/aws-lambda';
import { Function, Runtime, AssetCode, HttpMethod } from "aws-cdk-lib/aws-lambda"
import { Duration, Stack } from "aws-cdk-lib"

import s3 = require("aws-cdk-lib/aws-s3")
import { Construct } from "constructs"
import { LambdatackProps } from "./lambda-common"
import { Config } from "../../bin/config"
import * as iam from 'aws-cdk-lib/aws-iam';
import { LambdaRestApi, CfnAuthorizer, LambdaIntegration, AuthorizationType, Cors, IResource, MockIntegration, PassthroughBehavior, Stage, Deployment } from 'aws-cdk-lib/aws-apigateway';
import { UserPool } from 'aws-cdk-lib/aws-cognito'

import * as fs from 'fs';

export class CDKLambdaStack extends Stack {

    // private lambdaFunction: Function

    public readonly lambdaUrlList: string;

    public recordsListHost: string;
    public agentInvokeHost: string;
    public kbIngestHost: string;
    public kbInvokeHost: string;
    public kbListHost: string;
    public modelInvokeHost: string;
    public s3PresignHost: string;
    public s3QueryHost: string;

    public securitySignHost: string;


    constructor(scope: Construct, id: string, prefix: string, props: LambdatackProps) {
        super(scope, id, props)


        this.LambdaRecordsList({
            functionName: `${prefix}RecordsListFunction`,
            lambdaLayers: props.lambdaLayers,
            lambdaIamUser: props.lambdaIamUser
        }, prefix);

        this.LambdaAgentInvoke({
            functionName: `${prefix}AgentInvokeFunction`,
            lambdaIamUser: props.lambdaIamUser,
            lambdaLayers: props.lambdaLayers
        }, prefix);
        this.LambdaKBIngest({
            functionName: `${prefix}KBIngestFunction`,
            lambdaLayers: props.lambdaLayers,
            lambdaIamUser: props.lambdaIamUser
        });
        this.LambdaKbInvoke({
            functionName: `${prefix}KBInvokeFunction`,
            lambdaLayers: props.lambdaLayers,
            lambdaIamUser: props.lambdaIamUser
        }, prefix);
        this.LambdaKBList({
            functionName: `${prefix}KBListFunction`,
            lambdaLayers: props.lambdaLayers,
            lambdaIamUser: props.lambdaIamUser
        });
        this.LambdaModelInvoke({
            functionName: `${prefix}ModelInvokeFunction`,
            lambdaLayers: props.lambdaLayers,
            lambdaIamUser: props.lambdaIamUser
        }, prefix);
        this.LambdaS3Presign({
            functionName: `${prefix}S3PresignFunction`,
            lambdaLayers: props.lambdaLayers,
            lambdaIamUser: props.lambdaIamUser
        });

        this.LambdaS3Query({
            functionName: `${prefix}S3QueryFunction`,
            lambdaLayers: props.lambdaLayers,
            lambdaIamUser: props.lambdaIamUser
        });


        if (Config.Auth == "iam") {
            this.LambdaSecuritySign({
                functionName: `${prefix}SecuritySignFunction`,
                lambdaLayers: props.lambdaLayers,
                lambdaIamUser: props.lambdaIamUser,
                userPool: props.userPool,
                lambdaIamUserAccessKey: props.lambdaIamUserAccessKey,
                lambdaIamUserSecretKey: props.lambdaIamUserSecretKey,
            });
        }

        new CfnOutput(this, `AgentLLMName`, {
            value: Config.AgentLLMName,
        });

        new CfnOutput(this, `KBLLMName`, {
            value: Config.KBLLMName,
        });

        new CfnOutput(this, `KBEmbeddingModelName`, {
            value: Config.KBEmbeddingModelName,
        });


    }

    private LambdaS3Query(props: LambdatackProps) {
        const lambdaPolicy = new PolicyStatement();
        lambdaPolicy.addActions("s3:*");
        lambdaPolicy.addResources("*");

        const lambdaFunction = new Function(this, props.functionName, {
            functionName: props.functionName,
            handler: "index.handler",
            runtime: Runtime.NODEJS_18_X,
            code: new AssetCode(`./src/backend/s3-query/`),
            memorySize: 512,
            timeout: Duration.seconds(15),
            environment: {
                REGION: Config.Region,
            },
            initialPolicy: [lambdaPolicy],
            // layers: [props.lambdaLayers.clientBedrockAgent, props.lambdaLayers.awsJwtVerify, props.lambdaLayers.awsSdk, props.lambdaLayers.clientBedrockAgentRuntime, props.lambdaLayers.clientBedrockRuntime, props.lambdaLayers.jsonwebtoken]
        });

        // Create function URL
        const functionUrl = lambdaFunction.addFunctionUrl({
            authType: Config.Auth == "iam" ? FunctionUrlAuthType.AWS_IAM : FunctionUrlAuthType.NONE,
            cors: {
                allowedOrigins: ['*'],
                allowedHeaders: ['*'],
                allowedMethods: [HttpMethod.POST]
            },
            invokeMode: InvokeMode.RESPONSE_STREAM
        });

        if (Config.Auth == "iam") {
            // Resource-based policy allowing only the user to invoke
            lambdaFunction.addPermission('invocationRestriction', {
                action: 'lambda:InvokeFunction',
                principal: new iam.ServicePrincipal(props.lambdaIamUser.userArn),
            });
        }

        new CfnOutput(this, `${props.functionName} Url`, {
            value: functionUrl.url,
        });

        this.s3QueryHost = functionUrl.url

    }

    private LambdaS3Presign(props: LambdatackProps) {
        const lambdaPolicy = new PolicyStatement();
        lambdaPolicy.addActions("s3:*");
        lambdaPolicy.addResources("*");

        const lambdaFunction = new Function(this, props.functionName, {
            functionName: props.functionName,
            handler: "index.handler",
            runtime: Runtime.NODEJS_18_X,
            code: new AssetCode(`./src/backend/s3-presign/`),
            memorySize: 512,
            timeout: Duration.seconds(15),
            environment: {
                REGION: Config.Region,
            },
            initialPolicy: [lambdaPolicy],
            // layers: [props.lambdaLayers.clientBedrockAgent, props.lambdaLayers.awsJwtVerify, props.lambdaLayers.awsSdk, props.lambdaLayers.clientBedrockAgentRuntime, props.lambdaLayers.clientBedrockRuntime, props.lambdaLayers.jsonwebtoken]
        });

        // this.lambdaFunction.addLayers(props.lambdaLayers.clientBedrockAgent)
        lambdaFunction.addLayers(props.lambdaLayers.awsJwtVerify)
        lambdaFunction.addLayers(props.lambdaLayers.awsSdk)
        // this.lambdaFunction.addLayers(props.lambdaLayers.clientBedrockAgentRuntime)
        // this.lambdaFunction.addLayers(props.lambdaLayers.jsonwebtoken)
        // this.lambdaFunction.addLayers(props.lambdaLayers.clientBedrockRuntime)

        // Create function URL
        const functionUrl = lambdaFunction.addFunctionUrl({
            authType: Config.Auth == "iam" ? FunctionUrlAuthType.AWS_IAM : FunctionUrlAuthType.NONE,
            cors: {
                allowedOrigins: ['*'],
                allowedHeaders: ['*'],
                allowedMethods: [HttpMethod.POST]
            },
            invokeMode: InvokeMode.RESPONSE_STREAM
        });

        if (Config.Auth == "iam") {
            // Resource-based policy allowing only the user to invoke
            lambdaFunction.addPermission('invocationRestriction', {
                action: 'lambda:InvokeFunction',
                principal: new iam.ServicePrincipal(props.lambdaIamUser.userArn),
                // sourceAccount: props.lambdaIamUser.userArn
            });
        }

        new CfnOutput(this, `${props.functionName} Url`, {
            value: functionUrl.url
        });

        this.s3PresignHost = functionUrl.url

    }

    private LambdaModelInvoke(props: LambdatackProps, prefix: string) {
        const lambdaPolicy = new PolicyStatement();
        lambdaPolicy.addActions("bedrock:*");
        lambdaPolicy.addResources("*");

        const ddbPolicy = new PolicyStatement();
        ddbPolicy.addActions("dynamodb:*");
        ddbPolicy.addResources("*");

        const lambdaFunction = new Function(this, props.functionName, {
            functionName: props.functionName,
            handler: "index.handler",
            runtime: Runtime.NODEJS_18_X,
            code: new AssetCode(`./src/backend/model-invoke/`),
            memorySize: 1024,
            timeout: Duration.seconds(120),
            environment: {
                REGION: Config.Region,
                RECORDS_TABLENAME: `${prefix}RecordsTable`
            },
            initialPolicy: [lambdaPolicy, ddbPolicy],
            // layers: [props.lambdaLayers.clientBedrockAgent, props.lambdaLayers.awsJwtVerify, props.lambdaLayers.awsSdk, props.lambdaLayers.clientBedrockAgentRuntime, props.lambdaLayers.clientBedrockRuntime, props.lambdaLayers.jsonwebtoken]
        });

        lambdaFunction.addLayers(props.lambdaLayers.awsJwtVerify)
        lambdaFunction.addLayers(props.lambdaLayers.moment)
        lambdaFunction.addLayers(props.lambdaLayers.clientBedrockRuntime)

        // Create function URL
        const functionUrl = lambdaFunction.addFunctionUrl({
            authType: Config.Auth == "iam" ? FunctionUrlAuthType.AWS_IAM : FunctionUrlAuthType.NONE,
            cors: {
                allowedOrigins: ['*'],
                allowedHeaders: ['*'],
                allowedMethods: [HttpMethod.POST]
            },
            invokeMode: InvokeMode.RESPONSE_STREAM
        });

        if (Config.Auth == "iam") {
            // Resource-based policy allowing only the user to invoke
            lambdaFunction.addPermission('invocationRestriction', {
                action: 'lambda:InvokeFunction',
                principal: new iam.ServicePrincipal(props.lambdaIamUser.userArn),
                // sourceAccount: props.lambdaIamUser.userArn
            });
        }

        new CfnOutput(this, `${props.functionName} Url`, {
            value: functionUrl.url
        });

        this.modelInvokeHost = functionUrl.url
    }

    private LambdaKBList(props: LambdatackProps) {
        const lambdaPolicy = new PolicyStatement();
        lambdaPolicy.addActions("bedrock:*");
        lambdaPolicy.addResources("*");

        const lambdaFunction = new Function(this, props.functionName, {
            functionName: props.functionName,
            handler: "index.handler",
            runtime: Runtime.NODEJS_18_X,
            code: new AssetCode(`./src/backend/kb-list/`),
            memorySize: 512,
            timeout: Duration.seconds(15),
            environment: {
                REGION: Config.Region,
            },
            initialPolicy: [lambdaPolicy],
            // layers: [props.lambdaLayers.clientBedrockAgent, props.lambdaLayers.awsJwtVerify, props.lambdaLayers.awsSdk, props.lambdaLayers.clientBedrockAgentRuntime, props.lambdaLayers.clientBedrockRuntime, props.lambdaLayers.jsonwebtoken]
        });

        lambdaFunction.addLayers(props.lambdaLayers.clientBedrockAgent)
        lambdaFunction.addLayers(props.lambdaLayers.awsJwtVerify)
        lambdaFunction.addLayers(props.lambdaLayers.clientBedrockAgentRuntime)

        // Create function URL
        const functionUrl = lambdaFunction.addFunctionUrl({
            authType: Config.Auth == "iam" ? FunctionUrlAuthType.AWS_IAM : FunctionUrlAuthType.NONE,
            cors: {
                allowedOrigins: ['*'],
                allowedHeaders: ['*'],
                allowedMethods: [HttpMethod.POST]
            },
            invokeMode: InvokeMode.RESPONSE_STREAM
        });

        if (Config.Auth == "iam") {
            // Resource-based policy allowing only the user to invoke
            lambdaFunction.addPermission('invocationRestriction', {
                action: 'lambda:InvokeFunction',
                principal: new iam.ServicePrincipal(props.lambdaIamUser.userArn),
                // sourceAccount: props.lambdaIamUser.userArn
            });
        }

        new CfnOutput(this, `${props.functionName} Url`, {
            value: functionUrl.url
        });

        this.kbListHost = functionUrl.url

    }

    private LambdaKbInvoke(props: LambdatackProps, prefix: string) {
        const lambdaPolicy = new PolicyStatement();
        lambdaPolicy.addActions("bedrock:*");
        lambdaPolicy.addResources("*");

        const ddbPolicy = new PolicyStatement();
        ddbPolicy.addActions("dynamodb:*");
        ddbPolicy.addResources("*");

        const lambdaFunction = new Function(this, props.functionName, {
            functionName: props.functionName,
            handler: "index.handler",
            runtime: Runtime.NODEJS_18_X,
            code: new AssetCode(`./src/backend/kb-invoke/`),
            memorySize: 1024,
            timeout: Duration.seconds(90),
            environment: {
                REGION: Config.Region,
                LLM: Config.KBLLMName,
                RECORDS_TABLENAME: `${prefix}RecordsTable`
            },
            initialPolicy: [lambdaPolicy, ddbPolicy],
            // layers: [props.lambdaLayers.clientBedrockAgent, props.lambdaLayers.awsJwtVerify, props.lambdaLayers.awsSdk, props.lambdaLayers.clientBedrockAgentRuntime, props.lambdaLayers.clientBedrockRuntime, props.lambdaLayers.jsonwebtoken]
        });

        lambdaFunction.addLayers(props.lambdaLayers.awsJwtVerify)
        lambdaFunction.addLayers(props.lambdaLayers.moment)
        lambdaFunction.addLayers(props.lambdaLayers.clientBedrockAgentRuntime)
        lambdaFunction.addLayers(props.lambdaLayers.clientBedrockRuntime)

        // Create function URL
        const functionUrl = lambdaFunction.addFunctionUrl({
            authType: Config.Auth == "iam" ? FunctionUrlAuthType.AWS_IAM : FunctionUrlAuthType.NONE,
            cors: {
                allowedOrigins: ['*'],
                allowedHeaders: ['*'],
                allowedMethods: [HttpMethod.POST]
            },
            invokeMode: InvokeMode.RESPONSE_STREAM
        });

        if (Config.Auth == "iam") {
            // Resource-based policy allowing only the user to invoke
            lambdaFunction.addPermission('invocationRestriction', {
                action: 'lambda:InvokeFunction',
                principal: new iam.ServicePrincipal(props.lambdaIamUser.userArn),
                // sourceAccount: props.lambdaIamUser.userArn
            });
        }

        new CfnOutput(this, `${props.functionName} Url`, {
            value: functionUrl.url
        });

        this.kbInvokeHost = functionUrl.url

    }

    private LambdaKBIngest(props: LambdatackProps) {
        const lambdaPolicy = new PolicyStatement();
        lambdaPolicy.addActions("bedrock:*");
        lambdaPolicy.addResources("*");

        const lambdaFunction = new Function(this, props.functionName, {
            functionName: props.functionName,
            handler: "index.handler",
            runtime: Runtime.NODEJS_18_X,
            code: new AssetCode(`./src/backend/kb-ingest/`),
            memorySize: 256,
            timeout: Duration.seconds(300),
            environment: {
                REGION: Config.Region,
            },
            initialPolicy: [lambdaPolicy],
            // layers: [props.lambdaLayers.clientBedrockAgent, props.lambdaLayers.awsJwtVerify, props.lambdaLayers.awsSdk, props.lambdaLayers.clientBedrockAgentRuntime, props.lambdaLayers.clientBedrockRuntime, props.lambdaLayers.jsonwebtoken]
        });

        lambdaFunction.addLayers(props.lambdaLayers.clientBedrockAgent)
        lambdaFunction.addLayers(props.lambdaLayers.awsJwtVerify)

        // Create function URL
        const functionUrl = lambdaFunction.addFunctionUrl({
            authType: Config.Auth == "iam" ? FunctionUrlAuthType.AWS_IAM : FunctionUrlAuthType.NONE,
            cors: {
                allowedOrigins: ['*'],
                allowedHeaders: ['*'],
                allowedMethods: [HttpMethod.POST]
            },
            invokeMode: InvokeMode.BUFFERED,
        });

        // Add permission for Lambda to assume user role
        lambdaFunction.addToRolePolicy(new iam.PolicyStatement({
            actions: ['sts:AssumeRole'],
            resources: [props.lambdaIamUser.userArn]
        }));

        if (Config.Auth == "iam") {
            // Resource-based policy allowing only the user to invoke
            lambdaFunction.addPermission('invocationRestriction', {
                action: 'lambda:InvokeFunction',
                principal: new iam.ServicePrincipal(props.lambdaIamUser.userArn),
                // sourceArn: props.lambdaIamUser.userArn
            });
        }

        new CfnOutput(this, `${props.functionName} Url`, {
            value: functionUrl.url
        });

        this.kbIngestHost = functionUrl.url
    }

    private LambdaAgentInvoke(props: LambdatackProps, prefix: string) {
        const lambdaPolicy = new PolicyStatement();
        lambdaPolicy.addActions("bedrock:*");
        lambdaPolicy.addResources("*");

        const ddbPolicy = new PolicyStatement();
        ddbPolicy.addActions("dynamodb:*");
        ddbPolicy.addResources("*");

        const lambdaFunction = new Function(this, props.functionName, {
            functionName: props.functionName,
            handler: "index.handler",
            runtime: Runtime.NODEJS_18_X,
            code: new AssetCode(`./src/backend/agent-invoke/`),
            memorySize: 1024,
            timeout: Duration.seconds(120),
            environment: {
                REGION: Config.Region,
                RECORDS_TABLENAME: `${prefix}RecordsTable`
            },
            initialPolicy: [lambdaPolicy, ddbPolicy],
            // layers: [props.lambdaLayers.clientBedrockAgent, props.lambdaLayers.awsJwtVerify, props.lambdaLayers.awsSdk, props.lambdaLayers.clientBedrockAgentRuntime, props.lambdaLayers.clientBedrockRuntime, props.lambdaLayers.jsonwebtoken]
        });

        lambdaFunction.addLayers(props.lambdaLayers.awsJwtVerify)
        lambdaFunction.addLayers(props.lambdaLayers.clientBedrockAgentRuntime)
        lambdaFunction.addLayers(props.lambdaLayers.moment)

        // Create function URL
        const functionUrl = lambdaFunction.addFunctionUrl({
            authType: Config.Auth == "iam" ? FunctionUrlAuthType.AWS_IAM : FunctionUrlAuthType.NONE,
            cors: {
                allowedOrigins: ['*'],
                allowedHeaders: ['*'],
                allowedMethods: [HttpMethod.POST]
            },
            invokeMode: InvokeMode.RESPONSE_STREAM
        });

        if (Config.Auth == "iam") {
            // Resource-based policy allowing only the user to invoke
            lambdaFunction.addPermission('invocationRestriction', {
                action: 'lambda:InvokeFunction',
                principal: new iam.ServicePrincipal(props.lambdaIamUser.userArn),
                // sourceAccount: props.lambdaIamUser.userArn
            });
        }

        new CfnOutput(this, `${props.functionName} Url`, {
            value: functionUrl.url
        });

        this.agentInvokeHost = functionUrl.url

    }

    private LambdaRecordsList(props: LambdatackProps, prefix: string) {

        const ddbPolicy = new PolicyStatement();
        ddbPolicy.addActions("dynamodb:*");
        ddbPolicy.addResources("*");

        const lambdaFunction = new Function(this, props.functionName, {
            functionName: props.functionName,
            handler: "index.handler",
            runtime: Runtime.NODEJS_18_X,
            code: new AssetCode(`./src/backend/records/`),
            memorySize: 1024,
            timeout: Duration.seconds(15),
            environment: {
                REGION: Config.Region,
                RECORDS_TABLENAME: `${prefix}RecordsTable`
            },
            initialPolicy: [ddbPolicy],
        });

        lambdaFunction.addLayers(props.lambdaLayers.awsSdk)
        lambdaFunction.addLayers(props.lambdaLayers.moment)

        // Create function URL
        const functionUrl = lambdaFunction.addFunctionUrl({
            authType: Config.Auth == "iam" ? FunctionUrlAuthType.AWS_IAM : FunctionUrlAuthType.NONE,
            cors: {
                allowedOrigins: ['*'],
                allowedHeaders: ['*'],
                allowedMethods: [HttpMethod.POST]
            },
            invokeMode: InvokeMode.RESPONSE_STREAM
        });

        if (Config.Auth == "iam") {
            // Resource-based policy allowing only the user to invoke
            lambdaFunction.addPermission('invocationRestriction', {
                action: 'lambda:InvokeFunction',
                principal: new iam.ServicePrincipal(props.lambdaIamUser.userArn),
                // sourceAccount: props.lambdaIamUser.userArn
            });
        }

        new CfnOutput(this, `${props.functionName} Url`, {
            value: functionUrl.url
        });

        this.recordsListHost = functionUrl.url

    }


    private addCorsOptions(apiResource: IResource) {
        apiResource.addMethod('OPTIONS', new MockIntegration({
            // In case you want to use binary media types, uncomment the following line
            // contentHandling: ContentHandling.CONVERT_TO_TEXT,
            integrationResponses: [{
                statusCode: '200',
                responseParameters: {
                    'method.response.header.Access-Control-Allow-Headers': "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent'",
                    'method.response.header.Access-Control-Allow-Origin': "'*'",
                    'method.response.header.Access-Control-Allow-Credentials': "'false'",
                    'method.response.header.Access-Control-Allow-Methods': "'OPTIONS,GET,PUT,POST,DELETE'",
                },
            }],
            // In case you want to use binary media types, comment out the following line
            passthroughBehavior: PassthroughBehavior.NEVER,
            requestTemplates: {
                "application/json": "{\"statusCode\": 200}"
            },
        }), {
            methodResponses: [{
                statusCode: '200',
                responseParameters: {
                    'method.response.header.Access-Control-Allow-Headers': true,
                    'method.response.header.Access-Control-Allow-Methods': true,
                    'method.response.header.Access-Control-Allow-Credentials': true,
                    'method.response.header.Access-Control-Allow-Origin': true,
                },
            }]
        })
    }

    private LambdaSecuritySign(props: LambdatackProps) {
        const lambdaPolicy = new PolicyStatement();
        lambdaPolicy.addActions("bedrock:*");
        lambdaPolicy.addResources("*");

        const lambdaFunction = new Function(this, props.functionName, {
            functionName: props.functionName,
            handler: "index.handler",
            runtime: Runtime.NODEJS_18_X,
            code: new AssetCode(`./src/backend/security-sign/`),
            memorySize: 1024,
            timeout: Duration.seconds(15),
            environment: {
                REGION: Config.Region,
                ACCESS_KEY: props.lambdaIamUserAccessKey ? props.lambdaIamUserAccessKey : "",
                SECRET_KEY: props.lambdaIamUserSecretKey ? props.lambdaIamUserSecretKey : "",
            },
            initialPolicy: [lambdaPolicy],
        });

        lambdaFunction.addLayers(props.lambdaLayers.cryptoJs)
        lambdaFunction.addLayers(props.lambdaLayers.moment)
        lambdaFunction.addLayers(props.lambdaLayers.jsonwebtoken)


        // Rest API backed by the helloWorldFunction
        const lambdaRestApi = new LambdaRestApi(this, `${props.functionName}RestApi`, {
            restApiName: `${props.functionName}RestApi`,
            handler: lambdaFunction,
            endpointExportName: `${props.functionName}RestApi`,
            proxy: false,
            // defaultCorsPreflightOptions: {
            //     allowOrigins: Cors.ALL_ORIGINS,
            //     allowMethods: Cors.ALL_METHODS // this is also the default
            //   },
            deploy: true,
            deployOptions:{
                stageName: "prod",
            }

        });

        // Create the integration
        // const integration = new LambdaIntegration(lambdaFunction);

        // Add a proxy resource to the API
        // const proxyResource = lambdaRestApi.root.addProxy({
        // defaultIntegration: integration,
        // defaultMethodOptions: {
        //         authorizationType: AuthorizationType.NONE,
        //         apiKeyRequired: false,
        //     }
        // });  

        // // Authorizer for the Hello World API that uses the
        // // Cognito User pool to Authorize users.
        // const authorizer = new CfnAuthorizer(this, `${props.functionName}Auth`, {
        //     restApiId: lambdaRestApi.restApiId,
        //     name: `${props.functionName}Auth`,
        //     type: 'COGNITO_USER_POOLS',
        //     identitySource: 'method.request.header.Authorization',
        //     providerArns: [props.userPool == undefined ? "" : props.userPool.userPoolArn],
        // })

        // Hello Resource API for the REST API. 
        const authResource = lambdaRestApi.root.addResource('auth');
        this.addCorsOptions(authResource)
        // GET method for the HELLO API resource. It uses Cognito for
        // authorization and the auathorizer defined above.
        authResource.addMethod('POST',
            new LambdaIntegration(lambdaFunction, {
                proxy: false,
                integrationResponses: [{
                    statusCode: '200',
                    responseParameters: {
                        'method.response.header.Access-Control-Allow-Headers': "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent'",
                        'method.response.header.Access-Control-Allow-Origin': "'*'",
                        'method.response.header.Access-Control-Allow-Credentials': "'false'",
                        'method.response.header.Access-Control-Allow-Methods': "'OPTIONS,GET,PUT,POST,DELETE'",
                    },
                }],

            }),
            {
                authorizationType: AuthorizationType.NONE,
                // authorizer: {
                //     authorizerId: authorizer.ref,
                //     authorizationType: AuthorizationType.COGNITO,
                // },
                methodResponses: [{
                    statusCode: '200',
                    responseParameters: {
                      'method.response.header.Access-Control-Allow-Headers': true,
                      'method.response.header.Access-Control-Allow-Methods': true,
                      'method.response.header.Access-Control-Allow-Credentials': true,
                      'method.response.header.Access-Control-Allow-Origin': true,
                    },
                  }]
            })

        // authResource.addCorsPreflight({
        //     allowOrigins:  Cors.ALL_ORIGINS,
        //     allowMethods: Cors.ALL_METHODS
        //   });


        new CfnOutput(this, `${props.functionName}Url`, {
            value: `${lambdaRestApi.url}auth`
        });

        this.securitySignHost = authResource.path

    }

}
