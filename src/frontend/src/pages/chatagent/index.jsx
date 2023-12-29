// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import React, { createRef, useState } from 'react';
// import ReactHtmlParser from 'react-html-parser';
// import SyntaxHighlighter from 'react-syntax-highlighter';
// import { docco } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { createRoot } from 'react-dom/client';
import crypto from 'crypto-js'
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
  Header
} from '@cloudscape-design/components';
import {
  PageHeader,
  getSignedPostHeader,
  GetUserName
} from '../details/common-components.jsx';
import {
  CustomAppLayout,
  Navigation
} from '../commons/common-components';
import Markdown from '../commons/markdown.tsx';
import ToolsContent from '../details/tools-content.jsx';
import '../../styles/base.scss';
// import { config } from 'process';
import { config } from '../../../config';

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

const sessionId = uuidv4();
const ParentComponent = () => {

  const [submitText, setSubmitText] = useState('Submit');
  const [submitState, setSubmitState] = useState(true);

  const [conversionItems, setConversionItems] = useState([]);
  const [ask, setAsk] = useState(null);

  // const [searchMessage, setSearchMessage] = useState('');
  const handleAddConversionItem = (props) => {


    // postData();
    send();
  };

  // const llm_modes = [
  //   { value: 'anthropic.claude-v2', label: 'Claude2' },
  // ];

  const prompts = [
    { value: 'Human: you are a power and honest assistant, you need answer questions in <QUESTION> tag and output the purely answer directly ${ask}.\n Assistant:', label: 'Default' },
  ]

  const [selectedPromptValue, setSelectedPromptValue] = useState(prompts[0].value);
  // const [selectedLLMValue, setSelectedLLMValue] = useState('anthropic.claude-v2');

  const agentId = config.BEDROCK_AGENT_ID;
  const agentAliasId = config.BEDROCK_AGENT_ALIAS_ID;

  const endSession = false;

  // https://2uzuvw7m5ogfo3zobmn44oc4km0kahwd.lambda-url.us-east-1.on.aws/
  async function send() {
    const method = 'POST';

    setSubmitText('Waitting')
    setSubmitState(true)
    
    const host = config.LambdaAgentInvoke_URL;
    const region = config.REGION;
    const base = config.Lambda_URL_BASE;


    const userName = GetUserName();

    // const request_parameters = `{"prompt": "${ask.replace(/\n/g, "<br>")}", "agentId": "${agentId}", "agentAliasId": "${agentAliasId}", "sessionId": "${sessionId}", "endSession": "${endSession}", "username": "${userName}"}`;
    const request_parameters = JSON.stringify({
      "prompt": ask, 
      "agentId": agentId, 
      "agentAliasId": agentAliasId, 
      "sessionId": sessionId, 
      "endSession": endSession, 
      "username": userName
    });
    let headers = {}
    if(config.AUTH.toLowerCase() == 'iam'){
      headers = await getSignedPostHeader(host, region, request_parameters);
    }
    else{
      headers = { 'auth': "cognito" }
    }

    console.log("headers:", headers)
    
    let streamedData = 'Loading'


    setConversionItems([{
      user: "Question",
      ask: ask,
      llm: "Claude2",
      answer: streamedData
    }, ...conversionItems]);

    const handleAnswerChange = (index, newAnswer) => {
      console.log("newAnswer:", newAnswer)
      // Create a new array with the updated answer value
      const updatedItems = [...conversionItems];
      updatedItems[index] = {
        user: "Question",
        ask: ask,
        llm: "Claude2",
        answer: newAnswer
      };
  
      // Update the state to trigger a re-render
      setConversionItems([updatedItems[index], ...conversionItems]);
    };

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
        console.log(response);
        console.log(response.body);

        const reader = response.body.getReader();
        // Read data from the stream
        const readData = () => {
          return reader.read().then(({ done, value }) => {
            // console.log("value:", value)
            // console.log("done:", done)
            if (done) {
              console.log('streamedData:', streamedData);
              // translateOption.translated = streamedData;
              console.log("Stream complete");
              // Update state with the response data
              
              setAsk('');
              setSubmitState(false)
              setSubmitText('Submit')
            } else {
              streamedData = streamedData + `${new TextDecoder().decode(value)}`;
              
              console.log("streamedData:", streamedData);
              handleAnswerChange(0, streamedData)
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
        setSubmitState(false)
      });

  }


  return (
    <ContentLayout>
      <SpaceBetween size="l">

        <Container>
          <ColumnLayout columns={4} rows={2} variant="text-grid" >

            <div>
              <FormField label="Prompt Template" direction="vertical">
                <Select
                  autoFocus={true}
                  expandToViewport={true}
                  ariaLabel="Select Language"
                  options={prompts}
                  onChange={event => {
                    setSelectedPromptValue(event.detail.selectedOption.value);
                  }}
                  selectedOption={prompts.find(option => option.value == selectedPromptValue)}
                />
              </FormField>
            </div>
            {/* <div>
              <FormField label="LLM Model" direction="direction">
                <Select
                  autoFocus={true}
                  expandToViewport={true}
                  ariaLabel="Select LLM Model"
                  options={llm_modes}
                  onChange={event => {
                    setSelectedLLMValue(event.detail.selectedOption.value);
                  }}
                  selectedOption={llm_modes.find(option => option.value == selectedLLMValue)}
                />
              </FormField>
            </div> */}

          </ColumnLayout>
          <ColumnLayout>

            <Textarea
              placeholder="Message LLM"
              rows={2}
              value={ask}
              onChange={({ detail }) => {
                // setAsk(detail.value.replace(/\n/g, "<br>"))
                setAsk(detail.value)
                setSubmitState(detail.value.trim() == '' ? true : false);
              }
              }
            />

            <form onSubmit={event => event.preventDefault()}>
              <SpaceBetween direction="horizontal" size="xs">
                <Button variant="link" onClick={()=> {
                  setAsk('');
                  setSubmitState(true);
                   }}>Clean</Button>
                <Button variant="primary" onClick={() => handleAddConversionItem()} disabled={submitState}>{submitText}</Button>
              </SpaceBetween>
            </form>
          </ColumnLayout>


          {/* <Message /> */}
        </Container>

        {conversionItems.map((item, index) => (
          <Container key={index}>
            <Header variant="h4">{item.user}</Header>
            <Box variant="p">{item.ask}</Box>
            <Header variant="h4">{item.llm}</Header>
            <Box variant="p">
            <div>
              {/* <div dangerouslySetInnerHTML={{ __html: item.answer }} /> */}
              <Markdown>{item.answer}</Markdown>
            </div>
            </Box>
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
              header={"Agent Chat"}
            />
          }>
            <ParentComponent/>
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
