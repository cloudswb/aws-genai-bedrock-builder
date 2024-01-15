// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import React, { createRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import axios from "axios"

import {
  Button,
  Container,
  ContentLayout,
  SpaceBetween,
  Form,
  Textarea,
  ColumnLayout,
  FormField,
  Select,
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

const prompts = [
  { value: 'You are a translator', label: '翻译' },
  // { value: 'You are a writer, skilled at writing novels.', label: '小说翻译' },
]
const languages = [
  { value: 'English', label: 'English' },
  { value: 'Chinese', label: '中文' },
];
const llm_modes = [
  { value: 'anthropic.claude-v2', label: 'Claude2' },
  // { value: 'ai21.j2-mid-v1', label: 'Jurassic-2 Mid' },
  // { value: 'ai21.j2-ultra-v1', label: 'Jurassic-2 Ultra' },
  // { value: 'meta.llama2-13b-chat-v1', label: 'Llama 2 Chat 13B' },
  // { value: 'amazon.titan-text-lite-v1', label: 'Titan Text G1 - Lite' },
];

const translateOption = { target: languages[0].value, prompt: prompts[0].value, llm: llm_modes[0].value, ask: '', translated: '' }
const extractText = (body) => {
  const startTag = '<result>';
  const endTag = '</result>';
  const startTagLength = startTag.length
  const endTagLength = endTag.length

  return body.substring(startTagLength + 1, body.length - endTagLength).trim();
}


const Content = props => {
  const [sourceContent, setSourceContent] = useState(null);
  const [translatedContent, setTranslatedContent] = useState(null);

  const [promptOption, setPromptOption] = useState(prompts[0].value);
  const [LLMOption, setLLMOption] = useState(llm_modes[0].value);
  const [targetLanguageOption, setTargetLanguageOption] = useState(languages[0].value);

  const [submitText, setSubmitText] = useState('Translate');
  const [submitState, setSubmitState] = useState(false)

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        console.log('Text successfully copied to clipboard');
      })
      .catch((err) => {
        console.error('Unable to copy text to clipboard', err);
      });
  };

  
  async function send() {
    

    setSubmitText('Translating')
    setSubmitState(true)
    
    const method = 'POST';
    const host = config.LambdaModelInvoke_URL;
    const region = config.REGION;
    const base = config.Lambda_URL_BASE;
    const userName = GetUserName();

    const request_parameters = JSON.stringify({
      "prompt": `Human: <tobetranslate>${translateOption.ask}</tobetranslate>, ${translateOption.prompt}, you need translate the content inside <tobetranslate> tag in to ${translateOption.target} and only output translated result in to <result> tag. Assistant:`,
      "username": userName,
      "modelId": LLMOption
    });


    let headers = {}
    if (config.AUTH.toLowerCase() == 'iam') {
      headers = await getSignedPostHeader(host, region, request_parameters);
    }
    else {
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
        streamedData = '';
        console.log(response);
        console.log(response.body);
        const reader = response.body.getReader();

        // Read data from the stream
        const readData = () => {
          return reader.read().then(({ done, value }) => {
            // console.log("value:", value)
            if (done) {
              console.log('streamedData:', streamedData);
              translateOption.translated = streamedData;
              setSubmitText('Translate')
              setSubmitState(false)
              console.log("Stream complete");
            } else {
              streamedData = streamedData + `${new TextDecoder()
                .decode(value)
                .replace(/\n/g, "<br>")}`;


              // console.log(streamedData);
              setTranslatedContent(streamedData)
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
        setSubmitText('Translate')
        setSubmitState(false)
      });
  }


  function formatResultContent(inputString) {
    if (inputString == null || inputString == "") {
      return ""
    }

    // Extract content inside <result> tag
    const matchResult = inputString.match(/<result>([\s\S]*?)<\/result>/);

    if (matchResult && matchResult[1]) {
      // Replace <br> with \n
      const formattedContent = matchResult[1].replace(/<br>/g, '\n');
      return formattedContent;
    } else {
      console.log('No match found for <result> tag in the input string.');
      return null; // or handle this case as needed
    }
  }



  return (
    <div>
      <Container>
        <ColumnLayout columns={4} variant="text-grid">

          <div>
            <FormField label="Target Language">
              <Select
                autoFocus={true}
                expandToViewport={true}
                ariaLabel="Target Language"
                options={languages}
                onChange={event => {
                  setTargetLanguageOption(event.detail.selectedOption.value);
                  translateOption.target = event.detail.selectedOption.value;
                }}
                selectedOption={languages.find(option => option.value == targetLanguageOption)}
              />
            </FormField>
          </div>
          <div>
            <FormField label="Prompt Template" direction="vertical">
              <Select
                autoFocus={true}
                expandToViewport={true}
                ariaLabel="Select Language"
                options={prompts}
                onChange={event => {
                  setPromptOption(event.detail.selectedOption.value);
                  translateOption.prompt = event.detail.selectedOption.value;
                }}
                selectedOption={prompts.find(option => option.value == promptOption)}
              />
            </FormField>
          </div>
          <div>
            <FormField label="LLM Model" direction="direction">
              <Select
                autoFocus={true}
                expandToViewport={true}
                ariaLabel="Select Language"
                options={llm_modes}
                onChange={event => {
                  setLLMOption(event.detail.selectedOption.value);
                }}
                selectedOption={llm_modes.find(option => option.value == LLMOption)}
              />
            </FormField>
          </div>
          <div>
            <Form
              actions={
                <SpaceBetween direction="horizontal" size="xs">
                  <Button variant="primary" onClick={send} disabled={submitState}>{submitText}</Button>
                  <Button variant="link" onClick={() => {
                    setSourceContent('');
                    setSubmitState(true);
                  }}>Clean</Button>
                  {/* <Button variant="normal"
                    onClick={(event) => {
                      copyToClipboard(translateOption.translated)
                    }} >Copy</Button> */}

                </SpaceBetween>
              }
            >
            </Form>
          </div>
        </ColumnLayout>
      </Container>

      <Container>
        <ColumnLayout columns={1} rows={2} variant="text-grid">
          <div>
            <Textarea
              placeholder="Input the source content to be tranlated"
              value={sourceContent}
              onChange={({ detail }) => {
                translateOption.ask = detail.value;
                setSourceContent(detail.value);
                setSubmitState(detail.value.trim() == '' ? true : false);
              }}
              rows={12}
            />
          </div>
          <div dangerouslySetInnerHTML={{ __html: translatedContent }} />
          {/* <div dangerouslySetInnerHTML={{ __html: translatedContent }} /> */}
          {/* <Textarea
              placeholder="Translated result will be here, you can edit."
              value={translatedContent}
              onChange={({ detail }) => {
                setTranslatedContent(detail.value)
              }
              }
              rows={25}
            /> */}
        </ColumnLayout>
      </Container>
    </div>
  );
};



class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = { toolsIndex: 0, toolsOpen: false, translateContent: '', sourceContent: '' };
    this.appLayout = createRef();
  }

  loadHelpPanelContent(index) {
    this.setState({ toolsIndex: index, toolsOpen: true });
    this.appLayout.current?.focusToolsClose();
  }

  // Callback function to update the state in Translated
  updateTranslatedContent = (content) => {
    this.setState({ translateContent: content });
  };

  updateSourceContent = (content) => {
    this.setState({ sourceContent: content });
  };

  render() {
    return (
      <CustomAppLayout
        ref={this.appLayout}
        content={
          <ContentLayout
            header={
              <PageHeader
                buttons={[]}
                header={"Translate"}
              />
            }
          >
            <SpaceBetween size="l">
              <Content />
            </SpaceBetween>

          </ContentLayout>
        }
        // breadcrumbs={<Breadcrumbs />}
        navigation={<Navigation activeHref="#/distributions" />}
        tools={ToolsContent[this.state.toolsIndex]}
        toolsOpen={this.state.toolsOpen}
        onToolsChange={({ detail }) => this.setState({ toolsOpen: detail.open })}
      // notifications={<Notifications />}
      />
    );
  }
}

createRoot(document.getElementById('app')).render(<App />);
