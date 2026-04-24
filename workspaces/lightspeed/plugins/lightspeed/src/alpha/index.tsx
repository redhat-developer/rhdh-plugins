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

import {
  ApiBlueprint,
  configApiRef,
  createApiFactory,
  createFrontendModule,
  createFrontendPlugin,
  createRouteRef,
  createSubRouteRef,
  fetchApiRef,
  PageBlueprint,
} from '@backstage/frontend-plugin-api';
import {
  AppRootWrapperBlueprint,
  TranslationBlueprint,
} from '@backstage/plugin-app-react';

import { AppDrawerContentBlueprint } from '@red-hat-developer-hub/backstage-plugin-app-react/alpha';

import { lightspeedApiRef } from '../api/api';
import { LightspeedApiClient } from '../api/LightspeedApiClient';
import { notebooksApiRef } from '../api/notebooksApi';
import { NotebooksApiClient } from '../api/NotebooksApiClient';
import { LightspeedChatContainer } from '../components/LightspeedChatContainer';
import { LIGHTSPEED_APP_DRAWER_ID } from '../const';
import { lightspeedTranslations } from '../translations';
import { LightspeedFAB } from './LightspeedFAB';
import { LightspeedProvider } from './LightspeedProvider';

const nfsRootRouteRef = createRouteRef();
const nfsConversationRouteRef = createSubRouteRef({
  parent: nfsRootRouteRef,
  path: '/conversation/:conversationId',
});

const lightspeedApi = ApiBlueprint.make({
  name: 'lightspeed',
  params: defineParams =>
    defineParams(
      createApiFactory({
        api: lightspeedApiRef,
        deps: {
          configApi: configApiRef,
          fetchApi: fetchApiRef,
        },
        factory: ({ configApi, fetchApi }) =>
          new LightspeedApiClient({ configApi, fetchApi }),
      }),
    ),
});

const notebooksApi = ApiBlueprint.make({
  name: 'notebooks',
  params: defineParams =>
    defineParams(
      createApiFactory({
        api: notebooksApiRef,
        deps: {
          configApi: configApiRef,
          fetchApi: fetchApiRef,
        },
        factory: ({ configApi, fetchApi }) =>
          new NotebooksApiClient({ configApi, fetchApi }),
      }),
    ),
});

const lightspeedPage = PageBlueprint.make({
  params: {
    path: '/lightspeed',
    routeRef: nfsRootRouteRef,
    noHeader: true,
    loader: () => import('../components/Router').then(m => <m.Router />),
  },
});

const lightspeedDrawer = AppDrawerContentBlueprint.make({
  name: 'lightspeed',
  params: {
    id: LIGHTSPEED_APP_DRAWER_ID,
    element: <LightspeedChatContainer />,
    resizable: false,
    defaultWidth: 400,
    priority: 100,
  },
});

/**
 * Lightspeed FAB module
 *  @alpha
 */
const lightspeedFAB = AppRootWrapperBlueprint.make({
  name: 'lightspeed-fab',
  params: {
    component: ({ children }) => (
      <LightspeedProvider>
        <LightspeedFAB />
        {children}
      </LightspeedProvider>
    ),
  },
});

/**
 *  @alpha
 */
export const lightspeedFABModule = createFrontendModule({
  pluginId: 'app',
  extensions: [lightspeedFAB],
});

/**
 * Translation wiring for the language selector (app-config `app.extensions`).
 *
 *  @alpha
 */
export const lightspeedTranslationsModule = createFrontendModule({
  pluginId: 'app',
  extensions: [
    TranslationBlueprint.make({
      name: 'lightspeed-translations',
      params: {
        resource: lightspeedTranslations,
      },
    }),
  ],
});

/**
 * Lightspeed plugin for the Backstage new frontend system.
 *
 * @alpha
 */
export default createFrontendPlugin({
  pluginId: 'lightspeed',
  extensions: [lightspeedApi, notebooksApi, lightspeedPage, lightspeedDrawer],
  routes: {
    root: nfsRootRouteRef,
    lightspeedConversation: nfsConversationRouteRef,
  },
});

export * from '../translations';
