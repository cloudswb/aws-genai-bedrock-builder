import {
  S3Client,
  // This command supersedes the ListObjectsCommand and is the recommended way to list objects.
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";

const region = process.env.REGION;
const client = new S3Client({ region: region });

export const handler = async (event) => {
  
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
  
  if (!param.hasOwnProperty("bucketPrefix") || param.bucketPrefix == undefined || param.bucketPrefix == "") {
      param.bucketPrefix = ""
  }
  
  const command = new ListObjectsV2Command({
    Bucket: param.bucketName,
    // The default and maximum number of keys returned is 1000. This limits it to
    // one for demonstration purposes.
    MaxKeys: 100,
    Prefix: param.bucketPrefix,
    Delimiter: "/",
    // FetchOwner: true
  });

  try {
    
    
    let isTruncated = true;

    console.log("Your bucket contains the following objects:\n");
    let contents = "";
    
    const allKeys = [];

    while (isTruncated) {
      // { Contents, IsTruncated, NextContinuationToken, CommonPrefixes }
      const result = 
        await client.send(command);
      // console.log("result:", result);
      
      // Process objects in Contents
      if(result.Contents != undefined){
        for (const content of result.Contents) {
          // console.log("content", content)
          allKeys.push({ "Key": content.Key, "IsFolder": false, "Size": content.Size, "LastModified": content.LastModified });
        }
      }
        
      if(result.CommonPrefixes != undefined){
        for (const commonPrefix of result.CommonPrefixes) {
          // Add the folder path to the array
          allKeys.push({ "Key": commonPrefix.Prefix, "IsFolder": true, "Size": '', "LastModified": '' });
        }
      }
      
      console.log("allKeys:", allKeys)
      // console.log("Contents:", JSON.stringify(Contents));
      // console.log("CommonPrefixes:", JSON.stringify(CommonPrefixes));
      
      // const contentsList = Contents.map((c) => `${c.Key}`).join("\n");
      // contents += contentsList + "\n";
      isTruncated = result.IsTruncated;
      command.input.ContinuationToken = result.NextContinuationToken;
    }
    // console.log(contents);
      
    const response = {
      statusCode: 200,
      body: JSON.stringify(allKeys),
    };
    return response;
  } catch (err) {
    console.error(err);
    const response = {
      statusCode: 200,
      body: JSON.stringify(err),
    };
    return response;
  }

};
