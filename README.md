# GenAI Builder Solution

# Architecture

![Untitled](readmefiles/Untitled.png)

# Features Introduction

![Untitled](readmefiles/snapshot1.gif)
![Untitled](readmefiles/snapshot2.gif)
![Untitled](readmefiles/snapshot3.gif)

# Deploy Manual

## 1. Prepare

1. AWS CLI Upgrade
    
    [https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)
    
2. AWS CDK Upgrade
    
    [https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/setting-up-node-on-ec2-instance.html](https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/setting-up-node-on-ec2-instance.html)
    
    ```jsx
    
    npm install -g aws-cdk
    cdk --version
    ```
3.  AWSCurl
    https://github.com/okigan/awscurl

    ```jsx
    
    pip install awscurl
    awscurl
    ```

4. Set Local Access Key and Secret Key, use a user access key which has access to deploy.
    
    ```jsx
    aws configure
    ```
    


## 2. Deploy Backend Serives

### 2.1 Get the latest source code from Github

```jsx
git clone https://github.com/cloudswb/aws-genai-bedrock-builder.git
```

### 2.2 PreConfig deployment

We can customize the project name prefix, this prefix will add to the CDK stack and Lambda function name.

```jsx
cd bin/
vim config.ts
```

Now you can modify this config file according the following comments:

```jsx
export const Config = {
    DomainName: 'piyao.com', // The domain name(used as a website S3 bucket with SiteSubDomain
    SiteSubDomain: 'genai-dev', // combine with DomainName as a S3 bucket name
    Region: "us-east-1", // The region will be deploy, suggest same with aws cli credentional setting.
    Auth: 'iam' //Auth type, DO NOT Change, we only support this IAM auth type currently.
}
```

### 2.3 Run deployment

Run the following shell script to deploy Backend service:

```jsx
./bin/deploy.sh 
```

After the message “All deploy task has finished.”  output in the terminal, that’s mean all deployment has finished.


## 3. Run website

### 3.1 Create login user in Cognito user pool

You can get the Cognito info from CloudFormation stack “[XXX]CognitoUserPoolStack”

![Untitled](readmefiles/Untitled%204.png)

![Untitled](readmefiles/Untitled%205.png)



### 3.2 Run Website deployment

Get the output the CloudFront Address: like the url : [d21wi5ogab28wm.cloudfront.net](http://d21wi5ogab28wm.cloudfront.net/) according to outputs.

![Untitled](readmefiles/Untitled%207.png)

Login use the user created in Chapter 4.1:

![Untitled](readmefiles/Untitled%208.png)



## 4. Destroy resources
```jsx
./bin/destroy.sh 
```

## 5. Advance Operation

<!-- ### 5.1 Change the project name to deploy multiple  -->