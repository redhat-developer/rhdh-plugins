/*
 * Copyright Red Hat, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import React from 'react';
import { createDevApp } from '@backstage/dev-utils';
import { mockApis, TestApiProvider } from '@backstage/test-utils';
import { MockSearchApi, searchApiRef } from '@backstage/plugin-search-react';
import { catalogApiRef } from '@backstage/plugin-catalog-react';
import { catalogApiMock } from '@backstage/plugin-catalog-react/testUtils';
import Button from '@mui/material/Button';

import { globalHeaderPlugin, NotificationBanner } from '../src/plugin';
import { ExampleComponent } from '../src/components/ExampleComponent';
import { SearchComponent } from '../src/components/SearchComponent/SearchComponent';
import { CreateDropdown } from '../src/components/HeaderDropdownComponent/CreateDropdown';
import { HeaderIconButton } from '../src/components/HeaderIconButtonComponent/HeaderIconButton';
import ProfileDropdown from '../src/components/HeaderDropdownComponent/ProfileDropdown';
import { ScalprumContext, ScalprumState } from '@scalprum/react-core';
import { PluginStore } from '@openshift/dynamic-plugin-sdk';
import {
  Slot,
  ComponentType,
  GlobalHeaderComponentMountPoint,
  ProfileDropdownMountPoint,
  CreateDropdownMountPoint,
} from '../src/types';
import { configApiRef } from '@backstage/core-plugin-api';
import { HeaderLink } from '../src/components/HeaderLinkComponent/HeaderLink';
import { LogoutButton } from '../src/components/HeaderButtonComponent/LogoutButton';
import { SoftwareTemplatesSection } from '../src/components/HeaderDropdownComponent/SoftwareTemplatesSection';
import { RegisterAComponentSection } from '../src/components/HeaderDropdownComponent/RegisterAComponentSection';

const defaultGlobalHeaderComponentsMountPoints: GlobalHeaderComponentMountPoint[] =
  [
    {
      Component: SearchComponent,
      config: {
        type: ComponentType.SEARCH,
        slot: Slot.HEADER_START,
        priority: 100, // the greater the number, the more to the left it will be
      },
    },
    {
      Component: CreateDropdown as React.ComponentType,
      config: {
        type: ComponentType.DROPDOWN_BUTTON,
        slot: Slot.HEADER_START,
        priority: 90,
        key: 'create',
      },
    },
    {
      Component: HeaderIconButton as React.ComponentType,
      config: {
        type: ComponentType.ICON_BUTTON,
        slot: Slot.HEADER_START,
        priority: 80,
        props: {
          icon: 'support',
          tooltip: 'Support',
          to: '/support',
        },
      },
    },
    {
      Component: HeaderIconButton as React.ComponentType,
      config: {
        type: ComponentType.ICON_BUTTON,
        slot: Slot.HEADER_START,
        priority: 70,
        props: {
          key: 'notifications',
          icon: 'notifications',
          tooltip: 'Notifications',
          to: '/notifications',
        },
      },
    },
    {
      Component: ProfileDropdown as React.ComponentType,
      config: {
        type: ComponentType.DROPDOWN_BUTTON,
        slot: Slot.HEADER_END,
        priority: 0, // the greater the number, the more to the left it will be
        key: 'profile',
      },
    },
  ];

const defaultCreateDropdownMountPoints: CreateDropdownMountPoint[] = [
  {
    Component: SoftwareTemplatesSection as React.ComponentType,
    config: {
      type: ComponentType.LIST,
      priority: 10,
    },
  },
  {
    Component: RegisterAComponentSection as React.ComponentType,
    config: {
      type: ComponentType.LINK,
      priority: 0,
    },
  },
];

const defaultProfileDropdownMountPoints: ProfileDropdownMountPoint[] = [
  {
    Component: HeaderLink as React.ComponentType,
    config: {
      type: ComponentType.LINK,
      priority: 10,
      props: {
        title: 'Settings',
        icon: 'manageAccounts',
        link: '/settings',
      },
    },
  },
  {
    Component: LogoutButton as React.ComponentType,
    config: {
      type: ComponentType.LOGOUT,
      priority: 0,
    },
  },
];

const mockSearchApi = new MockSearchApi({
  results: [
    {
      type: 'software-catalog',
      document: {
        title: 'example search result',
        text: 'this is an example search result',
        location: 'https://example.com',
      },
    },
  ],
});

const mockConfigApi = mockApis.config({
  data: {
    dynamicPlugins: {
      frontend: {
        'backstage.plugin-notifications': {
          dynamicRoutes: [{ path: '/notifications' }],
        },
      },
    },
  },
});

const entities = [
  {
    apiVersion: '1',
    kind: 'Template',
    metadata: {
      name: 'mock-starred-template',
      title: 'Mock Starred Template!',
    },
  },
  {
    apiVersion: '1',
    kind: 'Template',
    metadata: {
      name: 'mock-starred-template-2',
      title: 'Mock Starred Template 2!',
    },
  },
  {
    apiVersion: '1',
    kind: 'Template',
    metadata: {
      name: 'mock-starred-template-3',
      title: 'Mock Starred Template 3!',
    },
  },
  {
    apiVersion: '1',
    kind: 'Template',
    metadata: {
      name: 'mock-starred-template-4',
      title: 'Mock Starred Template 4!',
    },
  },
];

const catalogApi = catalogApiMock({ entities });

const scalprumState: ScalprumState = {
  initialized: true,
  api: {
    dynamicRootConfig: {
      mountPoints: {
        'global.header/component': defaultGlobalHeaderComponentsMountPoints,
        'global.header/create': defaultCreateDropdownMountPoints,
        'global.header/profile': defaultProfileDropdownMountPoints,
      },
    },
  },
  config: {},
  pluginStore: new PluginStore(),
};

createDevApp()
  .registerPlugin(globalHeaderPlugin)
  .addPage({
    element: (
      <TestApiProvider
        apis={[
          [catalogApiRef, catalogApi],
          [searchApiRef, mockSearchApi],
          [configApiRef, mockConfigApi],
        ]}
      >
        <ScalprumContext.Provider value={scalprumState}>
          <ExampleComponent />
        </ScalprumContext.Provider>
      </TestApiProvider>
    ),
    title: 'Global Header',
    path: '/global-header',
  })
  .addPage({
    element: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <NotificationBanner
          title={`🥳 Happy ${new Date().getFullYear()}! 🥳`}
        />
        <NotificationBanner title="## This is Markdown!" markdown />
        <NotificationBanner title="This is also **Markdown**!" markdown />
        <NotificationBanner title="This is a super long notification that contains a lot of information! This is a super long notification that contains a lot of information! This is a super long notification that contains a lot of information! This is a super long notification that contains a lot of information! This is a super long notification that contains a lot of information! This is a super long notification that contains a lot of information! This is a super long notification that contains a lot of information! This is a super long notification that contains a lot of information!" />

        {/* <NotificationBanner title="This is a warning!" icon="info" />
        <NotificationBanner title="This is a warning!" icon="success" />
        <NotificationBanner title="This is a warning!" icon="warning" />
        <NotificationBanner title="This is a warning!" icon="error" /> */}

        <NotificationBanner
          title="A colorized notification: ⚠️ Maintainance planned for this week! ⚠️"
          textColor="blue"
          backgroundColor="yellow"
          border="2px solid blue"
        />
        <NotificationBanner
          title="And a dismissable notification! Will appear after reload!"
          dismiss="session"
        />
        <NotificationBanner
          title="And a dismissable notification! Dismiss option is saved in local storage!"
          dismiss="localstorage"
        />

        <Button
          onClick={() => {
            localStorage.removeItem('global-header/NotificationBanner');
            window.location.reload();
          }}
        >
          Cleanup localStorage
        </Button>
      </div>
    ),
    title: 'Notifications',
    path: '/notifications',
  })
  .render();
