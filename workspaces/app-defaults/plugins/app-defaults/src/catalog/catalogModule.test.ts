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

// Capture the config passed to createFrontendModule so the module wiring can be
// asserted without instantiating a whole app.
jest.mock('@backstage/frontend-plugin-api', () => ({
  ...jest.requireActual('@backstage/frontend-plugin-api'),
  createFrontendModule: jest.fn((config: unknown) => ({ config })),
}));

import { catalogModule } from './catalogModule';

describe('catalogModule', () => {
  const { config } = catalogModule as unknown as {
    config: { pluginId: string; extensions: unknown[] };
  };

  it('is a module for the catalog plugin', () => {
    expect(config.pluginId).toBe('catalog');
  });

  it('registers the localized entity header layout on the entity page', () => {
    expect(config.extensions).toHaveLength(1);

    const spec = JSON.parse(JSON.stringify(config.extensions[0]));
    expect(spec.kind).toBe('entity-header-layout');
    expect(spec.name).toBe('localized');
    expect(spec.attachTo).toEqual({
      id: 'page:catalog/entity',
      input: 'headerLayouts',
    });
  });
});
