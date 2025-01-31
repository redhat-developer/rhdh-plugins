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
  createComponentExtension,
  createPlugin,
} from '@backstage/core-plugin-api';

/**
 * @public
 */
export const applicationListenerTestPlugin = createPlugin({
  id: 'application-listener-test',
});

/**
 * @public
 */
export const CrashListener = applicationListenerTestPlugin.provide(
  createComponentExtension({
    name: 'CrashListener',
    component: {
      lazy: () =>
        import('./components/CrashListener').then(m => m.CrashListener),
    },
  }),
);

/**
 * @public
 */
export const LocationListener = applicationListenerTestPlugin.provide(
  createComponentExtension({
    name: 'LocationListener',
    component: {
      lazy: () =>
        import('./components/LocationListener').then(m => m.LocationListener),
    },
  }),
);
