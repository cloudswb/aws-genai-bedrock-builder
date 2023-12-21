// Need to use AWS 
const AWS = require("aws-sdk");// Creating new S3 instance
const S3 = require("aws-sdk/clients/s3");

exports.handler = async (event, context) => {
  
  console.log('event:', event);
  
  let param = {}
  if(event.headers.auth =='iam'){
    let decodedString = Buffer.from(event.body, 'base64').toString('utf-8');
    console.log('decodedString:', decodedString);
    param = JSON.parse(decodedString);
  }
  else{
    param = JSON.parse(event.body);
  }
  
  
  if (!param.hasOwnProperty("bucketName") || param.bucketName == undefined || param.bucketName == "") {
      return {
          statusCode: 400,
          body: JSON.stringify({ message: 'Invalid bucketName' })
      };
  }
  const bucketName = param.bucketName;
  
  if (!param.hasOwnProperty("keyName") || param.keyName == undefined || param.keyName == "") {
      return {
          statusCode: 400,
          body: JSON.stringify({ message: 'Invalid keyName' })
      };
  }
  const keyName = param.keyName;
  
  if (!param.hasOwnProperty("ExpiresIn") || param.ExpiresIn == undefined || param.ExpiresIn == "") {
      param.ExpiresIn = 600
  }
  const ExpiresIn = param.ExpiresIn;
  

  
  const s3Client = new S3({
    apiVersion: "2006-03-01",
    accessKeyId: process.env.ACCESS_KEY,
    secretAccessKey: process.env.SECRET_KEY,
    region: process.env.REGION,
    signatureVersion: "v4",
  });

  const s3Params = {
    Bucket: bucketName, 
    Key: keyName,
    Expires: ExpiresIn
    // ContentType: `image/${ex}`,
  };

  const uploadUrl = await s3Client.getSignedUrl("putObject", s3Params);

  console.log("uploadUrl", uploadUrl);  
  return {
      statusCode: 200,
      body: { signedUrl: uploadUrl } //JSON.stringify({ signedUrl: signedUrl })
  }; 
};