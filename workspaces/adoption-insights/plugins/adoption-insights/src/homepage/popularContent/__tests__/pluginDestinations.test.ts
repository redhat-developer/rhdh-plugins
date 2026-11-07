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
  parsePluginDestinations,
  resolvePluginDestination,
} from '../pluginDestinations';

describe('resolvePluginDestination', () => {
  it('resolves known OOTB and supported overlay plugins', () => {
    expect(resolvePluginDestination('catalog-graph')).toBe('/catalog-graph');
    expect(resolvePluginDestination('bulk-import')).toBe('/bulk-import');
    expect(resolvePluginDestination('Bulk Import')).toBe('/bulk-import');
    expect(resolvePluginDestination('rbac')).toBe('/rbac');
    expect(resolvePluginDestination('tech-radar')).toBe('/tech-radar');
  });

  it('lets admin overrides win over the built-in map', () => {
    expect(
      resolvePluginDestination('catalog', { catalog: '/custom-catalog' }),
    ).toBe('/custom-catalog');
    expect(
      resolvePluginDestination('my-plugin', { 'my-plugin': '/my-plugin' }),
    ).toBe('/my-plugin');
  });

  it('returns undefined for unknown plugins without overrides', () => {
    expect(resolvePluginDestination('mystery')).toBeUndefined();
  });
});

describe('parsePluginDestinations', () => {
  it('normalizes ids and keeps absolute paths', () => {
    expect(
      parsePluginDestinations({
        'My Plugin': ' /my-plugin ',
        catalog: '/catalog-alt',
      }),
    ).toEqual({
      'my-plugin': '/my-plugin',
      catalog: '/catalog-alt',
    });
  });

  it('drops invalid entries', () => {
    expect(
      parsePluginDestinations({
        ok: '/ok',
        bad: 'relative',
        empty: '',
        num: 1,
      }),
    ).toEqual({ ok: '/ok' });
    expect(parsePluginDestinations(null)).toBeUndefined();
    expect(parsePluginDestinations([])).toBeUndefined();
  });
});
