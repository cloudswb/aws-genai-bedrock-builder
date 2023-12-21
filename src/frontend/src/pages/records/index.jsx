// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import React, { createRef, useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Container,
  ContentLayout,
  SpaceBetween,
  ColumnLayout,
  Box,
  Link,
  FormField,
  Select,
  Header,
  ExpandableSection
} from '@cloudscape-design/components';
import {
  GetUserName,
  PageHeader,
  getSignedPostHeader,
} from '../details/common-components.jsx';
import {
  CustomAppLayout,
  Navigation
} from '../commons/common-components';
import ToolsContent from '../details/tools-content.jsx';
import '../../styles/base.scss';
import { config } from '../../../config';
import Pagination from "@cloudscape-design/components/pagination";


const ParentComponent = () => {

  const [logItems, setLogItems] = useState([]);

  const pageTypes = [
    { value: 'all', label: 'All' },
    { value: 'chatmodel', label: 'Chat with LLM' },
    { value: 'chatmodel', label: 'Chat with Agent' },
    { value: 'kbsearch', label: 'Kowledge Search' },
  ]

  const [selectedPageTypeValue, setSelectedPageTypeValue] = useState(pageTypes[0].value);

  async function listLogs() {
    const method = 'POST';

    const host = config.LambdaRecordsList_URL;
    const region = config.REGION;
    const base = config.Lambda_URL_BASE;
    const userName = GetUserName();
    console.log("user name:", userName);

    const request_parameters = `{
      "tableName": "${config.LOG_TABLE_NAME}",
      "actionType": "list",
      "userName": "${userName}",
      "startKey": ""
    }`
    console.log("request_parameters:", request_parameters)

    let headers = {}
    if (config.AUTH.toLowerCase() == 'iam') {
      headers = await getSignedPostHeader(host, region, request_parameters);
    }
    else {
      headers = { 'auth': "cognito" }
    }

    console.log("headers:", headers)

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
        let streamedData = '';
        console.log(response);
        console.log(response.body);

        const reader = response.body.getReader();
        // Read data from the stream
        const readData = () => {
          return reader.read().then(({ done, value }) => {
            // console.log("value:", value)
            // console.log("done:", done)
            if (done) {
              // console.log("logRecordsInPage:", streamedData)
              let streamedDataObj = JSON.parse(streamedData);
              // console.log("logRecordsInPage items:", streamedDataObj.body.items)
              // Update the state to trigger a re-render
              setLogItems(streamedDataObj.body.items);
            } else {
              streamedData = streamedData + `${new TextDecoder().decode(value)}`;
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
      });

  }

  const [currentPageIndex, setCurrentPageIndex] = React.useState(1);

  useEffect(() => {
    listLogs();
  }, []);

  return (
    <ContentLayout>
      <SpaceBetween size="l">

        <Container>
          {/* <ColumnLayout columns={4} rows={2} variant="text-grid" >

            <div>
              <FormField label="Requestion Type" direction="vertical">
                <Select
                  autoFocus={true}
                  expandToViewport={true}
                  ariaLabel="Select Language"
                  options={pageTypes}
                  onChange={event => {
                    setSelectedPageTypeValue(event.detail.selectedOption.value);
                  }}
                  selectedOption={pageTypes.find(option => option.value == selectedPageTypeValue)}
                />
              </FormField>
            </div>

          </ColumnLayout> */}
        

        {/* <Pagination
          currentPageIndex={currentPageIndex}
          onChange={({ detail }) => {
            setCurrentPageIndex(detail.currentPageIndex)}
          } pagesCount={5} /> */}
        <Header variant="h3">We only show the recent 35 records currently</Header>

        {logItems.map((item, index) => (
          <ExpandableSection headerText={item.header} variant="footer">
            <SpaceBetween size="l">
              <div><Header variant="h4">Context: </Header> {item.createtime} - {item.logid} - {item.conversationid} -  {item.username} </div>
              <div><Header variant="h4">Attributes: </Header> {item.attribute}</div>
              <div><Header variant="h4">Question: </Header> {item.question}</div>
              <div><Header variant="h4">Answer: </Header> {item.answer}</div>
            </SpaceBetween>
          </ExpandableSection>

        ))}
</Container>
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
              header={"Requestion Records"}
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
