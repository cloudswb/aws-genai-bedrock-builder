// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import React, { createRef } from 'react';
// import ReactHtmlParser from 'react-html-parser';
// import SyntaxHighlighter from 'react-syntax-highlighter';
// import { docco } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { createRoot } from 'react-dom/client';

import '../../styles/base.scss';
// import { config } from 'process';



class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = { toolsIndex: 0, toolsOpen: true };
    this.appLayout = createRef();
  }

  render() {
    return (
      <div></div>
    );
  }
}

createRoot(document.getElementById('app')).render(<App />);
