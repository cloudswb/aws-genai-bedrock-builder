import * as cdk from 'aws-cdk-lib';
import { Construct } from "constructs"
import { UserPool } from 'aws-cdk-lib/aws-cognito';
import {
    aws_opensearchserverless as opensearchserverless,
    aws_opensearchserverless as oss
} from 'aws-cdk-lib'
import { Config } from "../../bin/config"
import { aws_iam as iam, CfnOutput } from 'aws-cdk-lib';
import { AccountRootPrincipal } from 'aws-cdk-lib/aws-iam';
     

import { STS } from 'aws-sdk';

export class OpenSearchVectorDBStack extends cdk.Stack {

    private readonly _userPool: UserPool;
    public get userPool(): UserPool {
        return this._userPool;
    }


    public readonly kbRoleArn: string;
    public readonly collectionArn: string;


    constructor(scope: Construct, id: string,prefix: string, callerUserArn: string ) {
        super(scope, id);

        const prefixLower = prefix.toLowerCase()

        const collectionName = `bedrock-knowledge-base-gbuild`;

        const random = (length = 8) => {
            return Math.random().toString(16).substr(2, length);
        };

        // Bedrock Knowledge Base IAM role
        const kbRoleArn = new iam.Role(this, `${prefix}CollBedrockKnowledgeBaseRole`, {
            roleName: `AmazonBedrockExecutionRoleForKnowledgeBase_${random(6)}`,
            assumedBy: new iam.ServicePrincipal('bedrock.amazonaws.com'),
            managedPolicies: [iam.ManagedPolicy.fromAwsManagedPolicyName('AdministratorAccess')],
        }).roleArn;

        // Lambda IAM role
        const customResourceRole = new iam.Role(this, `${prefix}CollCustomResourceRole`, {
            assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
            managedPolicies: [iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole')],
        });

        // Opensearch encryption policy
        const encryptionPolicy = new oss.CfnSecurityPolicy(this, `${prefix}CollEncryptionPolicy`, {
            name: `gb-embeddings-encryption-policy`,
            type: 'encryption',
            description: `Encryption policy for ${collectionName} collection.`,
            policy: `
            {
            "Rules": [
                {
                "ResourceType": "collection",
                "Resource": ["collection/${collectionName}*"]
                }
            ],
            "AWSOwnedKey": true
            }
            `,
        });

        // Opensearch network policy
        const networkPolicy = new oss.CfnSecurityPolicy(this, `${prefix}CollNetworkPolicy`, {
            name: `gb-embeddings-network-policy`,
            type: 'network',
            description: `Network policy for ${collectionName} collection.`,
            policy: `
            [
                {
                "Rules": [
                    {
                    "ResourceType": "collection",
                    "Resource": ["collection/${collectionName}*"]
                    },
                    {
                    "ResourceType": "dashboard",
                    "Resource": ["collection/${collectionName}*"]
                    }
                ],
                "AllowFromPublic": true
                }
            ]
            `,
        });

        // Opensearch data access policy
        const dataAccessPolicy = new oss.CfnAccessPolicy(this, `${prefix}CollDataAccessPolicy`, {
            name: `gb-embeddings-access-policy`,
            type: 'data',
            description: `Data access policy for ${collectionName} collection.`,
            policy: `
            [
                {
                "Rules": [
                    {
                    "ResourceType": "collection",
                    "Resource": ["collection/${collectionName}*"],
                    "Permission": [
                        "aoss:CreateCollectionItems",
                        "aoss:DescribeCollectionItems",
                        "aoss:DeleteCollectionItems",
                        "aoss:UpdateCollectionItems"
                    ]
                    },
                    {
                    "ResourceType": "index",
                    "Resource": ["index/${collectionName}*/*"],
                    "Permission": [
                        "aoss:CreateIndex",
                        "aoss:DeleteIndex",
                        "aoss:UpdateIndex",
                        "aoss:DescribeIndex",
                        "aoss:ReadDocument",
                        "aoss:WriteDocument"
                    ]
                    }
                ],
                "Principal": [
                    "${customResourceRole.roleArn}",
                    "${kbRoleArn}",
                    "${callerUserArn}"
                ]
                }
            ]
            `,
        });


        const opensearchServerlessCollection = new opensearchserverless.CfnCollection(this, `${prefix}Collection`, {
            name: `${collectionName}`,

            // the properties below are optional
            description: 'description',
            standbyReplicas: 'DISABLED',
            type: 'VECTORSEARCH',

        });

        // Add the policy statement to the collection
        opensearchServerlessCollection.node.addDependency(encryptionPolicy);
        opensearchServerlessCollection.node.addDependency(networkPolicy);
        opensearchServerlessCollection.node.addDependency(dataAccessPolicy);

        this.collectionArn = opensearchServerlessCollection.attrArn
        new CfnOutput(this, 'CollectionArn', { value: opensearchServerlessCollection.attrArn });
        new CfnOutput(this, 'CollectionId', { value: opensearchServerlessCollection.attrId });

        this.kbRoleArn = kbRoleArn
        new CfnOutput(this, 'kbRoleArn', { value: kbRoleArn });

    }
}