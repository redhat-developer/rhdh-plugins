/*
 * Copyright The Backstage Authors
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

import { extensionsApiRef, dynamicPluginsInfoApiRef } from './api';
import { extensionsPlugin } from './plugin';
import { allRoutes } from './routes';

describe('extensionsPlugin', () => {
  it('has plugin id extensions', () => {
    expect(extensionsPlugin.getId()).toEqual('extensions');
  });

  it('registers API factories for the backend client and dynamic plugins info', () => {
    const apiIds = Array.from(extensionsPlugin.getApis()).map(
      factory => factory.api.id,
    );

    expect(apiIds).toEqual(
      expect.arrayContaining([
        extensionsApiRef.id,
        dynamicPluginsInfoApiRef.id,
      ]),
    );
  });

  it('exposes catalog route refs', () => {
    expect(extensionsPlugin.routes.rootRouteRef).toBe(allRoutes.rootRouteRef);
    expect(extensionsPlugin.routes.pluginsRouteRef).toBe(
      allRoutes.pluginsRouteRef,
    );
    expect(extensionsPlugin.routes.packagesRouteRef).toBe(
      allRoutes.packagesRouteRef,
    );
  });
});
