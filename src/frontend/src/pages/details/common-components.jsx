// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import React, { useState } from 'react';
import {
  Box,
  BreadcrumbGroup,
  Button,
  ButtonDropdown,
  ColumnLayout,
  Container,
  Header,
  ProgressBar,
  StatusIndicator,
  SpaceBetween,
  Table,
  TextFilter,
} from '@cloudscape-design/components';
import { useAsyncData } from '../commons/use-async-data';
import DataProvider from '../commons/data-provider';
import { TableEmptyState, InfoLink } from '../commons/common-components';
import { ORIGINS_COLUMN_DEFINITIONS, BEHAVIORS_COLUMN_DEFINITIONS, TAGS_COLUMN_DEFINITIONS } from './details-config';
import { resourceDetailBreadcrumbs } from '../../common/breadcrumbs';
import CopyText from '../commons/copy-text';
import { baseTableAriaLabels, getHeaderCounterText, getTextFilterCounterText } from '../../i18n-strings';
import { useCollection } from '@cloudscape-design/collection-hooks';
import crypto from 'crypto-js'
import moment from 'moment'
import { config } from '../../../config';
import axios from "axios"
import Cookies from 'js-cookie';
const { v4: uuidv4 } = require('uuid');

export const DEMO_DISTRIBUTION = {
  id: 'SLCCSMWOHOFUY0',
  domainName: 'abcdef01234567890.cloudfront.net',
  arn: 'arn:aws:cloudfront::abcdef01234567890.cloudfront.net/SLCCSMWOHOFUY0',
  priceClass: 'Use only US, Canada, Europe, and Asia',
  sslCertificate: 'Default CloudFront SSL certificate',
  logging: 'Off',
};

export const Breadcrumbs = () => (
  <BreadcrumbGroup items={resourceDetailBreadcrumbs} expandAriaLabel="Show path" ariaLabel="Breadcrumbs" />
);


export const GetUserName = () =>{


  const token = Cookies.get('jwt');
  console.log("token:", token);

  const decodeToken = token => {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace('-', '+').replace('_', '/');
    console.log(JSON.parse(window.atob(base64)))
    return JSON.parse(window.atob(base64));
  };

  if (token) {
      // Decode the token to get its payload
      const decodedToken = decodeToken(token);

      // Check the expiration time (assuming 'exp' is a key in the token payload)
      const isTokenValid = decodedToken.exp * 1000 > Date.now();
      if(isTokenValid){
        return decodedToken.username;
      }

      return ""
  }

}

export function generateRandomNonDuplicateString() {
  // Generate a random UUID
  const randomUUID = uuidv4();

  // Hash the UUID using SHA-256
  const hash = crypto.createHash('sha256');
  const hashedUUID = hash.update(randomUUID).digest('hex');

  // Use a portion of the hashed UUID as the final string
  const randomString = hashedUUID.substring(0, 10); // You can adjust the length as needed

  return randomString;
}

export async function getSignedPostHeader(host, region, request_parameters) {

  //https://gw5bpwinwg.execute-api.us-east-1.amazonaws.com/prod/auth

  console.log("Cookies get start");
  const token = Cookies.get('jwt');
  console.log("Cookies get start:", token);
  if (token == undefined || token == "") {
    Cookies.remove('jwt')
    window.location.href = '/chatmodel.html';
    return '';
  }

  const headers = {
    'jwt': `${token}` //Object.entries(cookies).map(entry => entry.join('=')).join('; ')
  };

  const postData = async () => {
    const apiUrl = config.AGW_AUTH; // Replace with your API endpoint

    try {
      const response = await axios.post(apiUrl, {
        'host': `${host}`,
        'region': `${region}`,
        'request_parameters': `${request_parameters}`,
        'token': token
      });

      // Assuming the response contains JSON data
      const jsonData = response.data;

      // Analyze the JSON result
      console.log('getSignedPostHeader Data:', jsonData);

      return jsonData.body;

    } catch (error) {
      // Handle errors
      console.error('Error:', error);
    }
  };

  return JSON.parse(await postData());

}


export const PageHeader = ({ buttons, header }) => {
  return (
    <Header
      variant="h1"
      actions={
        <SpaceBetween direction="horizontal" size="xs">
          {buttons.map((button, key) =>
            !button.items ? (
              <Button href={button.href || ''} disabled={button.disabled || false} key={key}>
                {button.text}
              </Button>
            ) : (
              <ButtonDropdown items={button.items} key={key}>
                {button.text}
              </ButtonDropdown>
            )
          )}
        </SpaceBetween>
      }
    >
      {header}
    </Header>
  );
};

export const GeneralConfig = () => (
  <Container header={<Header variant="h2">General configuration</Header>}>
    <ColumnLayout columns={4} variant="text-grid">
      <div>
        <Box variant="awsui-key-label">Engine</Box>
        <div>Oracle Enterprise Edition 12.1.0.2.v7</div>
      </div>
      <div>
        <Box variant="awsui-key-label">DB instance class</Box>
        <div>db.t2.large</div>
      </div>
      <div>
        <Box variant="awsui-key-label">DB instance status</Box>
        <StatusIndicator type="success">Available</StatusIndicator>
      </div>
      <div>
        <Box variant="awsui-key-label">Pending maintenance</Box>
        <div>None</div>
      </div>
    </ColumnLayout>
  </Container>
);

export const SettingsDetails = ({ distribution = DEMO_DISTRIBUTION, isInProgress }) => (
  <ColumnLayout columns={4} variant="text-grid">
    <SpaceBetween size="l">
      <div>
        <Box variant="awsui-key-label">Distribution ID</Box>
        <div>{distribution.id}</div>
      </div>
      <div>
        <Box variant="awsui-key-label">Domain name</Box>
        <div>{distribution.domainName}</div>
      </div>
      <div>
        <Box variant="awsui-key-label">ARN</Box>
        <CopyText
          copyText={`arn:aws:cloudfront::${distribution.domainName}/${distribution.id}`}
          copyButtonLabel="Copy ARN"
          successText="ARN copied"
          errorText="ARN failed to copy"
        />
      </div>
    </SpaceBetween>

    <SpaceBetween size="l">
      {distribution.state ? (
        <StatusIndicator type={distribution.state === 'Deactivated' ? 'error' : 'success'}>
          {distribution.state}
        </StatusIndicator>
      ) : (
        <ProgressBar
          value={27}
          label="Status"
          description={isInProgress ? 'Update in progress' : undefined}
          variant="key-value"
          resultText="Available"
          status={isInProgress ? 'in-progress' : 'success'}
        />
      )}

      <div>
        <Box variant="awsui-key-label">Price class</Box>
        <div>{distribution.priceClass}</div>
      </div>
      <div>
        <Box variant="awsui-key-label">CNAMEs</Box>
        <div>-</div>
      </div>
    </SpaceBetween>
    <SpaceBetween size="l">
      <div>
        <Box variant="awsui-key-label">SSL certificate</Box>
        <div>{distribution.sslCertificate}</div>
      </div>
      <div>
        <Box variant="awsui-key-label">Custom SSL client support</Box>
        <div>-</div>
      </div>
      <div>
        <Box variant="awsui-key-label">Logging</Box>
        <div>{distribution.logging}</div>
      </div>
    </SpaceBetween>
    <SpaceBetween size="l">
      <div>
        <Box variant="awsui-key-label">IPv6</Box>
        <div>Off</div>
      </div>
      <div>
        <Box variant="awsui-key-label">Default root object</Box>
        <div>-</div>
      </div>
      <div>
        <Box variant="awsui-key-label">Comment</Box>
        <div>To verify</div>
      </div>
    </SpaceBetween>
  </ColumnLayout>
);

export const EmptyTable = props => {
  const resourceType = props.title || 'Tag';
  const colDefs = props.columnDefinitions || TAGS_COLUMN_DEFINITIONS;
  return (
    <Table
      empty={<TableEmptyState resourceName={resourceType} />}
      columnDefinitions={colDefs}
      items={[]}
      header={
        <Header
          actions={
            <SpaceBetween size="xs" direction="horizontal">
              <Button disabled={true}>Edit</Button>
              <Button disabled={true}>Delete</Button>
              <Button>Create {resourceType.toLowerCase()}</Button>
            </SpaceBetween>
          }
        >{`${resourceType}s`}</Header>
      }
    />
  );
};

const originsSelectionLabels = {
  ...baseTableAriaLabels,
  itemSelectionLabel: (data, row) => `select ${row.name}`,
  selectionGroupLabel: 'Origins selection',
};

export function OriginsTable() {
  const [origins, originsLoading] = useAsyncData(() => new DataProvider().getData('origins'));
  const [selectedItems, setSelectedItems] = useState([]);
  const isOnlyOneSelected = selectedItems.length === 1;
  const atLeastOneSelected = selectedItems.length > 0;

  return (
    <Table
      className="origins-table"
      columnDefinitions={ORIGINS_COLUMN_DEFINITIONS}
      loading={originsLoading}
      loadingText="Loading origins"
      items={origins}
      ariaLabels={originsSelectionLabels}
      selectionType="single"
      selectedItems={selectedItems}
      onSelectionChange={event => setSelectedItems(event.detail.selectedItems)}
      header={
        <Header
          counter={!originsLoading && getHeaderCounterText(origins, selectedItems)}
          actions={
            <SpaceBetween direction="horizontal" size="xs">
              <Button disabled={!isOnlyOneSelected}>Edit</Button>
              <Button disabled={!atLeastOneSelected}>Delete</Button>
              <Button>Create origin</Button>
            </SpaceBetween>
          }
        >
          Origins
        </Header>
      }
    />
  );
}

const behaviorsSelectionLabels = {
  ...baseTableAriaLabels,
  itemSelectionLabel: (data, row) => `select path ${row.pathPattern} from origin ${row.origin}`,
  selectionGroupLabel: 'Behaviors selection',
};

export function BehaviorsTable() {
  const [behaviors, behaviorsLoading] = useAsyncData(() => new DataProvider().getData('behaviors'));
  const [selectedItems, setSelectedItems] = useState([]);
  const isOnlyOneSelected = selectedItems.length === 1;
  const atLeastOneSelected = selectedItems.length > 0;

  return (
    <Table
      className="cache-table"
      columnDefinitions={BEHAVIORS_COLUMN_DEFINITIONS}
      items={behaviors}
      loading={behaviorsLoading}
      loadingText="Loading behaviors"
      ariaLabels={behaviorsSelectionLabels}
      selectionType="single"
      selectedItems={selectedItems}
      onSelectionChange={event => setSelectedItems(event.detail.selectedItems)}
      header={
        <Header
          counter={!behaviorsLoading && getHeaderCounterText(behaviors, selectedItems)}
          actions={
            <SpaceBetween direction="horizontal" size="xs">
              <Button disabled={!isOnlyOneSelected}>Edit</Button>
              <Button disabled={!atLeastOneSelected}>Delete</Button>
              <Button>Create behavior</Button>
            </SpaceBetween>
          }
        >
          Cache behavior settings
        </Header>
      }
    />
  );
}

export function TagsTable({ loadHelpPanelContent }) {
  const [tags, tagsLoading] = useAsyncData(async () => {
    const { ResourceTagMappingList } = await window.FakeServer.GetResources();
    return ResourceTagMappingList.reduce((tags, resourceTagMapping) => [...tags, ...resourceTagMapping.Tags], []);
  });

  const { items, collectionProps, filteredItemsCount, filterProps, actions } = useCollection(tags, {
    filtering: {
      noMatch: (
        <Box textAlign="center" color="inherit">
          <Box variant="strong" textAlign="center" color="inherit">
            No matches
          </Box>
          <Box variant="p" padding={{ bottom: 's' }} color="inherit">
            No tags matched the search text.
          </Box>
          <Button onClick={() => actions.setFiltering('')}>Clear filter</Button>
        </Box>
      ),
    },
    sorting: {},
  });

  return (
    <Table
      id="tags-panel"
      columnDefinitions={TAGS_COLUMN_DEFINITIONS}
      items={items}
      {...collectionProps}
      loading={tagsLoading}
      loadingText="Loading tags"
      filter={
        <TextFilter
          {...filterProps}
          filteringPlaceholder="Find tags"
          filteringAriaLabel="Filter tags"
          countText={getTextFilterCounterText(filteredItemsCount)}
        />
      }
      header={
        <Header
          variant="h2"
          counter={!tagsLoading && `(${tags.length})`}
          info={<InfoLink onFollow={() => loadHelpPanelContent(2)} />}
          actions={<Button>Manage tags</Button>}
          description={
            <>
              A tag is a label that you assign to an AWS resource. Each tag consists of a key and an optional value. You
              can use tags to search and filter your resources or track your AWS costs.
            </>
          }
        >
          Tags
        </Header>
      }
    />
  );
}

export function HomePage() {

  useEffect(() => {
    redirect();
  }, [])

  function redirect() {
    window.location.href = '/chatmodel.html';
  }

  return null;
}