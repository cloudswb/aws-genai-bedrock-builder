import * as cdk from 'aws-cdk-lib';
import { Construct } from "constructs"
import { UserPool } from 'aws-cdk-lib/aws-cognito';
import { CfnOutput } from "aws-cdk-lib"
import { BedrockKnowledgeBase } from 'bedrock-agents-cdk';
import { Config } from "../../bin/config"

export class BedrockKBStack extends cdk.Stack {

    private readonly _userPool: UserPool;
    public get userPool(): UserPool {
        return this._userPool;
    }

    constructor(scope: Construct, id: string, collectionArn: string, kbRoleArn: string, kbS3Arn: string) {
        super(scope, id);

        const kbName = 'GenAIBuilderKnowledgeBase';
        const dataSourceName = 'GenAIBuilderDataSource';
        const vectorIndexName = 'bedrock-knowledge-base-default-index';
        const vectorFieldName = 'bedrock-knowledge-base-default-vector';
        const textField = 'AMAZON_BEDROCK_TEXT_CHUNK';
        const metadataField = 'AMAZON_BEDROCK_METADATA';
        const storageConfigurationType = 'OPENSEARCH_SERVERLESS';
        const dataSourceType = 'S3';
        const dataSourceBucketArn = kbS3Arn;

        // Create Bedrock Knowledge Base backed by OpenSearch Servereless
        const myOpenSearchKb = new BedrockKnowledgeBase(this, 'BedrockOpenSearchKnowledgeBase', {
            name: kbName,
            roleArn: kbRoleArn,
            storageConfiguration: {
                opensearchServerlessConfiguration: {
                    collectionArn: collectionArn,
                    fieldMapping: {
                        metadataField: metadataField,
                        textField: textField,
                        vectorField: vectorFieldName,
                    },
                    vectorIndexName: vectorIndexName,
                },
                type: storageConfigurationType,
            },
            dataSource: {
                name: dataSourceName,
                dataSourceConfiguration: {
                    s3Configuration: {
                        bucketArn: dataSourceBucketArn,
                    },
                    type: dataSourceType,
                },
            },
            knowledgeBaseConfiguration:{
                type: "VECTOR",
                vectorKnowledgeBaseConfiguration:{
                    embeddingModelArn: `arn:aws:bedrock:${Config.Region}::foundation-model/${Config.KBEmbeddingModelName}`
                }
            }
        });

        new CfnOutput(this, 'BedrockKnowledgeBaseArn', { value: myOpenSearchKb.knowledgeBaseArn });

    }
}