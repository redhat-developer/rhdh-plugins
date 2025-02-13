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
import { mockApis, MockFetchApi, TestApiProvider } from '@backstage/test-utils';
import { MockSearchApi, searchApiRef } from '@backstage/plugin-search-react';
import { catalogApiRef } from '@backstage/plugin-catalog-react';
import { catalogApiMock } from '@backstage/plugin-catalog-react/testUtils';
import {
  createUnifiedTheme,
  UnifiedThemeProvider,
  palettes as defaultPalettes,
} from '@backstage/theme';
import { AppTheme, configApiRef } from '@backstage/core-plugin-api';
import {
  notificationsApiRef,
  NotificationsClient,
} from '@backstage/plugin-notifications';

import Button from '@mui/material/Button';

import { ScalprumContext, ScalprumState } from '@scalprum/react-core';
import { PluginStore } from '@openshift/dynamic-plugin-sdk';

import {
  ComponentType,
  GlobalHeader,
  globalHeaderPlugin,
  NotificationBanner,
} from '../src/plugin';

import {
  defaultCreateDropdownMountPoints,
  defaultGlobalHeaderComponentsMountPoints,
  defaultProfileDropdownMountPoints,
} from '../src/defaultMountPoints/defaultMountPoints';

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

const mockBaseUrl = 'https://backstage/api/notifications';
const discoveryApi = { getBaseUrl: async () => mockBaseUrl };
const fetchApi = new MockFetchApi();
const client = new NotificationsClient({ discoveryApi, fetchApi });

const lightTheme = createUnifiedTheme({
  palette: {
    ...defaultPalettes.light,
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        colorPrimary: {
          backgroundColor: '#212427',
          backgroundImage: 'none',
        },
      },
    },
  },
});

const darkTheme = createUnifiedTheme({
  palette: {
    ...defaultPalettes.dark,
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        colorPrimary: {
          backgroundColor: '#1b1d21',
          backgroundImage: 'none',
        },
      },
    },
  },
});

const themes: AppTheme[] = [
  {
    id: 'light',
    title: 'Light Theme',
    variant: 'light',
    Provider: ({ children }) => (
      <UnifiedThemeProvider theme={lightTheme}>{children}</UnifiedThemeProvider>
    ),
  },
  {
    id: 'dark',
    title: 'Dark Theme',
    variant: 'dark',
    Provider: ({ children }) => (
      <UnifiedThemeProvider theme={darkTheme}>{children}</UnifiedThemeProvider>
    ),
  },
];

const Providers = ({
  mountPoints,
}: React.PropsWithChildren<{ mountPoints: Record<string, any> }>) => {
  const scalprumState = React.useMemo<ScalprumState>(
    () => ({
      initialized: true,
      api: {
        dynamicRootConfig: {
          mountPoints,
        },
      },
      config: {},
      pluginStore: new PluginStore(),
    }),
    [mountPoints],
  );

  return (
    <TestApiProvider
      apis={[
        [catalogApiRef, catalogApi],
        [searchApiRef, mockSearchApi],
        [configApiRef, mockConfigApi],
        [notificationsApiRef, client],
      ]}
    >
      <ScalprumContext.Provider value={scalprumState}>
        <GlobalHeader />
      </ScalprumContext.Provider>
    </TestApiProvider>
  );
};

createDevApp()
  .registerPlugin(globalHeaderPlugin)
  .addThemes(themes)
  .addPage({
    element: (
      <Providers
        mountPoints={{
          'global.header/component': defaultGlobalHeaderComponentsMountPoints,
          'global.header/create': defaultCreateDropdownMountPoints,
          'global.header/profile': defaultProfileDropdownMountPoints,
        }}
      >
        <GlobalHeader />
      </Providers>
    ),
    title: 'Default header',
    path: '/default-header',
  })
  .addPage({
    element: (
      <Providers
        mountPoints={{
          'global.header/component':
            defaultGlobalHeaderComponentsMountPoints.filter(
              mp => mp.config.type !== ComponentType.SEARCH,
            ),
          'global.header/create': defaultCreateDropdownMountPoints,
          'global.header/profile': defaultProfileDropdownMountPoints,
        }}
      >
        <GlobalHeader />
      </Providers>
    ),
    title: 'Header without search',
    path: '/header-without-search',
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
