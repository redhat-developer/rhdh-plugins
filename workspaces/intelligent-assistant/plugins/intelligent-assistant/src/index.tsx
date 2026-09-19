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
  createFrontendPlugin,
  createRouteRef,
  createSubRouteRef,
  fetchApiRef,
  PageBlueprint,
} from '@backstage/frontend-plugin-api';

import { AppDrawerContentBlueprint } from '@red-hat-developer-hub/backstage-plugin-app-react';

import { lightspeedApiRef } from './api/api';
import { LightspeedApiClient } from './api/LightspeedApiClient';
import { notebooksApiRef } from './api/notebooksApi';
import { NotebooksApiClient } from './api/NotebooksApiClient';
import { LIGHTSPEED_APP_DRAWER_ID, LIGHTSPEED_PATH } from './const';
import { LazyLightspeedChatDrawerContent } from './lazy/LazyLightspeedChatDrawerContent';

import './muiClassNameConfig';

const nfsRootRouteRef = createRouteRef();
const nfsConversationRouteRef = createSubRouteRef({
  parent: nfsRootRouteRef,
  path: '/conversation/:conversationId',
});

const intelligentAssistantApi = ApiBlueprint.make({
  name: 'intelligent-assistant',
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

const intelligentAssistantPage = PageBlueprint.make({
  params: {
    path: LIGHTSPEED_PATH,
    routeRef: nfsRootRouteRef,
    noHeader: true,
    loader: () => import('./components/Router').then(m => <m.Router />),
  },
});

const intelligentAssistantDrawer = AppDrawerContentBlueprint.make({
  name: 'intelligent-assistant',
  params: {
    id: LIGHTSPEED_APP_DRAWER_ID,
    element: <LazyLightspeedChatDrawerContent />,
    resizable: true,
    defaultWidth: 400,
    priority: 100,
  },
});

/**
 * Lightspeed plugin for the Backstage new frontend system.
 *
 * @public
 */
export default createFrontendPlugin({
  pluginId: 'intelligent-assistant',
  extensions: [
    intelligentAssistantApi,
    notebooksApi,
    intelligentAssistantPage,
    intelligentAssistantDrawer,
  ],
  routes: {
    root: nfsRootRouteRef,
    lightspeedConversation: nfsConversationRouteRef,
  },
});
