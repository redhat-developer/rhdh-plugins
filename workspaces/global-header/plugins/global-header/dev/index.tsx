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

import { useMemo } from 'react';
import type { PropsWithChildren } from 'react';

import { createDevApp } from '@backstage/dev-utils';
import { mockApis, MockFetchApi, TestApiProvider } from '@backstage/test-utils';
import { MockSearchApi, searchApiRef } from '@backstage/plugin-search-react';
import {
  catalogApiRef,
  MockStarredEntitiesApi,
  starredEntitiesApiRef,
} from '@backstage/plugin-catalog-react';
import { catalogApiMock } from '@backstage/plugin-catalog-react/testUtils';
import { configApiRef } from '@backstage/core-plugin-api';
import {
  notificationsApiRef,
  NotificationsClient,
} from '@backstage/plugin-notifications';

// eslint-disable-next-line @backstage/no-ui-css-imports-in-non-frontend
import '@backstage/ui/css/styles.css';

import Button from '@mui/material/Button';

import { ScalprumContext, ScalprumState } from '@scalprum/react-core';
import { PluginStore } from '@openshift/dynamic-plugin-sdk';

import { getAllThemes } from '@red-hat-developer-hub/backstage-plugin-theme';

import {
  GlobalHeader,
  globalHeaderPlugin,
  NotificationBanner,
  Spacer,
} from '../src/plugin';

import { globalHeaderTranslations } from '../src/translations';

import {
  defaultApplicationLauncherDropdownMountPoints,
  defaultCreateDropdownMountPoints,
  defaultGlobalHeaderComponentsMountPoints,
  defaultHelpDropdownMountPoints,
  defaultProfileDropdownMountPoints,
} from '../src/defaultMountPoints/defaultMountPoints';

import { HeaderButton } from '../src/components/HeaderButton/HeaderButton';

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
    app: {
      support: {
        url: 'https://access.redhat.com/products/red-hat-developer-hub',
      },
    },
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

const starredEntitiesApi = new MockStarredEntitiesApi();

const mockBaseUrl = 'https://backstage/api/notifications';
const discoveryApi = { getBaseUrl: async () => mockBaseUrl };
const fetchApi = new MockFetchApi();
const client = new NotificationsClient({ discoveryApi, fetchApi });

const Providers = ({
  mountPoints,
}: PropsWithChildren<{ mountPoints: Record<string, any> }>) => {
  const scalprumState = useMemo<ScalprumState>(
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
  starredEntitiesApi.toggleStarred('template:default/mock-starred-template');

  return (
    <TestApiProvider
      apis={[
        [catalogApiRef, catalogApi],
        [starredEntitiesApiRef, starredEntitiesApi],
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
  .addThemes(getAllThemes())
  .addTranslationResource(globalHeaderTranslations)
  .setAvailableLanguages(['en', 'de', 'es', 'fr', 'it'])
  .setDefaultLanguage('en')
  .addPage({
    element: (
      <Providers
        mountPoints={{
          'global.header/component': defaultGlobalHeaderComponentsMountPoints,
          'global.header/create': defaultCreateDropdownMountPoints,
          'global.header/profile': defaultProfileDropdownMountPoints,
          'global.header/application-launcher':
            defaultApplicationLauncherDropdownMountPoints,
          'global.header/help': defaultHelpDropdownMountPoints,
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
          'global.header/component': [
            ...defaultGlobalHeaderComponentsMountPoints.filter(
              (_mp, index) => index > 0,
            ),
            {
              Component: Spacer,
              config: {
                priority: 100, // the greater the number, the more to the left it will be
              },
            },
          ],
          'global.header/create': defaultCreateDropdownMountPoints,
          'global.header/profile': defaultProfileDropdownMountPoints,
          'global.header/application-launcher':
            defaultApplicationLauncherDropdownMountPoints,
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
      <Providers
        mountPoints={{
          'global.header/component': [
            {
              Component: HeaderButton,
              config: {
                props: {
                  title: 'A button',
                  variant: 'outlined',
                  to: '/',
                },
              },
            },
            {
              Component: HeaderButton,
              config: {
                props: {
                  title: 'Another button',
                  variant: 'outlined',
                  to: '/',
                },
              },
            },
            {
              Component: HeaderButton,
              config: {
                props: {
                  title: 'Help button',
                  startIcon: 'help',
                  to: '/help',
                },
              },
            },
            {
              Component: HeaderButton,
              config: {
                props: {
                  title: 'GitHub button',
                  to: 'https://github.com/',
                },
              },
            },
            {
              Component: HeaderButton,
              config: {
                props: {
                  title: 'GitHub button',
                  to: 'https://github.com/',
                  externalLinkIcon: false,
                },
              },
            },
          ],
        }}
      >
        <GlobalHeader />
      </Providers>
    ),
    title: 'Header buttons',
    path: '/header-buttons',
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
          borderColor="blue"
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
