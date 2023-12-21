// import aws from 'aws-sdk';
import crypto from 'crypto-js'
import moment from 'moment'
import jwt from 'jsonwebtoken'

export function getSignedPostHeader(host, region, request_parameters) {

  const access_key = process.env.ACCESS_KEY;
  const secret_key = process.env.SECRET_KEY;
  const method = 'POST';
  const service = 'lambda';
  const content_type = 'application/x-amz-json-1.1';
  

  // DynamoDB requires an x-amz-target header that has this format:
  //     DynamoDB_<API version>.<operationName>
  const amz_target = 'AWSShineFrontendService_20170701.TranslateText';

  // const prompt = selectedPromptValue.replace(/\${ask}/g, ask);;
  // const promptText = `Human: <paragraph>${translateOption.ask}</paragraph>\n\n ${translateOption.prompt}, you need translate the content in <paragraph> in to ${translateOption.target} and output result within <result> tag.\n\nAssistant:`


  function getSignatureKey(key, dateStamp, regionName, serviceName) {
    var kDate = crypto.HmacSHA256(dateStamp, "AWS4" + key);
    var kRegion = crypto.HmacSHA256(regionName, kDate);
    var kService = crypto.HmacSHA256(serviceName, kRegion);
    var kSigning = crypto.HmacSHA256("aws4_request", kService);
    return kSigning;
  }

  // Request parameters for CreateTable--passed in a JSON block.
  console.log(request_parameters)

  const canonical_uri = '/';

  // ************* TASK 1: CREATE A CANONICAL REQUEST *************
  // http://docs.aws.amazon.com/general/latest/gr/sigv4-create-canonical-request.html

  // Step 1 is to define the verb (GET, POST, etc.)--already done.

  // Step 2: Create canonical URI--the part of the URI from domain to query 
  // string (use '/' if no path)
  // Create a date for headers and the credential string
  const amz_date = moment().utc().format("yyyyMMDDTHHmmss\\Z")
  const date_stamp = moment().utc().format("yyyyMMDD")

  //// Step 3: Create the canonical query string. In this example, request
  // parameters are passed in the body of the request and the query string
  // is blank.
  const canonical_querystring = ''

  //## DOing step 6 first so that I can include the payload hash in the cannonical header, per https://docs.aws.amazon.com/AmazonS3/latest/API/sig-v4-header-based-auth.html
  // Step 6: Create payload hash. In this example, the payload (body of
  // the request) contains the request parameters.
  //const payload_hash = hashlib.sha256(request_parameters.encode('utf-8')).hexdigest()
  const payload_hash = crypto.SHA256(request_parameters);
  console.log('payload_hash:', payload_hash)

  // Step 4: Create the canonical headers. Header names must be trimmed
  // and lowercase, and sorted in code point order from low to high.
  // Note that there is a trailing \n.
  // const canonical_headers = 'host:' + host + '\n' + 'x-amz-content-sha256:' + payload_hash + '\n' + 'x-amz-date:' + amz_date + '\n' + 'x-amz-target:' + amz_target + '\n'
  const canonical_headers = 'content-type:' + content_type + '\n' + 'host:' + host + '\n' + 'x-amz-date:' + amz_date + '\n' + 'x-amz-target:' + amz_target + '\n'

  // Step 5: Create the list of signed headers. This lists the headers
  // in the canonical_headers list, delimited with ";" and in alpha order.
  // Note: The request can include any headers; canonical_headers and
  // signed_headers include those that you want to be included in the
  // hash of the request. "Host" and "x-amz-date" are always required.
  const signed_headers = 'content-type;host;x-amz-date;x-amz-target'

  // Step 7: Combine elements to create canonical request
  const canonical_request = method + '\n' + canonical_uri + '\n' + canonical_querystring + '\n' + canonical_headers + '\n' + signed_headers + '\n' + payload_hash
  // const canonical_request = method + '\n' + canonical_uri + '\n' + canonical_querystring + '\n' + canonical_headers + '\n' + signed_headers + '\n' + payload_hash
  console.log('canonical_request:', canonical_request)

  // ************* TASK 2: CREATE THE STRING TO SIGN*************
  // Match the algorithm to the hashing algorithm you use, either SHA-1 or
  // SHA-256 (recommended)
  const algorithm = 'AWS4-HMAC-SHA256'
  const credential_scope = date_stamp + '/' + region + '/' + service + '/' + 'aws4_request'
  const string_to_sign = algorithm + '\n' + amz_date + '\n' + credential_scope + '\n' + crypto.SHA256(canonical_request);
  console.log('string_to_sign:', string_to_sign)

  // ************* TASK 3: CALCULATE THE SIGNATURE *************
  // Create the signing key using the function defined above.
  const signing_key = getSignatureKey(secret_key, date_stamp, region, service)
  console.log('signing_key:', signing_key)

  // Sign the string_to_sign using the signing_key
  // const signature = crypto.HmacSHA256(string_to_sign, signing_key);

  // Create an HMAC hash using SHA-256
  const hash = crypto.HmacSHA256(string_to_sign, signing_key);

  // Convert the hash to a hexadecimal string
  const signature = crypto.enc.Hex.stringify(hash);


  console.log('signature:', signature)
  // ************* TASK 4: ADD SIGNING INFORMATION TO THE REQUEST *************
  // Put the signature information in a header named Authorization.
  const authorization_header = algorithm + ' ' + 'Credential=' + access_key + '/' + credential_scope + ', ' + 'SignedHeaders=' + signed_headers + ', ' + 'Signature=' + signature
  

  console.log("authorization_header:", authorization_header)

  // For DynamoDB, the request can include any headers, but MUST include "host", "x-amz-date",
  // "x-amz-target", "content-type", and "Authorization". Except for the authorization
  // header, the headers must be included in the canonical_headers and signed_headers values, as
  // noted earlier. Order here is not significant.
  const headers = {
    'X-Amz-Content-Sha256': payload_hash,
    'X-Amz-Date': amz_date,
    'X-Amz-Target': amz_target,
    'Authorization': authorization_header,
    'Content-Type': content_type,
    'auth': "iam"
  }

  return headers;

}


export const handler = async (event) => {
  
  console.log("event:", event);
  
  jwt.verify(event.token, process.env.SECRET_KEY, function(err, decoded) {
    if (err) {
      const response = {
        statusCode: 400,
        body: JSON.stringify(err),
      };
      return response;
    }
  });
  
  const responseObj = getSignedPostHeader(event.host, event.region, event.request_parameters);
  console.log("responseObj:", responseObj)
  // TODO implement
  const response = {
    statusCode: 200,
    body: JSON.stringify(responseObj),
  };
  return response;
};
