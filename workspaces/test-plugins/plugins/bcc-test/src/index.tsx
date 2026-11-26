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
 * BCC fixture plugin for theme / UI component testing.
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

const bccTestPage = PageBlueprint.make({
  params: {
    path: '/bcc-tests',
    title: 'BCC Tests',
    icon: <RiPuzzleLine />,
    routeRef: rootRouteRef,
    loader: async () =>
      import('./components/BCCTestPage').then(m => <m.BCCTestPage />),
  },
});

/**
 * BCC fixture frontend plugin for the new frontend system.
 *
 * @public
 */
export default createFrontendPlugin({
  pluginId: 'bcc-test',
  info: { packageJson: () => import('../package.json') },
  extensions: [bccTestPage],
  routes: { root: rootRouteRef },
});
