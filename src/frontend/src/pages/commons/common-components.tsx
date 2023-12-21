// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import React, { forwardRef, useState } from 'react';
import { AppLayout, AppLayoutProps, Badge, Box, Button, Link, SpaceBetween, ContentLayout } from '@cloudscape-design/components';

import { I18nProvider } from '@cloudscape-design/components/i18n';
import enMessages from '@cloudscape-design/components/i18n/messages/all.en.json';
import { LoginComponent } from './login';
import Cookies from 'js-cookie';
import TopNavigation from "@cloudscape-design/components/top-navigation";
import { config } from '../../../config';
// backward compatibility
export * from './index';

export const ec2NavItems = [
  { type: 'link', text: 'Instances', href: '#/instances' },
  { type: 'link', text: 'Instance types', href: '#/instance-types' },
  { type: 'link', text: 'Launch templates', href: '#/launch-templates' },
  { type: 'link', text: 'Spot requests', href: '#/spot-requests' },
  { type: 'link', text: 'Saving plans', href: '#/saving-plans' },
  { type: 'link', text: 'Reserved instances', href: '#/reserved-instances' },
  { type: 'divider' },
  {
    type: 'link',
    text: 'Notifications',
    info: <Badge color="red">23</Badge>,
    href: '#/notifications',
  },
  {
    type: 'link',
    text: 'Documentation',
    external: true,
    href: '#/documentation',
  },
];

export const TableNoMatchState = ({ onClearFilter }: { onClearFilter: () => void }) => (
  <Box margin={{ vertical: 'xs' }} textAlign="center" color="inherit">
    <SpaceBetween size="xxs">
      <div>
        <b>No matches</b>
        <Box variant="p" color="inherit">
          We can't find a match.
        </Box>
      </div>
      <Button onClick={onClearFilter}>Clear filter</Button>
    </SpaceBetween>
  </Box>
);

export const TableEmptyState = ({ resourceName }: { resourceName: string }) => (
  <Box margin={{ vertical: 'xs' }} textAlign="center" color="inherit">
    <SpaceBetween size="xxs">
      <div>
        <b>No {resourceName.toLowerCase()}s</b>
        <Box variant="p" color="inherit">
          No {resourceName.toLowerCase()}s associated with this resource.
        </Box>
      </div>
      <Button>Create {resourceName.toLowerCase()}</Button>
    </SpaceBetween>
  </Box>
);


export const CookieValidate = (tokenName) => {

  console.log("tokenName:", tokenName);

  const token = Cookies.get(tokenName);
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

    if (isTokenValid) {
      // The token is valid
      console.log('Token is valid');
    } else {
      // The token is expired
      console.log('Token is expired');
      // You may want to redirect to the login page or take appropriate action
    }
    return isTokenValid;
  } else {
    // Token is not present
    console.log('Token not present');
    return false;
    // You may want to redirect to the login page or take appropriate action
  }
}

export const CustomAppLayout = forwardRef<AppLayoutProps.Ref, AppLayoutProps>((props, ref) => {


  if (!CookieValidate('jwt') && config.AUTH == 'iam') {
    return (
      <EmptyAppLayout
        content={
          <ContentLayout>
            <LoginComponent />
          </ContentLayout>
        }
      />
    )
  }

  return (
    <div>
      <DefaultHeader />

      <I18nProvider locale="en" messages={[enMessages]}>

        <AppLayout ref={ref} {...props} />
      </I18nProvider>
    </div>
  );

});


export const EmptyAppLayout = forwardRef<AppLayoutProps.Ref, AppLayoutProps>((props, ref) => {
  return (
    <div>
      <DefaultHeader />
      <I18nProvider locale="en" messages={[enMessages]}>
        <AppLayout
          navigationHide={true}
          toolsHide={true}
          ref={ref} {...props}
        />
      </I18nProvider>
    </div>
  )
})


const DefaultHeader = () => {
  return (
    <TopNavigation
      identity={{
        href: "#",
        title: "GenAI Builder",
        logo: {
          src: "/resources/logo.png",
          alt: "Service"
        }
      }}
      utilities={[
        {
          type: "button",
          text: "Logout",
          external: false,
          onClick: ()=>{
            Cookies.remove('jwt')
            window.location.href = '/chatmodel.html';
          }
        },
        {
          type: "button",
          text: "GitHub",
          href: "https://github.com/cloudswb/aws-genai-bedrock-builder",
          external: true,
          externalIconAriaLabel: " (opens in a new tab)"
        },
        // {
        //   type: "menu-dropdown",
        //   text: "Customer Name",
        //   description: "zk.life@qq.com",
        //   iconName: "user-profile",
        //   items: [
        //     { id: "profile", text: "Profile" },
        //     { id: "signout", text: "Sign out", href: "/logout.html", },
        //     {
        //       id: "support-group",
        //       text: "Support",
        //       items: [
        //         {
        //           id: "documentation",
        //           text: "Documentation",
        //           href: "#",
        //           external: true,
        //           externalIconAriaLabel:
        //             " (opens in new tab)"
        //         },
        //         { id: "support", text: "Support" },
        //         {
        //           id: "feedback", 
        //           text: "Feedback",
        //           href: "#",
        //           external: true,
        //           externalIconAriaLabel:
        //             " (opens in new tab)"
        //         }
        //       ]
        //     },

        //   ]
        // }
      ]}
    />
  );
}


