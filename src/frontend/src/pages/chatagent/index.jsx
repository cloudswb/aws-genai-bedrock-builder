// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import React, { createRef, useState } from 'react'
// import ReactHtmlParser from 'react-html-parser';
// import SyntaxHighlighter from 'react-syntax-highlighter';
// import { docco } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import {
  Box,
  Button,
  Container,
  ContentLayout,
  Grid,
  Icon,
  Input,
  Link,
  SpaceBetween,
  Spinner,
} from '@cloudscape-design/components'
import { createRoot } from 'react-dom/client'
import '../../styles/base.scss'
import { CustomAppLayout, Navigation } from '../commons/common-components'
import Markdown from '../commons/markdown.tsx'
import {
  GetUserName,
  PageHeader,
  getSignedPostHeader,
} from '../details/common-components.jsx'
import ToolsContent from '../details/tools-content.jsx'
// import { config } from 'process';
import { config } from '../../../config'

const { v4: uuidv4 } = require('uuid')

// const [selectedValue, setSelectedValue] = useState('');
function FeaturesSpotlightFooter() {
  return (
    <Box textAlign='center'>
      <Link href='#' variant='primary'>
        View all posts
      </Link>
    </Box>
  )
}

const sessionId = uuidv4()
const ParentComponent = () => {
  const [submitText, setSubmitText] = useState('Send')
  const [submitState, setSubmitState] = useState(true)

  const [conversionItems, setConversionItems] = useState([])
  const [ask, setAsk] = useState(null)

  // const llm_modes = [
  //   { value: 'anthropic.claude-v2', label: 'Claude2' },
  // ];

  const prompts = [
    {
      value:
        'Human: you are a power and honest assistant, you need answer questions in <QUESTION> tag and output the purely answer directly ${ask}.\n Assistant:',
      label: 'Default',
    },
  ]

  const [selectedPromptValue, setSelectedPromptValue] = useState(
    prompts[0].value,
  )
  // const [selectedLLMValue, setSelectedLLMValue] = useState('anthropic.claude-v2');

  const agentId = config.BEDROCK_AGENT_ID
  const agentAliasId = config.BEDROCK_AGENT_ALIAS_ID

  const endSession = false

  // https://2uzuvw7m5ogfo3zobmn44oc4km0kahwd.lambda-url.us-east-1.on.aws/
  async function send() {
    const method = 'POST'

    setSubmitText('Loading')
    setSubmitState(true)

    const host = config.LambdaAgentInvoke_URL
    const region = config.REGION
    const base = config.Lambda_URL_BASE

    const userName = GetUserName()

    // const request_parameters = `{"prompt": "${ask.replace(/\n/g, "<br>")}", "agentId": "${agentId}", "agentAliasId": "${agentAliasId}", "sessionId": "${sessionId}", "endSession": "${endSession}", "username": "${userName}"}`;
    const request_parameters = JSON.stringify({
      prompt: ask,
      agentId: agentId,
      agentAliasId: agentAliasId,
      sessionId: sessionId,
      endSession: endSession,
      username: userName,
    })
    let headers = {}
    if (config.AUTH.toLowerCase() == 'iam') {
      headers = await getSignedPostHeader(host, region, request_parameters)
    } else {
      headers = { auth: 'cognito' }
    }

    console.log('headers:', headers)

    let streamedData = 'Thinking...'

    setConversionItems([
      {
        user: 'Question',
        ask: ask,
        llm: 'Claude2',
        answer: streamedData,
      },
      ...conversionItems,
    ])

    const handleAnswerChange = (index, newAnswer) => {
      console.log('newAnswer:', newAnswer)
      // Create a new array with the updated answer value
      const updatedItems = [...conversionItems]
      updatedItems[index] = {
        user: 'Question',
        ask: ask,
        llm: 'Claude2',
        answer: newAnswer,
      }

      // Update the state to trigger a re-render
      setConversionItems([updatedItems[index], ...conversionItems])
    }

    // ************* SEND THE REQUEST *************
    fetch(base + host, {
      method: method,
      headers: headers,
      body: request_parameters, // JSON.stringify({ prompt: 'what is ec2?' }),
    })
      .then((response) => {
        streamedData = ''
        console.log(response)
        console.log(response.body)

        const reader = response.body.getReader()
        // Read data from the stream
        const readData = () => {
          return reader.read().then(({ done, value }) => {
            // console.log("value:", value)
            // console.log("done:", done)
            if (done) {
              console.log('streamedData:', streamedData)
              // translateOption.translated = streamedData;
              console.log('Stream complete')
              // Update state with the response data

              setAsk('')
              setSubmitState(false)
              setSubmitText('Send')
            } else {
              streamedData = streamedData + `${new TextDecoder().decode(value)}`

              console.log('streamedData:', streamedData)
              handleAnswerChange(0, streamedData)
              // Continue reading data
              return readData()
            }
          })
        }

        // Start reading data from the stream
        return readData()
      })
      .catch((error) => {
        console.error('Error:', error)
        setSubmitText('Send')
        setSubmitState(false)
      })
  }

  const loading = submitText === 'Loading'

  return (
    <ContentLayout>
      <SpaceBetween size='l'>
        <Container>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Icon name='user-profile' />
            <div style={{ flex: 1 }}>
              <Input
                placeholder='Please ask your question here'
                value={ask}
                disabled={loading}
                onChange={({ detail }) => {
                  // setAsk(detail.value.replace(/\n/g, "<br>"))
                  setAsk(detail.value)
                  setSubmitState(detail.value.trim() == '' ? true : false)
                }}
              />
            </div>
            <Button
              variant='primary'
              onClick={send}
              disabled={submitState}
              loading={loading}
            >
              {submitText}
            </Button>
          </div>
          <div
            style={{
              marginTop: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
            }}
          >
            {conversionItems.length === 0 ? (
              <div>Conversations will be displayed here.</div>
            ) : (
              conversionItems.map((item, index) => (
                <div key={index}>
                  {index !== 0 ? (
                    <div
                      style={{
                        borderTop: '0.5px solid silver',
                        marginBottom: '24px',
                      }}
                    />
                  ) : null}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                    }}
                  >
                    <Icon name='user-profile' />
                    <div>{item.ask}</div>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                    }}
                  >
                    <div style={{ alignSelf: 'start', margin: '14px 0' }}>
                      <Icon name='video-on' />
                    </div>
                    {/* <div dangerouslySetInnerHTML={{ __html: item.answer }} /> */}
                    <Markdown>{item.answer}</Markdown>
                  </div>
                </div>
              ))
            )}
          </div>
        </Container>

        {/* <FeaturesSpotlightFooter /> */}
      </SpaceBetween>
    </ContentLayout>
  )
}

class App extends React.Component {
  constructor(props) {
    super(props)
    this.state = { toolsIndex: 0, toolsOpen: false }
    this.appLayout = createRef()
  }

  render() {
    return (
      <CustomAppLayout
        ref={this.appLayout}
        content={
          <ContentLayout
            header={<PageHeader buttons={[]} header={'Agent Chat'} />}
          >
            <ParentComponent />
          </ContentLayout>
        }
        // breadcrumbs={<Breadcrumbs />}
        navigation={<Navigation activeHref='#/distributions' />}
        tools={ToolsContent[this.state.toolsIndex]}
        toolsOpen={this.state.toolsOpen}
        onToolsChange={({ detail }) =>
          this.setState({ toolsOpen: detail.open })
        }
      />
    )
  }
}

createRoot(document.getElementById('app')).render(<App />)
