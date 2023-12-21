// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import React, { Component, useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';

import {
  BreadcrumbGroup,
  Button,
  Container,
  ContentLayout,
  Form,
  Header,
  FormField,
  SpaceBetween,
  S3ResourceSelector,
  ColumnLayout,
  Select,
  FileUpload,
} from '@cloudscape-design/components';
import {
  getSignedPostHeader,
} from '../details/common-components';
import { CustomAppLayout, Navigation } from '../commons/common-components';
import { writeToS3Breadcrumbs } from '../../common/breadcrumbs';

import '../../styles/base.scss';
import { config } from '../../../config';
// import https from "https";

const i18nStringsWriteMode = {
  modalTitle: 'Choose destination for upload doc in to Knowledge base',
  // inContextInputPlaceholder: 's3://bucket/prefix',
};

const Breadcrumbs = () => (
  <BreadcrumbGroup items={writeToS3Breadcrumbs} expandAriaLabel="Show path" ariaLabel="Breadcrumbs" />
);

let selectedS3BucketName = ''

class S3ResourceSelectorContainer extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      serverSideError: null,
      resource: { uri: '' },
      alert: null,
      errorText: null,
      viewHref: '',
    };

    this.onChange = this.onChange.bind(this);
  }

  async fetch(resourceType, bucket, path) {
    console.log("resourceType:", resourceType);
    console.log("bucket:", bucket);
    console.log("path:", path);
    console.log("selectedS3BucketName:", selectedS3BucketName);
    if (resourceType === "buckets") {
      if (selectedS3BucketName == '') {
        return [];
      }
      return [
        {
          "Name": selectedS3BucketName,
          "CreationDate": "",
          "__region": "",
        },

      ]
    }
    else if (resourceType === "objects") {
      this.setState({ serverSideError: null });

      try {

        const s3Objects = await this.getS3BucketObjects(bucket, path)
        console.log("s3Objects:", s3Objects);
        return JSON.parse(s3Objects.body);
        // const result = await getItems(resourceType, bucket, path);
        // console.log("result:", result);

        // if (resourceType === 'buckets') {
        //   await Promise.all(result.map(bucket => requestAsyncAttribute(bucket, 'Region')));
        // }
        // return result;
      } catch (error) {
        this.setState({
          serverSideError: error,
        });
        throw error;
      }
    }
  }

  async getS3BucketObjects(bucketName, bucketPrefix) {

    const method = 'POST';
    const host = config.LambdaS3Query_URL; //"b5c6l7viujrat5xazmmw7ommlu0sjxsq.lambda-url.us-east-1.on.aws";
    const region = config.REGION;
    const base = config.Lambda_URL_BASE;

    const request_parameters = `{"bucketName": "${bucketName}", "bucketPrefix": "${bucketPrefix}"}`;
    console.log("request_parameters", request_parameters);

    let headers = {}
    if(config.AUTH.toLowerCase() == 'iam'){
      headers = await getSignedPostHeader(host, region, request_parameters);
    }
    else{
      headers = { 'auth': "cognito" }
    }
    // setSubmitText('Loading')
    // setSubmitState(true)

    let streamedData = ''

    // ************* SEND THE REQUEST *************
    return await fetch(
      base + host,
      {
        method: method,
        headers: headers,
        body: request_parameters, // JSON.stringify({ prompt: 'what is ec2?' }),
      }
    )
      .then((response) => {
        streamedData = '';
        console.log("response", response);


        // streamedData = '';
        console.log(response);
        console.log(response.body);

        const reader = response.body.getReader();
        // Read data from the stream
        const readData = () => {
          return reader.read().then(({ done, value }) => {
            if (done) {
              console.log('streamedData:', streamedData);
              // translateOption.translated = streamedData;
              console.log("Stream complete");

              const data = JSON.parse(streamedData);
              console.log('bucket data:', data);
              return data;


            } else {
              streamedData = streamedData + `${new TextDecoder()
                .decode(value)}`;

              console.log(streamedData);
              // setTranslatedContent(streamedData)
              // Continue reading data
              return readData();
            }
          });
        };

        // Start reading data from the stream
        const data = readData();
        console.log("data:", data);
        return data;

      })
      .catch((error) => {
        console.error("Error:", error);
        // setSubmitText('Search')
        // setSubmitState(false)
      });
  };


  //
  // Resource has been confirmed:
  // Modal submit / Version picker selection / Uri input field change event
  //
  onChange({ detail }) {
    const { resource, errorText } = detail;

    this.setState({
      errorText,
      resource,
      viewHref: resource.uri !== '' && !errorText ? 'https://amazons3.demo.s3-resource-selector/test/1' : '',
    });
  }

  render() {
    const { errorText, resource, serverSideError, viewHref } = this.state;
    const s3ResourceSelectorProps = {
      // alert: serverSideError && <ErrorAlert error={serverSideError} />,
      resource: resource,
      viewHref: viewHref,
      selectableItemsTypes: ['buckets', 'objects'],
      objectsIsItemDisabled: object => !object.IsFolder,
      bucketsVisibleColumns: ['Name', 'Region', 'CreationDate'],
      i18nStrings: i18nStringsWriteMode,
      fetchBuckets: () => this.fetch('buckets'),
      fetchObjects: (bucket, path) => this.fetch('objects', bucket, path),
      // fetchVersions: (bucket, path) => this.fetch('versions', bucket, path),
      onChange: this.onChange,
    };
    return (
      <FormField
        label="Write knowledge docuement to S3"
        description="Enter a destination in Amazon S3 where your Knowledge base will be store."
        constraintText="Use s3://bucket/prefix format."
        errorText={errorText}
        stretch={true}
        i18nStrings={{ errorIconAriaLabel: 'Error' }}
      >
        <S3ResourceSelector {...s3ResourceSelectorProps} />
      </FormField>
    );
  }
}

const ParentComponent = () => {

  const [selectedKBValue, setSelectedKBValue] = useState('');
  const [selectedKBID, setSelectedKBID] = useState('');
  const [kbItems, setKBItems] = useState([]);


  const [selectedKBDatasourceValue, setSelectedKBDatasourceValue] = useState('');
  const [selectedKBDatasourceID, setSelectedKBDatasourceID] = useState('');
  const [kbDataSourceItems, setKBDataSourceItems] = useState([]);

  const [selectedS3BucketArn, setSelectedS3BucketArn] = useState('');


  const listKB = async () => {

    const method = 'POST';
    const host = config.LambdaKBList_URL;
    const region = config.REGION;
    const base = config.Lambda_URL_BASE;

    const request_parameters = `{"actionType": "listKb", "kbName": "1"}`;

    let headers = {}
    if(config.AUTH.toLowerCase() == 'iam'){
      headers = await getSignedPostHeader(host, region, request_parameters);
    }
    else{
      headers = { 'auth': "cognito" }
    }

    // setSubmitText('Loading')
    // setSubmitState(true)

    let streamedData = ''

    // ************* SEND THE REQUEST *************
    fetch(
      base + host,
      {
        method: method,
        headers: headers,
        body: request_parameters, // JSON.stringify({ prompt: 'what is ec2?' }),
      }
    )
      .then((response) => {
        streamedData = '';
        console.log("response", response);


        // streamedData = '';
        console.log(response);
        console.log(response.body);
        kbItems.clea

        const reader = response.body.getReader();
        // Read data from the stream
        const readData = () => {
          return reader.read().then(({ done, value }) => {
            if (done) {
              console.log('streamedData:', streamedData);
              // translateOption.translated = streamedData;
              console.log("Stream complete");

              const streamedDataObj = JSON.parse(streamedData);
              console.log('streamedData body:', streamedDataObj.body);
              const data = streamedDataObj.body

              // setkbItems(data); // Update state with fetched data
              console.log("data", data);
              // setSelectedKBValue(data[0].name);
              // setSelectedKBID(data[0].knowledgeBaseId);

              // setkbItems([{knowledgeBaseId: "AFGP3CY9RC", name: "genai-build-knowledge-base-1", value: "ACTIVE", updatedAt: "2023-12-01T16:15:36.148Z"}, ...kbItems]);

              const newKBItems = []
              console.log("newKBItems start:", newKBItems);
              data.map((item) => {
                newKBItems.push({ knowledgeBaseId: item.knowledgeBaseId, value: item.name, status: item.status, updatedAt: item.updatedAt })
                
              });
              console.log("newKBItems end:", newKBItems);

              setKBItems(newKBItems);
              setSelectedS3BucketArn('');

              console.log("kbItems:", kbItems)
              // setSubmitText('Search')
              // setSubmitState(false)


            } else {
              streamedData = streamedData + `${new TextDecoder()
                .decode(value)}`;

              console.log(streamedData);
              // setTranslatedContent(streamedData)
              // Continue reading data
              return readData();
            }
          });
        };

        // Start reading data from the stream
        return readData();

      })
      .catch((error) => {
        console.error("Error:", error);
        // setSubmitText('Search')
        // setSubmitState(false)
      });
  };

  const listKBDataSource = async (kbid) => {

    const method = 'POST';
    const host = config.LambdaKBList_URL;
    const region = config.REGION;
    const base = config.Lambda_URL_BASE;

    const request_parameters = `{"actionType": "listKBDataSource", "knowledgeBaseId": "${kbid}"}`;

    let headers = {}
    if(config.AUTH.toLowerCase() == 'iam'){
      headers = await getSignedPostHeader(host, region, request_parameters);
    }
    else{
      headers = { 'auth': "cognito" }
    }

    // setSubmitText('Loading')
    // setSubmitState(true)

    let streamedData = ''

    // ************* SEND THE REQUEST *************
    fetch(
      base + host,
      {
        method: method,
        headers: headers,
        body: request_parameters, // JSON.stringify({ prompt: 'what is ec2?' }),
      }
    )
      .then((response) => {
        streamedData = '';
        console.log("response", response);


        // streamedData = '';
        console.log(response);
        console.log(response.body);

        const reader = response.body.getReader();
        // Read data from the stream
        const readData = () => {
          return reader.read().then(({ done, value }) => {
            if (done) {
              console.log('streamedData:', streamedData);
              // translateOption.translated = streamedData;
              console.log("Stream complete");

              const streamedDataObj = JSON.parse(streamedData);
              console.log('streamedData body:', streamedDataObj.body);
              const data = streamedDataObj.body

              // setkbItems(data); // Update state with fetched data
              console.log("data", data);
              // setSelectedKBDatasourceValue(data[0].name);
              // setSelectedKBDatasourceID(data[0].dataSourceId);

              const newKBDataSourceItems = []
              data.map((item) => {
                newKBDataSourceItems.push({ knowledgeBaseId: item.knowledgeBaseId, value: item.name, status: item.status, dataSourceId: item.dataSourceId });
              });

              setKBDataSourceItems(newKBDataSourceItems);

              console.log(kbDataSourceItems)


            } else {
              streamedData = streamedData + `${new TextDecoder()
                .decode(value)}`;

              console.log(streamedData);
              // setTranslatedContent(streamedData)
              // Continue reading data
              return readData();
            }
          });
        };

        // Start reading data from the stream
        return readData();

      })
      .catch((error) => {
        console.error("Error:", error);
        // setSubmitText('Search')
        // setSubmitState(false)
      });
  };

  const getDataSourceDetail = async (kbId, kbDataSourceID) => {

    const method = 'POST';
    const host = config.LambdaKBList_URL;
    const region = config.REGION;
    const base = config.Lambda_URL_BASE;

    const request_parameters = `{"actionType": "getDataSourceDetail", "knowledgeBaseId": "${kbId}", "dataSourceId": "${kbDataSourceID}"}`;
    console.log("request_parameters", request_parameters);

    let headers = {}
    if(config.AUTH.toLowerCase() == 'iam'){
      headers = await getSignedPostHeader(host, region, request_parameters);
    }
    else{
      headers = { 'auth': "cognito" }
    }
    // setSubmitText('Loading')
    // setSubmitState(true)

    let streamedData = ''

    // ************* SEND THE REQUEST *************
    fetch(
      base + host,
      {
        method: method,
        headers: headers,
        body: request_parameters, // JSON.stringify({ prompt: 'what is ec2?' }),
      }
    )
      .then((response) => {
        streamedData = '';
        console.log("response", response);


        // streamedData = '';
        console.log(response);
        console.log(response.body);

        const reader = response.body.getReader();
        // Read data from the stream
        const readData = () => {
          return reader.read().then(({ done, value }) => {
            if (done) {
              console.log('streamedData:', streamedData);
              // translateOption.translated = streamedData;
              console.log("Stream complete");

              const streamedDataObj = JSON.parse(streamedData);
              console.log('streamedData body:', streamedDataObj.body);
              const data = streamedDataObj.body

              // setkbItems(data); // Update state with fetched data
              console.log("bucketArn", data.bucketArn);
              // alert(data.bucketArn)

              setSelectedS3BucketArn(data.bucketArn);
              selectedS3BucketName = data.bucketArn.replace("arn:aws:s3:::", '')
              // alert(selectedS3BucketArn)


              // // setkbItems([{knowledgeBaseId: "AFGP3CY9RC", name: "genai-build-knowledge-base-1", value: "ACTIVE", updatedAt: "2023-12-01T16:15:36.148Z"}, ...kbItems]);

              // data.map((item) => {
              //   setKBItems([{knowledgeBaseId: item.knowledgeBaseId, value: item.name, status: item.status, updatedAt: item.updatedAt}, ...kbItems]);
              // });

              console.log(selectedS3BucketArn)
              // setSubmitText('Search')
              // setSubmitState(false)

            } else {
              streamedData = streamedData + `${new TextDecoder()
                .decode(value)}`;

              console.log(streamedData);
              // setTranslatedContent(streamedData)
              // Continue reading data
              return readData();
            }
          });
        };

        // Start reading data from the stream
        return readData();

      })
      .catch((error) => {
        console.error("Error:", error);
        // setSubmitText('Search')
        // setSubmitState(false)
      });
  };


  const getPreSignedUrl = async (bucketName, keyName, expireTime = 60) => {

    const method = 'POST';
    const host = config.LambdaS3Presign_URL;
    const region = config.REGION;
    const base = config.Lambda_URL_BASE;

    const request_parameters = `{"bucketName": "${bucketName}", "keyName": "${keyName}", "ExpiresIn": ${expireTime}}`;
    console.log("request_parameters", request_parameters);

    let headers = {}
    if(config.AUTH.toLowerCase() == 'iam'){
      headers = await getSignedPostHeader(host, region, request_parameters);
    }
    else{
      headers = { 'auth': "cognito" }
    }
    // setSubmitText('Loading')
    // setSubmitState(true)

    let streamedData = ''

    // ************* SEND THE REQUEST *************
    return await fetch(
      base + host,
      {
        method: method,
        headers: headers,
        body: request_parameters, // JSON.stringify({ prompt: 'what is ec2?' }),
      }
    )
      .then((response) => {
        streamedData = '';
        console.log("response", response);


        // streamedData = '';
        console.log(response);
        console.log(response.body);

        const reader = response.body.getReader();
        // Read data from the stream
        const readData = () => {
          return reader.read().then(({ done, value }) => {
            if (done) {
              console.log('streamedData:', streamedData);
              // translateOption.translated = streamedData;
              console.log("Stream complete");

              const data = JSON.parse(streamedData);

              // setkbItems(data); // Update state with fetched data
              console.log("signedUrl", data.body.signedUrl);
              return data.body.signedUrl;

            } else {
              streamedData = streamedData + `${new TextDecoder()
                .decode(value)}`;

              console.log(streamedData);
              // setTranslatedContent(streamedData)
              // Continue reading data
              return readData();
            }
          });
        };

        // Start reading data from the stream
        return readData();

      })
      .catch((error) => {
        console.error("Error:", error);
        // setSubmitText('Search')
        // setSubmitState(false)
      });
  };


  async function startSyncKBDataSource (knowledgeBaseId, dataSourceId) {

    setSyncState(true);
    setSyncText('Syncing');

    const method = 'POST';
    const host = config.LambdaKBIngest_URL; //"36fm7myj56rvdpd2733olgjzye0cidsg.lambda-url.us-east-1.on.aws"; //config.KB_INGESTION_URL;
    const region = config.REGION;
    const base = config.Lambda_URL_BASE;

    const request_parameters = `{"knowledgeBaseId": "${knowledgeBaseId}", "dataSourceId": "${dataSourceId}" }`;
    console.log("request_parameters", request_parameters);

    let headers = {}
    if(config.AUTH.toLowerCase() == 'iam'){
      headers = await getSignedPostHeader(host, region, request_parameters);
    }
    else{
      headers = { 'auth': "cognito" }
    }

    // setSubmitText('Loading')
    // setSubmitState(true)

    let streamedData = ''
    let auth = 'iam';

    // ************* SEND THE REQUEST *************
    return await fetch(
      base + host,
      {
        method: method,
        headers: headers,
        body: request_parameters, // JSON.stringify({ prompt: 'what is ec2?' }),
      }
    )
      .then((response) => {
        streamedData = '';
        console.log("response", response);


        // streamedData = '';
        console.log(response);
        console.log(response.body);

        const reader = response.body.getReader();
        // Read data from the stream
        const readData = () => {
          return reader.read().then(({ done, value }) => {
            if (done) {
              console.log('streamedData:', streamedData);
              // translateOption.translated = streamedData;
              console.log("Stream complete");

              const data = JSON.parse(streamedData);

              // setkbItems(data); // Update state with fetched data
              console.log("data", data);
              setSyncState(false);
              setSyncText('Sync');
              return data;

            } else {
              streamedData = streamedData + `${new TextDecoder()
                .decode(value)}`;

              console.log(streamedData);
              // setTranslatedContent(streamedData)
              // Continue reading data
              return readData();
            }
          });
        };

        // Start reading data from the stream
        return readData();

      })
      .catch((error) => {
        console.error("Error:", error);
        setSyncState(false);
        setSyncText('Sync');
    
      });
  };

  const defaultState = {
    sslCertificate: 'default',
    cloudFrontRootObject: '',
    alternativeDomainNames: '',
    s3BucketSelectedOption: null,
    certificateExpiryDate: '',
    certificateExpiryTime: '',
    httpVersion: 'http2',
    ipv6isOn: false,
    functions: [],
  };


  const [distributionPanelData, setDistributionPanelData] = useState(
    { ...defaultState }
  );

  // useEffect(() => {

  //   updateDirty(isDirty);
  // }, [distributionPanelData]);

  const onFileUploadChange = (attribute, value) => {
    // if (readOnlyWithErrors) {
    //   return;
    // }

    console.log('select new files attribute: ', attribute);
    console.log('select new files value: ', value);
    console.log('select new files value-name : ', value[0].webkitRelativePath);

    const newState = { ...distributionPanelData };
    newState[attribute] = value;

    console.log(newState);
    setDistributionPanelData(newState);
  };

  useEffect(() => {
    const isDirty = JSON.stringify(distributionPanelData) !== JSON.stringify(defaultState);
    listKB();
  }, [distributionPanelData]);



  async function uploadFileToS3ByPresignedURL(url, data) {
    try {

      const response = await fetch(url, {
        method: "PUT",
        headers: { "Content-Length": new Blob([data]).size.toString() },
        body: data,
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
  
      const responseBody = await response.text();

      console.log("uploaded responseBody:", responseBody);

      return responseBody;
    } catch (err) {
      console.error(err);
      throw err;
    }
  }


  const [submitState, setSubmitState] = useState(false);
  const [submitText, setSubmitText] = useState('Upload');

  const [syncState, setSyncState] = useState(false);
  const [syncText, setSyncText] = useState('Sync');

  async function uploadForm(event) {
    
    // event.preventDefault();



    setTimeout(() => {
      setSubmitState(true);
      setSubmitText('Uploading');
      setSyncState(true);
    }, 1);

    if(selectedS3BucketName == undefined || selectedS3BucketName == ""){
      // alert("Please choose a Knowledge base and data source first.")

      setTimeout(() => {
        setSubmitState(false);
        setSubmitText('Upload');
        setSyncState(false);
      }, 10);
      return;
    }


    const processAndRemoveItems = async () => {
      const functionsCopy = [...distributionPanelData.functions];
    
      for (let i = 0; i < functionsCopy.length; i++) {
        const currentItem = functionsCopy[i];
    
        // Process business logic using currentItem
        await processBusinessLogic(currentItem);
    
        // Remove the current item
        functionsCopy.splice(i, 1);
    
        // Update the state
        setDistributionPanelData(prevData => ({
          ...prevData,
          functions: [...functionsCopy],
        }));
    
        // Decrement i to stay at the same index in the next iteration
        i--;
      }
    };
    
    const processBusinessLogic = async (file) => {
      if (file) {
        const presignedUrl = await getPreSignedUrl(selectedS3BucketName, file.name, 60);
        console.log("presignedUrl before upload:", presignedUrl);
        let uploadedResponse = await uploadFileToS3ByPresignedURL(presignedUrl, file);
        console.log("uploadedResponse:", uploadedResponse);
      }
    };
    
    await processAndRemoveItems();

    setTimeout(() => {
      setSubmitState(false);
      setSubmitText('Upload');
      setSyncState(false);
    }, 0);

    return;
  }

  const cleanDistributionPanelData = () => {
    console.log("cleanDistributionPanelData");
    // Create a new object with the same structure as defaultState
    const cleanedData = { ...defaultState };

    // Set the state to the cleaned data
    setDistributionPanelData(cleanedData);
  };

  return (
    <Container header={<Header variant="h2">Upload docuement to Knowledge Base</Header>}>
      <ColumnLayout columns={3}>
        <FormField label="Select Knowledge Base">
          <Select
            data-testid="engine-filter"
            // options={selectEngineOptions}
            selectedAriaLabel="Selected"
            options={kbItems}
            onChange={event => {
              // alert(event.detail.selectedOption.name);
              setSelectedKBValue(event.detail.selectedOption.value);
              setSelectedKBID(event.detail.selectedOption.knowledgeBaseId);
              listKBDataSource(event.detail.selectedOption.knowledgeBaseId);

            }}
            selectedOption={kbItems.find(option => option.value == selectedKBValue)}
            ariaDescribedby={null}
            expandToViewport={true}
          />
        </FormField>
        <FormField label="Select Data Source">
          <Select
            data-testid="engine-filter"
            // options={selectEngineOptions}
            selectedAriaLabel="Selected"
            options={kbDataSourceItems}
            onChange={event => {
              // alert(event.detail.selectedOption.name);
              console.log("event.detail.selectedOption.value", event.detail.selectedOption.value);
              setSelectedKBDatasourceValue(event.detail.selectedOption.value);
              setSelectedKBDatasourceID(event.detail.selectedOption.dataSourceId);
              getDataSourceDetail(selectedKBID, event.detail.selectedOption.dataSourceId);

            }}
            selectedOption={kbDataSourceItems.find(option => option.value == selectedKBDatasourceValue)}
            ariaDescribedby={null}
            expandToViewport={true}
            disabled={!selectedKBValue}
          />
        </FormField>
        <FormField label="Target S3 Bucket">
          <div> {selectedS3BucketName} </div>
        </FormField>

      </ColumnLayout>
      <br />
      <S3ResourceSelectorContainer />
      <br />
      {/* <form> */}
      <Form
        actions={
          <SpaceBetween direction="horizontal" size="xs">
            <Button variant="normal" disabled={syncState}
            onClick={event => {
               startSyncKBDataSource(selectedKBID, selectedKBDatasourceID)
            }}>{syncText}</Button>
            <Button variant="primary" disabled={submitState}
            onClick={
              (event) => {
                uploadForm(event);
                console.log("distributionPanelData", distributionPanelData)
              }
            }>{submitText}</Button>
          </SpaceBetween>
        }
      >
        <FormField
          label="Upload docuemnt to knowledge"
          description="Upload document to above selected S3 destination."
        >
          <FileUpload
            multiple={true}
            showFileSize={true}
            showFileLastModified={true}
            accept="application/pdf, text/html, text/plain, text/csv, text/markdown, application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document, "
            value={distributionPanelData.functions}
            tokenLimit={3}
            onChange={({ detail: { value } }) => onFileUploadChange('functions', value)}

            // onChange={(event) => {console.log("event: ", event)}}
            // errorText={getErrorText('2 files have errors')}
            // fileErrors={functionFileErrors}
            constraintText="The following file type are supported : .doc / .docx / .pdf / .xls / .xlsx / .html / .txt / .md"
            i18nStrings={{
              uploadButtonText: multiple => (multiple ? 'Choose files' : 'Choose file'),
              dropzoneText: multiple => (multiple ? 'Drop files to upload' : 'Drop file to upload'),
              removeFileAriaLabel: fileIndex => `Remove file ${fileIndex + 1}`,
              limitShowFewer: 'Show fewer files',
              limitShowMore: 'Show more files',
              errorIconAriaLabel: 'Error',
            }}
          />
        </FormField>

      </Form>
      {/* </form> */}
    </Container>
  )
}
class App extends Component {
  content() {
    return (
      <ContentLayout header={<Header variant="h1">Manage Knowledge Base</Header>}>
        <ParentComponent />
      </ContentLayout>
    );
  }

  render() {
    return (
      <CustomAppLayout
        contentType="form"
        content={this.content()}
        navigationOpen={true}
        navigation={<Navigation activeHref="#/distributions" />}

      />
    );
  }
}

createRoot(document.getElementById('app')).render(<App />);
