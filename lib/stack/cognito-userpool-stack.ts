import * as cdk from 'aws-cdk-lib';
import { Construct } from "constructs"
import { UserPool, Mfa, UserPoolClient } from 'aws-cdk-lib/aws-cognito';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import { CfnOutput } from "aws-cdk-lib"
import { LambdaBaseProps } from "./lambda-common"

export class CdkCognitoUserPoolStack extends cdk.Stack {

    private readonly _userPool: UserPool;
    public get userPool(): UserPool {
        return this._userPool;
    }

    constructor(scope: Construct, id: string, props: LambdaBaseProps) {
        super(scope, id, props);

        // Create the user pool
        const userPool = new UserPool(this, `${props.functionName}UserPool`, {
            signInAliases: {
                username: true
            },
            userPoolName: `${props.functionName}UserPool`,
            mfa: Mfa.OFF,
            
        });
        
        this._userPool = userPool

        const userPoolClient = new UserPoolClient(this, `${props.functionName}UserPoolClient`, {
            userPoolClientName: `${props.functionName}UserPoolClient`,
            userPool: userPool,
            generateSecret: false,
            accessTokenValidity: cdk.Duration.hours(12),
            idTokenValidity: cdk.Duration.hours(12),
            supportedIdentityProviders: [
                cognito.UserPoolClientIdentityProvider.COGNITO,
            ],
          })

        // const client = userPool.addClient('app-client', {
        //     // ...
        //     supportedIdentityProviders: [
        //         cognito.UserPoolClientIdentityProvider.COGNITO,
        //     ],
        //     generateSecret: false,
        //     accessTokenValidity: cdk.Duration.hours(12),
        //     idTokenValidity: cdk.Duration.hours(12),
            
        //   });


        // const provider = new cognito.UserPoolIdentityProviderAmazon(this, 'Cognito', {
        //     userPool: userPool,
        //     clientId: client.userPoolClientId,
        //     clientSecret: client.userPoolClientSecret.toString()
        // });

        // client.node.addDependency(provider);
        
        new CfnOutput(this, `userPoolId`, {
            value: userPool.userPoolId
        });

        new CfnOutput(this, `userPoolArn`, {
            value: userPool.userPoolArn
        });

        new CfnOutput(this, `userPoolClientId`, {
            value: userPoolClient.userPoolClientId
        });
    }
}