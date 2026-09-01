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
import { coreExtensionData } from '@backstage/frontend-plugin-api';
import { createExtensionTester } from '@backstage/frontend-test-utils';

import plugin, { adoptionInsightsTranslationsModule } from './alpha';
import translationsModuleDefault from './adoptionInsightsTranslationsModuleExport';
import { rootRouteRef } from './routes';

describe('adoption-insights alpha', () => {
  it('should export a valid frontend plugin', () => {
    expect(plugin).toBeDefined();
    expect(plugin.$$type).toBe('@backstage/FrontendPlugin');
  });

  it('should have the correct plugin id', () => {
    expect(plugin.id).toBe('adoption-insights');
  });

  it('should have routes defined', () => {
    expect(plugin.routes).toBeDefined();
    expect(plugin.routes).toHaveProperty('root');
  });

  it('should export a translations module targeting the app plugin', () => {
    expect(adoptionInsightsTranslationsModule).toBeDefined();
    expect(adoptionInsightsTranslationsModule.$$type).toBe(
      '@backstage/FrontendModule',
    );
  });

  it('should export the translations module as default for NFS discovery', () => {
    expect(translationsModuleDefault).toBe(adoptionInsightsTranslationsModule);
  });
});

describe('adoption-insights NFS wiring', () => {
  // Everything above stays green against a plugin that contributes nothing:
  // dropping the page from `extensions` leaves `$$type`, `id` and `routes`
  // untouched, and the app then boots clean with no Adoption Insights anywhere
  // — no error, no warning. These read the values the app actually resolves.
  it('declares the path, title and route ref the app renders the page under', () => {
    const tester = createExtensionTester(
      plugin.getExtension('page:adoption-insights'),
    );

    expect(tester.get(coreExtensionData.routePath)).toBe('/adoption-insights');
    expect(tester.get(coreExtensionData.title)).toBe('Adoption Insights');
    expect(tester.get(coreExtensionData.routeRef)).toBe(rootRouteRef);
  });

  it('registers the page and the API extension on the plugin', () => {
    // The API carries no extension data to assert, so this lookup is the only
    // thing standing between it and being dropped from `extensions` — at which
    // point the page renders and every request it makes fails.
    expect(plugin.getExtension('page:adoption-insights')).toBeDefined();
    expect(plugin.getExtension('api:adoption-insights')).toBeDefined();
  });
});
