// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import React from 'react';
import SideNavigation, { SideNavigationProps } from '@cloudscape-design/components/side-navigation';

const navHeader = { text: 'Menu', href: '#/' };
export const navItems: SideNavigationProps['items'] = [

  {
    type: 'section',
    text: 'Chatbot',
    items: [
      { type: 'link', text: 'Model Chat', href: '/chatmodel.html' },
      { type: 'link', text: 'Agent Chat', href: '/chatagent.html' },
      // { type: 'link', text: 'Chat Doc', href: '/chatdoc.html' },
    ],
  },
  {
    type: 'section',
    text: 'Knowledge base',
    items: [
      { type: 'link', text: 'Search', href: '/knowledgebase.html' },
      { type: 'link', text: 'Upload', href: '/kbupload.html' },
    ],
  },
  {
    type: 'section',
    text: 'Application',
    items: [
      { type: 'link', text: 'Translate', href: '/translate.html' },
    ],
  },
  {
    type: 'section',
    text: 'Records',
    items: [
      { type: 'link', text: 'Requestion records', href: '/records.html' }
    ],
  },
];

const defaultOnFollowHandler: SideNavigationProps['onFollow'] = event => {
  // keep the locked href for our demo pages
  event.preventDefault();
};

interface NavigationProps {
  activeHref?: string;
  header?: SideNavigationProps['header'];
  items?: SideNavigationProps['items'];
  onFollowHandler?: SideNavigationProps['onFollow'];
}

export function Navigation({
  activeHref,
  header = navHeader,
  items = navItems,
  onFollowHandler = defaultOnFollowHandler,
}: NavigationProps) {
  // return <SideNavigation items={items} header={header} activeHref={activeHref} onFollow={onFollowHandler} />;
  return <SideNavigation items={items} header={header} activeHref={activeHref}  />;
}
