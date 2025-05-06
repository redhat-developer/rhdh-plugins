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
  createApiFactory,
  createPlugin,
  createRoutableExtension,
  discoveryApiRef,
  fetchApiRef,
  IconComponent,
} from '@backstage/core-plugin-api';

import { rootRouteRef } from './routes';
import { aiExperienceApiRef, rssApiRef } from './api';
import { ModelCatalogClient } from './api/ModelCatalogClient';
import { RSSClient } from './api/RSSClient';
import MUINewspaperOutlinedIcon from '@mui/icons-material/NewspaperOutlined';

/**
 * Plugin for AI Experience frontend
 * @public
 */
export const aiExperiencePlugin = createPlugin({
  id: 'ai-experience',
  routes: {
    root: rootRouteRef,
  },
  apis: [
    createApiFactory({
      api: aiExperienceApiRef,
      deps: {
        discoveryApi: discoveryApiRef,
        fetchApi: fetchApiRef,
      },
      factory: ({ discoveryApi, fetchApi }) =>
        new ModelCatalogClient({
          discoveryApi,
          fetchApi,
        }),
    }),
    createApiFactory({
      api: rssApiRef,
      deps: {
        discoveryApi: discoveryApiRef,
        fetchApi: fetchApiRef,
      },
      factory: ({ discoveryApi, fetchApi }) =>
        new RSSClient({ discoveryApi, fetchApi }),
    }),
  ],
});

/**
 * Frontend page for AI Experience
 * @public
 */
export const AiExperiencePage = aiExperiencePlugin.provide(
  createRoutableExtension({
    name: 'AiExperiencePage',
    component: () =>
      import('./components/AiExperienceHomePage').then(
        m => m.AiExperienceHomePage,
      ),
    mountPoint: rootRouteRef,
  }),
);

/**
 * AI News Page
 * @public
 */
export const AiNewsPage = aiExperiencePlugin.provide(
  createRoutableExtension({
    name: 'AiNewsPage',
    component: () =>
      import('./components/NewsPage/NewsPage').then(m => m.NewsPage),
    mountPoint: rootRouteRef,
  }),
);

/**
 * @public
 */
export const AiNewsIcon: IconComponent = MUINewspaperOutlinedIcon;
