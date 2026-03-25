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
  createRouteRef,
  createFrontendPlugin,
  PageBlueprint,
} from '@backstage/frontend-plugin-api';
import { RiPuzzleLine } from '@remixicon/react';

const rootRouteRef = createRouteRef();

const mui4TestPage = PageBlueprint.make({
  params: {
    path: '/mui4-tests',
    title: 'MUI v4 Tests',
    icon: <RiPuzzleLine />,
    routeRef: rootRouteRef,
    loader: async () =>
      import('../components/MUI4TestPage').then(m => <m.MUI4TestPage />),
  },
});

/*
 * @alpha
 */
const plugin = createFrontendPlugin({
  pluginId: 'mui4-test',
  info: { packageJson: () => import('../../package.json') },
  extensions: [mui4TestPage],
  routes: { root: rootRouteRef },
});

export default plugin;
