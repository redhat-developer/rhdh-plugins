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
  configApiRef,
  createApiFactory,
  createFrontendModule,
  discoveryApiRef,
  identityApiRef,
  ApiBlueprint,
  PageBlueprint,
} from '@backstage/frontend-plugin-api';
import { SidebarElementBlueprint } from '@red-hat-developer-hub/backstage-plugin-app-react';
import SchoolIcon from '@mui/icons-material/School';

import {
  LearningPathApiClient,
  learningPathApiRef,
} from './api/LearningPathApiClient';
import { LearningPathsSidebarItem } from './components/LearningPathsSidebarItem';
import { learningPathsRouteRef } from './routes';

const learningPathsApi = ApiBlueprint.make({
  name: 'learning-paths',
  params: defineParams =>
    defineParams(
      createApiFactory({
        api: learningPathApiRef,
        deps: {
          discoveryApi: discoveryApiRef,
          configApi: configApiRef,
          identityApi: identityApiRef,
        },
        factory: ({ discoveryApi, configApi, identityApi }) =>
          new LearningPathApiClient({ discoveryApi, configApi, identityApi }),
      }),
    ),
});

const learningPathsPage = PageBlueprint.make({
  name: 'learning-paths',
  params: {
    title: 'Learning Paths',
    icon: <SchoolIcon />,
    path: '/learning-paths',
    routeRef: learningPathsRouteRef,
    loader: () =>
      import('./components/LearningPathsPage').then(m => (
        <m.LearningPathsPage />
      )),
  },
});

/**
 * Custom sidebar element for the Learning Paths page. Its `to` matches the
 * page path, so it replaces the plain auto-discovered nav item with the
 * localized {@link LearningPathsSidebarItem}.
 */
const learningPathsSidebarItem = SidebarElementBlueprint.make({
  name: 'learning-paths',
  params: {
    component: LearningPathsSidebarItem,
    to: '/learning-paths',
  },
});

/**
 * RHDH Learning Paths page and API for the new frontend system (`pluginId: app`).
 *
 * @public
 */
export const learningPathsModule = createFrontendModule({
  pluginId: 'app',
  extensions: [learningPathsApi, learningPathsPage, learningPathsSidebarItem],
});
