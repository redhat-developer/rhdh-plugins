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

import translationsModuleDefault from './bulkImportTranslationsModuleExport';
import bulkImportPlugin, { bulkImportTranslationsModule } from './index';

describe('bulk-import NFS exports', () => {
  it('should export a translations module as a FrontendModule', () => {
    expect(bulkImportTranslationsModule).toBeDefined();
    expect(bulkImportTranslationsModule.$$type).toBe(
      '@backstage/FrontendModule',
    );
  });

  it('should export the translations module as default for NFS discovery', () => {
    expect(translationsModuleDefault).toBe(bulkImportTranslationsModule);
  });
});

describe('bulk-import NFS wiring', () => {
  // The assertions above hold against a plugin that contributes no UI at all:
  // the translations module is a separate FrontendModule, so emptying the
  // plugin's own `extensions` leaves them green while Bulk Import disappears
  // from the app with no error and no warning.
  it('declares the path, title and a route ref for the page', () => {
    const tester = createExtensionTester(
      bulkImportPlugin.getExtension('page:bulk-import'),
    );

    expect(tester.get(coreExtensionData.routePath)).toBe('/bulk-import');
    expect(tester.get(coreExtensionData.title)).toBe('Bulk import');
    // Presence, not identity: createFrontendPlugin re-wraps route refs, so the
    // object here is not the one `routes.ts` exported. `toBe(rootRouteRef)`
    // passes for a plugin with a single route and fails for this one, which is
    // a property of the wrapping rather than of the plugin being correct.
    expect(tester.get(coreExtensionData.routeRef)).toBeDefined();
  });

  it('registers the page and the API extension on the plugin', () => {
    // The API carries no extension data to assert, so this lookup is the only
    // thing standing between it and being dropped from `extensions` — at which
    // point the page renders and every request it makes fails.
    expect(bulkImportPlugin.getExtension('page:bulk-import')).toBeDefined();
    expect(bulkImportPlugin.getExtension('api:bulk-import')).toBeDefined();
  });

  it('keeps both routes the app resolves links against', () => {
    // `tasks` is a subRouteRef; dropping it breaks the import-history links
    // without touching the page, which the assertions above would not notice.
    expect(bulkImportPlugin.routes.root).toBeDefined();
    expect(bulkImportPlugin.routes.tasks).toBeDefined();
  });
});
