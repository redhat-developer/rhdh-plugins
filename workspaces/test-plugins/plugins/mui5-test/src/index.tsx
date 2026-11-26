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

/**
 * MUI v5 fixture plugin for theme / UI component testing.
 *
 * @packageDocumentation
 */

import { unstable_ClassNameGenerator as ClassNameGenerator } from '@mui/material/className';
import {
  createFrontendPlugin,
  createRouteRef,
  PageBlueprint,
} from '@backstage/frontend-plugin-api';
import { RiPuzzleLine } from '@remixicon/react';

ClassNameGenerator.configure(componentName => {
  return componentName.startsWith('v5-')
    ? componentName
    : `v5-${componentName}`;
});

export * from './plugin';

const rootRouteRef = createRouteRef();

const mui5TestPage = PageBlueprint.make({
  params: {
    path: '/mui5-tests',
    title: 'MUI v5 Tests',
    icon: <RiPuzzleLine />,
    routeRef: rootRouteRef,
    loader: async () =>
      import('./components/MUI5TestPage').then(m => <m.MUI5TestPage />),
  },
});

/**
 * MUI v5 fixture frontend plugin for the new frontend system.
 *
 * @public
 */
export default createFrontendPlugin({
  pluginId: 'mui5-test',
  info: { packageJson: () => import('../package.json') },
  extensions: [mui5TestPage],
  routes: { root: rootRouteRef },
});
