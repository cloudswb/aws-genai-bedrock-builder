// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import React, { createRef, useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Button,
  Container,
  ContentLayout,
  SpaceBetween,
  Textarea,
  ColumnLayout,
  Box,
  Link,
  FormField,
  Select,
  ExpandableSection,
  Header,
  Tabs
} from '@cloudscape-design/components';
import {
  PageHeader,
  getSignedPostHeader,
  GetUserName
} from '../details/common-components.jsx';
import {
  CustomAppLayout,
  Navigation,
} from '../commons/common-components';
import ToolsContent from '../details/tools-content.jsx';
import '../../styles/base.scss';
import { config } from '../../../config';
import Markdown from '../commons/markdown.tsx';
const getStream = require('get-stream');
const translateOption = { llm: 'anthropic.claude-v2', promptTemplate: 1 }
const { v4: uuidv4 } = require('uuid');

// const [selectedValue, setSelectedValue] = useState('');
function FeaturesSpotlightFooter() {
  return (
    <Box textAlign="center">
      <Link href="#" variant="primary">
        View all posts
      </Link>
    </Box>
  );
}

let sessionId = "NONE"

const ParentComponent = () => {

  const [submitText, setSubmitText] = useState('Submit');
  const [submitState, setSubmitState] = useState(true);

  const [kbItems, setkbItems] = useState([]);
  const [conversionItems, setConversionItems] = useState([]);
  const [ask, setAsk] = useState(null);


  // const [searchMessage, setSearchMessage] = useState('');
  const handleAddConversionItem = (props) => {
    
    if(selectedKBValue == undefined || selectedKBValue == '')
    {
      alert('Please select a knowledge base item first.')
      return;
    }

    if(ask == "" || ask == null)
    {
      alert('Please input a question to search from knowledge base.')

      return;
    }

    console.log(selectedKBValue);
    console.log(ask);
    searchKB();
  };

  const [selectedKBValue, setSelectedKBValue] = useState('');
  const [selectedKBID, setSelectedKBID] = useState('');

  const updateSubmitState = () => {
    if(ask != undefined && ask != '' && selectedKBID != undefined && selectedKBID != ''){
      setSubmitState(false)
    }
    else{
      setSubmitState(true)
    }
  }

  async function searchKB() {
    const method = 'POST';
    const host = config.LambdaKBInvoke_URL;
    const region = config.REGION;
    const base = config.Lambda_URL_BASE;

    setSubmitText('Searching')
    setSubmitState(true);
    
    const userName = GetUserName();
    // const request_parameters = `{"prompt": "${ask.replace(/\n/g, "<br>")}", "knowledgeBaseId": "${selectedKBID}", "username": "${userName}"}`;
    const request_parameters = JSON.stringify({
      "prompt": ask,
      "knowledgeBaseId": selectedKBID,
      "username": userName,
      "sessionId": sessionId
    });

    let headers = {}
    if(config.AUTH.toLowerCase() == 'iam'){
      headers = await getSignedPostHeader(host, region, request_parameters);
    }
    else{
      headers = { 'auth': "cognito" }
    }

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
        // streamedData = '';
        console.log(response);
        console.log(response.body);

        const reader = response.body.getReader();
        // Read data from the stream
        const readData = () => {
          return reader.read().then(({ done, value }) => {
            if (done) {
              console.log('streamedData:', streamedData);
              translateOption.translated = streamedData;
              console.log("Stream complete");
              // Update state with the response data
              let streamedDataObject = JSON.parse(streamedData);

              sessionId=streamedDataObject.body.sessionId

              console.log("sessionId resukt:", sessionId)

              const tabs = []
              streamedDataObject.body.citations.map((citation, index)=> {
                citation.retrievedReferences.map((item, index2) => {
                  const pathComponents = item.location.s3Location.uri.split('/');
                  tabs.push({
                    label: `${pathComponents[pathComponents.length - 1]}-${index}-${index2}`,
                    id: `${item.location.s3Location.uri}-${index}-${index2}`,
                    content: <Box><div><Header variant="h4">File Path: </Header> {item.location.s3Location.uri}</div> <div> <Header variant="h4">Reference Content: </Header> {item.content.text}</div> </Box>
                  });
                })
              })

              setConversionItems([{
                user: "Question",
                ask: ask,
                llm: selectedKBValue,
                answer: streamedDataObject.body.output.text,
                tabs: tabs
              }, ...conversionItems]);
              setAsk('');
              updateSubmitState()
              setSubmitText('Submit')
            } else {
              streamedData = streamedData + `${new TextDecoder()
                .decode(value)
                .replace(/\n/g, "<br>")}`;

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
        setSubmitText('Submit')
        updateSubmitState()
      });

  }


  useEffect(() => {
    listKB();
  }, []);
  
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
    setSubmitText('Loading')
    updateSubmitState()

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
              // console.log("Stream complete");

              const streamedDataObj = JSON.parse(streamedData);
              console.log('streamedData body:', streamedDataObj.body);
              const data = streamedDataObj.body

              setkbItems(data); 
              console.log("knowledgeBaseId", data[0].knowledgeBaseId);
              setSelectedKBValue(data[0].name);
              setSelectedKBID(data[0].knowledgeBaseId);
              
              // setkbItems([{knowledgeBaseId: "AFGP3CY9RC", name: "genai-build-knowledge-base-1", value: "ACTIVE", updatedAt: "2023-12-01T16:15:36.148Z"}, ...kbItems]);

              const newKBItems = []
              data.map((item) => {
                console.log(item.knowledgeBaseId);
                console.log({knowledgeBaseId: item.knowledgeBaseId, value: item.name, status: item.status, updatedAt: item.updatedAt});
                newKBItems.push({knowledgeBaseId: item.knowledgeBaseId, value: item.name, status: item.status, updatedAt: item.updatedAt})
                
              });

              setkbItems(newKBItems);
              // setkbItems([...kbItems, {knowledgeBaseId: item.knowledgeBaseId, value: item.name, status: item.status, updatedAt: item.updatedAt}]);
              
              console.log("kbItems:", kbItems)
              setSubmitText('Search')
              updateSubmitState()

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
        setSubmitText('Search')
        updateSubmitState()
      });
  };


  return (
    <ContentLayout>
      <SpaceBetween size="l">

        <Container>
          <ColumnLayout columns={4} rows={2} variant="text-grid" >

            {/* <div>
              <FormField label="Prompt Template" direction="vertical">
                <Select
                  autoFocus={true}
                  expandToViewport={true}
                  ariaLabel="Select Language"
                  options={prompts}
                  onChange={event => {
                    // alert(event.detail.selectedOption.prompt);
                    setSelectedPromptValue(event.detail.selectedOption.value);
                  }}
                  selectedOption={prompts.find(option => option.value == selectedPromptValue)}
                />
              </FormField>
            </div> */}
            <div>
              <FormField label="Knowledge base" direction="direction">
                <Select
                  autoFocus={true}
                  expandToViewport={true}
                  ariaLabel="Select LLM Model"
                  options={kbItems}
                  onChange={event => {
                    // alert(event.detail.selectedOption.name);
                    console.log(event.detail.selectedOption.value);
                    console.log(event.detail.selectedOption.knowledgeBaseId);
                    setSelectedKBValue(event.detail.selectedOption.value);
                    setSelectedKBID(event.detail.selectedOption.knowledgeBaseId);
                  }}
                  selectedOption={kbItems.find(option => option.value == selectedKBValue)}
                />
              </FormField>
            </div>

          </ColumnLayout>
          <ColumnLayout>

            <Textarea
              placeholder="Message LLM"
              rows={2}
              value={ask}
              onChange={({ detail }) => {
                setAsk(detail.value);
                setSubmitState(detail.value.trim() == '' ? true : false);
              }
              }
            />

            <form onSubmit={event => event.preventDefault()}>
              <SpaceBetween direction="horizontal" size="xs">
                <Button variant="link" onClick={() => { 
                  setAsk('') 
                  updateSubmitState()
                  
                  }}>Clean</Button>
                <Button variant="primary" onClick={() => handleAddConversionItem()} disabled={submitState}>{submitText}</Button>
              </SpaceBetween>
            </form>
          </ColumnLayout>


          {/* <Message /> */}
        </Container>

        {conversionItems.map((item, index) => (
          <Container key={index}>
            <Header variant="h2">{item.user}</Header>
            <Box variant="p">{item.ask}</Box>
            <Header variant="h2">{item.llm}</Header>
            <div>
              <Markdown>{item.answer}</Markdown>
            </div>
            <ExpandableSection headerText="References" variant="footer">
              <SpaceBetween size="l">
                <Tabs tabs={item.tabs} ariaLabel="Resource details" />
              </SpaceBetween>
            </ExpandableSection>
          </Container>
        ))}

        <FeaturesSpotlightFooter />
      </SpaceBetween>
    </ContentLayout>
  )


};

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = { toolsIndex: 0, toolsOpen: false };
    this.appLayout = createRef();
  }

  render() {
    return (
      <CustomAppLayout
        ref={this.appLayout}
        content={
          <ContentLayout header={
            <PageHeader
              buttons={[]}
              header={"Knowledge Base"}
            />
          }>
            <ParentComponent />
          </ContentLayout>
        }
        // breadcrumbs={<Breadcrumbs />}
        navigation={<Navigation activeHref="#/distributions" />}
        tools={ToolsContent[this.state.toolsIndex]}
        toolsOpen={this.state.toolsOpen}
        onToolsChange={({ detail }) => this.setState({ toolsOpen: detail.open })}
      />
    );
  }
}

createRoot(document.getElementById('app')).render(<App />);
