import * as cdk from 'aws-cdk-lib';
import { Runtime, LayerVersion, Code } from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import { LambdaLayers } from "./lambda-common"

export class CDKLambdaLayerStack extends cdk.Stack {

    // public lambdaLayers: LambdaLayers;


    public readonly clientBedrockAgent: LayerVersion;
    public readonly clientBedrockAgentRuntime: LayerVersion;
    public readonly clientBedrockRuntime: LayerVersion;
    public readonly jsonwebtoken: LayerVersion;
    public readonly awsJwtVerify: LayerVersion;
    public readonly awsSdk: LayerVersion;
    public readonly cryptoJs: LayerVersion;
    public readonly moment: LayerVersion;

    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        this.clientBedrockAgent = new LayerVersion(this, 'client-bedrock-agent', {
            layerVersionName: 'client-bedrock-agent',
            code: Code.fromAsset('./src/backend/layers/client-bedrock-agent.zip'),
            description: '',
            compatibleRuntimes: [Runtime.NODEJS_18_X],
            removalPolicy: cdk.RemovalPolicy.DESTROY,
        });

        this.clientBedrockAgentRuntime = new LayerVersion(this, 'client-bedrock-agent-runtime', {
            layerVersionName: 'client-bedrock-agent-runtime',
            code: Code.fromAsset('./src/backend/layers/client-bedrock-agent-runtime.zip'),
            description: '',
            compatibleRuntimes: [Runtime.NODEJS_18_X],
            removalPolicy: cdk.RemovalPolicy.DESTROY
        });
        
        this.clientBedrockRuntime = new LayerVersion(this, 'client-bedrock-runtime', {
            layerVersionName: 'client-bedrock-runtime',
            code: Code.fromAsset('./src/backend/layers/client-bedrock-runtime.zip'),
            description: '',
            compatibleRuntimes: [Runtime.NODEJS_18_X],
            removalPolicy: cdk.RemovalPolicy.DESTROY
        });

        
        this.jsonwebtoken = new LayerVersion(this, 'jsonwebtoken', {
            layerVersionName: 'jsonwebtoken',
            code: Code.fromAsset('./src/backend/layers/jsonwebtoken.zip'),
            description: '',
            compatibleRuntimes: [Runtime.NODEJS_18_X],
            removalPolicy: cdk.RemovalPolicy.DESTROY
        });

        this.awsJwtVerify = new LayerVersion(this, 'aws-jwt-verify', {
            layerVersionName: 'aws-jwt-verify',
            code: Code.fromAsset('./src/backend/layers/aws-jwt-verify.zip'),
            description: '',
            compatibleRuntimes: [Runtime.NODEJS_18_X],
            removalPolicy: cdk.RemovalPolicy.DESTROY
        });

        this.awsSdk = new LayerVersion(this, 'aws-sdk', {
            layerVersionName: 'aws-sdk',
            code: Code.fromAsset('./src/backend/layers/aws-sdk.zip'),
            description: '',
            compatibleRuntimes: [Runtime.NODEJS_18_X],
            removalPolicy: cdk.RemovalPolicy.DESTROY
        });

        this.cryptoJs = new LayerVersion(this, 'crypto-js', {
            layerVersionName: 'crypto-js',
            code: Code.fromAsset('./src/backend/layers/crypto-js.zip'),
            description: '',
            compatibleRuntimes: [Runtime.NODEJS_18_X],
            removalPolicy: cdk.RemovalPolicy.DESTROY
        });

        this.moment = new LayerVersion(this, 'moment', {
            layerVersionName: 'moment',
            code: Code.fromAsset('./src/backend/layers/moment.zip'),
            description: '',
            compatibleRuntimes: [Runtime.NODEJS_18_X],
            removalPolicy: cdk.RemovalPolicy.DESTROY
        });


    }
}
