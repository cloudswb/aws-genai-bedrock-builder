# GenAI Builder Solution

# Architecture

![Untitled](readmefiles/Untitled.png)

# Features Introduction

![Untitled](readmefiles/snapshot1.gif)
![Untitled](readmefiles/snapshot2.gif)
![Untitled](readmefiles/snapshot3.gif)

# Deploy Manual

## 1. Precondition

1. AWS CLI Upgrade
    
    [https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)
    
2. AWS CDK Upgrade
    
    [https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/setting-up-node-on-ec2-instance.html](https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/setting-up-node-on-ec2-instance.html)
    
    ```jsx
    
    npm install -g aws-cdk
    cdk --version
    ```
    
3. Set Local Access Key and Secret Key, use a user access key which has access to deploy.
    
    ```jsx
    aws configure
    ```
    

## 2. Create Bedrock Agent and Bedrock Knowledge

2.1 Create Bedrock Agent

2.2 Create Knowledge Base 

## 3. Deploy Backend Serives

### 3.1 Get the latest source code from Github

```jsx
git clone https://github.com/cloudswb/aws-genai-bedrock-builder.git
```

### 3.2 PreConfig deployment

We can customize the project name prefix, this prefix will add to the CDK stack and Lambda function name.

```jsx
cd bin/
vim config.ts
```

Now you can modify this config file according the following comments:

```jsx
export const Config = {
    ProjectPrefix: 'DebugGenAIBuilder', // The project name prefix
    DomainName: 'piyao.com', // The domain name(used as a website S3 bucket with SiteSubDomain
    SiteSubDomain: 'genai-dev', // combine with DomainName as a S3 bucket name
    Region: "us-east-1", // The region will be deploy, suggest same with aws cli credentional setting.
    Auth: 'iam' //Auth type, DO NOT Change, we only support this IAM auth type currently.
}
```

### 3.3 Run deployment

3.1 Run the following shell script to deploy Backend service:

```jsx
./bin/deploy.sh backend
```

After the message “All deploy task has finished.”  output in the terminal, that’s mean all deployment has finished.

![Untitled](readmefiles/Untitled%201.png)

3.2 Config the lambda Access

Get the Access Key and Secret Key from “[XXX]IAMUserRoleStack”

![Untitled](readmefiles/Untitled%202.png)

Set the Access Key and Secret Key to the Environment Variable of Lambda Function “[XXX]SecuritySignFunction”

![Untitled](readmefiles/Untitled%203.png)

3.3 Create a user from Cognito to Login later.

You can get the Cognito info from CloudFormation stack “[XXX]CognitoUserPoolStack”

![Untitled](readmefiles/Untitled%204.png)

![Untitled](readmefiles/Untitled%205.png)

## 4. Deploy Frontend Website

### 4.1 PreConfig the Bedrock Agent for website

```jsx
cd src/frontend
vim backend.json
```

Input the Bedrock Agent Id and Bedrock Agent Alias in backend.json.

You can get the agentId in Chapter 2.

For agentAlias, if you did not create a Alias, you can input ‘TSTALIASID’ by default. otherwise, you need input the new created agent alias.

![Untitled](readmefiles/Untitled%206.png)

### 4.2 Run Website deployment

Use NPM to build the website

```jsx
cd src/frontend
npm install
npm run build
```

Deploy the website to S3 and CloudFront

```jsx
cd ../../
./bin/deploy.sh frontend
```

Get Frontend CloudFront distribution:

## 5. Test

Get the output the CloudFront Address: like the url : [d21wi5ogab28wm.cloudfront.net](http://d21wi5ogab28wm.cloudfront.net/) according to outputs.

![Untitled](readmefiles/Untitled%207.png)

Login and try to use:

![Untitled](readmefiles/Untitled%208.png)

## 6. Exception resolve

### 6.1 {"message":"The security token included in the request is invalid."}

![Untitled](readmefiles/Untitled%209.png)

**Reason:**

The User Access Key not exists in lambda or this key is inActive.

**Resolve:** 

Go to IAM user(cloudfromation output ‘LambdaIamUserArn’, in stack [XXX]IAMUserRoleStack),

Make sure the Access Key in Active.

![Untitled](readmefiles/Untitled%2010.png)