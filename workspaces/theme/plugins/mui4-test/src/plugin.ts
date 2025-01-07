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
  createPlugin,
  createRoutableExtension,
} from '@backstage/core-plugin-api';

import { rootRouteRef } from './routes';

/**
 * @public
 */
export const mui4TestPlugin = createPlugin({
  id: 'mui4-test',
  routes: {
    root: rootRouteRef,
  },
});

/**
 * @public
 */
export const MUI4TestPage = mui4TestPlugin.provide(
  createRoutableExtension({
    name: 'MUI4TestPage',
    component: () =>
      import('./components/MUI4TestPage').then(m => m.MUI4TestPage),
    mountPoint: rootRouteRef,
  }),
);
