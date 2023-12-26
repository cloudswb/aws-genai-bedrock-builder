import { LayerVersion } from 'aws-cdk-lib/aws-lambda';
import { Duration, Stack, StackProps } from "aws-cdk-lib"
import * as iam from 'aws-cdk-lib/aws-iam';
import { UserPool } from 'aws-cdk-lib/aws-cognito'

export class LambdaFunctionUrls{
    constructor(
        agentInvokeHost: string,
        modelInvokeHost: string,
        kbInvokeHost: string,
        kbListHost: string,
        kbIngestHost: string,
        s3PresignHost: string,
        s3QueryHost: string,
        securitySignHost: string
    ){
        this.agentInvokeHost = agentInvokeHost
        this.modelInvokeHost = modelInvokeHost
        this.kbInvokeHost = kbInvokeHost
        this.kbListHost = kbListHost
        this.kbIngestHost = kbIngestHost
        this.s3PresignHost = s3PresignHost
        this.s3QueryHost = s3QueryHost
        this.securitySignHost = securitySignHost
    }

    private _agentInvokeHost: string;
    public get agentInvokeHost(): string {
        return this._agentInvokeHost;
    }
    public set agentInvokeHost(value: string) {
        this._agentInvokeHost = value;
    }
    private _modelInvokeHost: string;
    public get modelInvokeHost(): string {
        return this._modelInvokeHost;
    }
    public set modelInvokeHost(value: string) {
        this._modelInvokeHost = value;
    }
    private _kbInvokeHost: string;
    public get kbInvokeHost(): string {
        return this._kbInvokeHost;
    }
    public set kbInvokeHost(value: string) {
        this._kbInvokeHost = value;
    }
    private _kbListHost: string;
    public get kbListHost(): string {
        return this._kbListHost;
    }
    public set kbListHost(value: string) {
        this._kbListHost = value;
    }
    private _kbIngestHost: string;
    public get kbIngestHost(): string {
        return this._kbIngestHost;
    }
    public set kbIngestHost(value: string) {
        this._kbIngestHost = value;
    }
    private _s3PresignHost: string;
    public get s3PresignHost(): string {
        return this._s3PresignHost;
    }
    public set s3PresignHost(value: string) {
        this._s3PresignHost = value;
    }
    private _s3QueryHost: string;
    public get s3QueryHost(): string {
        return this._s3QueryHost;
    }
    public set s3QueryHost(value: string) {
        this._s3QueryHost = value;
    }
    private _securitySign: string;
    public get securitySign(): string {
        return this._securitySign;
    }
    public set securitySign(value: string) {
        this._securitySign = value;
    }

    private _securitySignHost: string;
    public get securitySignHost(): string {
        return this._securitySignHost;
    }
    public set securitySignHost(value: string) {
        this._securitySignHost = value;
    }
}

export class LambdaLayers {

    constructor(
        clientBedrockAgent: LayerVersion,
        clientBedrockAgentRuntime: LayerVersion,
        clientBedrockRuntime: LayerVersion,
        jsonwebtoken: LayerVersion,
        awsJwtVerify: LayerVersion,
        awsSdk: LayerVersion,
        cryptoJs: LayerVersion,
        moment: LayerVersion) {

            this.clientBedrockAgent = clientBedrockAgent;
            this.clientBedrockAgentRuntime = clientBedrockAgentRuntime;
            this.clientBedrockRuntime = clientBedrockRuntime;
            this.jsonwebtoken = jsonwebtoken;
            this.awsJwtVerify = awsJwtVerify;
            this.awsSdk = awsSdk;
            this.cryptoJs = cryptoJs;
            this.moment = moment;
    }

    private _clientBedrockAgent: LayerVersion;
    public get clientBedrockAgent(): LayerVersion {
        return this._clientBedrockAgent;
    }
    public set clientBedrockAgent(value: LayerVersion) {
        this._clientBedrockAgent = value;
    }
    private _clientBedrockAgentRuntime: LayerVersion;
    public get clientBedrockAgentRuntime(): LayerVersion {
        return this._clientBedrockAgentRuntime;
    }
    public set clientBedrockAgentRuntime(value: LayerVersion) {
        this._clientBedrockAgentRuntime = value;
    }
    private _clientBedrockRuntime: LayerVersion;
    public get clientBedrockRuntime(): LayerVersion {
        return this._clientBedrockRuntime;
    }
    public set clientBedrockRuntime(value: LayerVersion) {
        this._clientBedrockRuntime = value;
    }
    private _jsonwebtoken: LayerVersion;
    public get jsonwebtoken(): LayerVersion {
        return this._jsonwebtoken;
    }
    public set jsonwebtoken(value: LayerVersion) {
        this._jsonwebtoken = value;
    }
    private _awsJwtVerify: LayerVersion;
    public get awsJwtVerify(): LayerVersion {
        return this._awsJwtVerify;
    }
    public set awsJwtVerify(value: LayerVersion) {
        this._awsJwtVerify = value;
    }
    private _awsSdk: LayerVersion;
    public get awsSdk(): LayerVersion {
        return this._awsSdk;
    }
    public set awsSdk(value: LayerVersion) {
        this._awsSdk = value;
    }

    private _cryptoJs: LayerVersion;
    public get cryptoJs(): LayerVersion {
        return this._cryptoJs;
    }
    public set cryptoJs(value: LayerVersion) {
        this._cryptoJs = value;
    }
    private _moment: LayerVersion;
    public get moment(): LayerVersion {
        return this._moment;
    }
    public set moment(value: LayerVersion) {
        this._moment = value;
    }

    // public readonly layers: LayerVersion[];

}



export interface LambdatackProps extends LambdaBaseProps {
    functionName: string,
    // customLayers: LayerVersion[],
    lambdaIamUser: iam.User,
    lambdaLayers: LambdaLayers,
    userPool?: UserPool,
    lambdaIamUserAccessKey?: string,
    lambdaIamUserSecretKey?: string,
    RecordsTableName?: string,
    
}

export interface LambdaBaseProps extends StackProps {
    functionName: string
}