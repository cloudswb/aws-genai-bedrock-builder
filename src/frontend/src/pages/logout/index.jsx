// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import React, { createRef, useState, useCallback } from 'react';
// import ReactHtmlParser from 'react-html-parser';
// import SyntaxHighlighter from 'react-syntax-highlighter';
// import { docco } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { createRoot } from 'react-dom/client';
import {
  Button,
  Container,
  ContentLayout,
  Header,
  SpaceBetween,
  ColumnLayout,
  FormField,
  Input,
  Hotspot,
} from '@cloudscape-design/components';
import {
  EmptyAppLayout,
} from '../commons/common-components.js';
import '../../styles/base.scss';
// import { config } from 'process';


const ParentComponent = () => {

  const [username, setUserName] = useState('')
  const [userPassword, setUserPassword] = useState('')

  const onUserNameChange = useCallback(event => setUserName(event.detail.value), []);
  const onUserPasswordChange = useCallback(event => setUserPassword(event.detail.value), []);

  const handleAddConversionItem = (event)={}

  return (
      <SpaceBetween>
      <ColumnLayout columns={3}>
        
        <div></div>
        <Container header={<Header>Sign In</Header>}>
          <FormField
            label="User Name"
            constraintText="The name can be a username or email"
          >
            <Hotspot hotspotId="transcription-job-name">
              <Input value={username} placeholder="Input the User name" onChange={onUserNameChange} />
            </Hotspot>
          </FormField>
            <br/>
          <FormField
            label="User Password"
            constraintText="The password can be up to 20 characters long. Valid characters are a-z, A-Z, 0-9, . (period), _ (underscore) and - (hyphen)."
          >
            <Hotspot hotspotId="transcription-job-name">
              <Input value={userPassword} placeholder="Input the Password name" onChange={onUserPasswordChange} type='password' />
            </Hotspot>
          </FormField>
          <br/>
          <form onSubmit={event => event.preventDefault()}>
              <SpaceBetween direction="horizontal" size="xs">
                <Button variant="link" onClick={() => { setAsk('') }}>Clean</Button>
                <Button variant="primary" onClick={() => handleAddConversionItem()} >Sign In</Button>
              </SpaceBetween>
            </form>

          {/* <Message /> */}
        </Container>

        <div></div>
        {/* <FeaturesSpotlightFooter /> */}
      </ColumnLayout>
      </SpaceBetween>
  )


};

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = { toolsIndex: 0, toolsOpen: true };
    this.appLayout = createRef();
  }

  render() {
    return (
      <EmptyAppLayout
        content={
          <ContentLayout>
            <ParentComponent />
          </ContentLayout>
        }
      />
    );
  }
}

createRoot(document.getElementById('app')).render(<App />);
