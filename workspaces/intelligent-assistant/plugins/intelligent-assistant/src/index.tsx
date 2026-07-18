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

import { useEffect, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

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

import { unstable_ClassNameGenerator as ClassNameGenerator } from '@mui/material/className';

import { AppDrawerContentBlueprint } from '@red-hat-developer-hub/backstage-plugin-app-react/alpha';

import { lightspeedApiRef } from './api/api';
import { LightspeedApiClient } from './api/LightspeedApiClient';
import { notebooksApiRef } from './api/notebooksApi';
import { NotebooksApiClient } from './api/NotebooksApiClient';
import { LightspeedChatContainer as LightspeedChatContainerElement } from './components/LightspeedChatContainerLazy';
import { LightspeedDrawerProvider as LightspeedProvider } from './components/LightspeedDrawerProvider';
import { LightspeedFABContent as LightspeedFABComponent } from './components/LightspeedFABContent';
import {
  LIGHTSPEED_APP_DRAWER_ID,
  LIGHTSPEED_LEGACY_PATH,
  LIGHTSPEED_PATH,
} from './const';
import { lightspeedTranslations } from './translations';

ClassNameGenerator.configure(componentName =>
  componentName.startsWith('v5-') ? componentName : `v5-${componentName}`,
);

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
    element: <LightspeedChatContainerElement />,
    resizable: false,
    defaultWidth: 400,
    priority: 100,
  },
});

const LightspeedLegacyRedirect = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    if (location.pathname.startsWith(LIGHTSPEED_LEGACY_PATH)) {
      const newPath = location.pathname.replace(
        LIGHTSPEED_LEGACY_PATH,
        LIGHTSPEED_PATH,
      );
      navigate(newPath + location.search + location.hash, {
        replace: true,
      });
    }
  }, [location, navigate]);
  return <>{children}</>;
};

const intelligentAssistantRedirect = AppRootWrapperBlueprint.make({
  name: 'intelligent-assistant-redirect',
  params: {
    component: LightspeedLegacyRedirect,
  },
});

/**
 * @public
 */
export const intelligentAssistantRedirectModule = createFrontendModule({
  pluginId: 'app',
  extensions: [intelligentAssistantRedirect],
});

/**
 * Lightspeed FAB module
 * @public
 */
const intelligentAssistantFABExtension = AppRootWrapperBlueprint.make({
  name: 'intelligent-assistant-fab',
  params: {
    component: ({ children }) => (
      <LightspeedProvider>
        <LightspeedFABComponent />
        {children}
      </LightspeedProvider>
    ),
  },
});

/**
 * @public
 */
export const intelligentAssistantFABModule = createFrontendModule({
  pluginId: 'app',
  extensions: [intelligentAssistantFABExtension, intelligentAssistantRedirect],
});

/**
 * Translation wiring for the language selector (app-config `app.extensions`).
 *
 * @public
 */
export const intelligentAssistantTranslationsModule = createFrontendModule({
  pluginId: 'app',
  extensions: [
    TranslationBlueprint.make({
      name: 'intelligent-assistant-translations',
      params: {
        resource: lightspeedTranslations,
      },
    }),
  ],
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
