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
import { TestApiProvider } from '@backstage/test-utils';
import { MockSearchApi, searchApiRef } from '@backstage/plugin-search-react';

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
} from '../src/types';

const defaultGlobalHeaderComponentsMountPoints: GlobalHeaderComponentMountPoint[] =
  [
    {
      Component: SearchComponent,
      config: {
        enabled: true,
        type: ComponentType.SEARCH,
        slot: Slot.HEADER_START,
        priority: 100, // the greater the number, the more to the left it will be
      },
    },
    {
      Component: CreateDropdown as React.ComponentType,
      config: {
        type: ComponentType.DROPDOWN_BUTTON,
        enabled: true,
        slot: Slot.HEADER_START,
        priority: 90,
        key: 'create',
      },
    },
    {
      Component: HeaderIconButton as React.ComponentType,
      config: {
        type: ComponentType.ICON_BUTTON,
        enabled: true,
        slot: Slot.HEADER_START,
        priority: 80,
        props: {
          icon: 'help', // TODO: come up with a new icon solution
          tooltip: 'Support',
          to: '/support',
        },
      },
    },
    {
      Component: HeaderIconButton as React.ComponentType,
      config: {
        type: ComponentType.ICON_BUTTON,
        enabled: true,
        slot: Slot.HEADER_START,
        priority: 70,
        props: {
          key: 'notifications',
          icon: 'group', // TODO: come up with a new icon solution
          tooltip: 'Notifications',
          to: '/notifications',
        },
      },
    },
    {
      Component: ProfileDropdown as React.ComponentType,
      config: {
        type: ComponentType.DROPDOWN_BUTTON,
        enabled: true,
        slot: Slot.HEADER_END,
        priority: 0, // the greater the number, the more to the left it will be
        key: 'profile',
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

const scalprumState: ScalprumState = {
  initialized: true,
  api: {
    dynamicRootConfig: {
      mountPoints: {
        'application/header/component':
          defaultGlobalHeaderComponentsMountPoints,
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
      <TestApiProvider apis={[[searchApiRef, mockSearchApi]]}>
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
