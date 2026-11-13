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

import { createExtensionTester } from '@backstage/frontend-test-utils';
import { IconBundleBlueprint } from '@backstage/plugin-app-react';

import { commonIcons } from './commonIcons';
import { commonIconsExtension } from './commonIconsExtension';

const expectedIconIds = [
  'home',
  'group',
  'category',
  'extension',
  'school',
  'add',
  'list',
  'layers',
  'star',
  'favorite',
  'bookmarks',
  'queryStats',
  'query_stats',
  'chart',
  'business',
  'storefront',
  'folder',
  'cloud',
  'monitor',
  'feedback',
  'validate',
  'security',
  'help',
  'support',
  'quickstart',
  'waving_hand',
  'notifications',
  'manageAccounts',
  'manage_accounts',
  'logout',
  'developerHub',
  'developer_hub',
  'account',
  'admin',
];

describe('commonIconsExtension', () => {
  it('is an icon-bundle attached to api:app/icons', () => {
    const extensionData = JSON.parse(JSON.stringify(commonIconsExtension));

    expect(extensionData.kind).toBe('icon-bundle');
    expect(extensionData.name).toBe('common');
    expect(extensionData.attachTo).toEqual({
      id: 'api:app/icons',
      input: 'icons',
    });
  });

  it('registers the same IDs as the legacy CommonIcons catalog', () => {
    const tester = createExtensionTester(commonIconsExtension);
    const icons = tester.get(IconBundleBlueprint.dataRefs.icons);

    expect(Object.keys(icons).sort()).toEqual([...expectedIconIds].sort());
  });

  it('registers the custom developerHub icon', () => {
    const tester = createExtensionTester(commonIconsExtension);
    const icons = tester.get(IconBundleBlueprint.dataRefs.icons);

    expect(icons.developerHub).toBe(commonIcons.developerHub);
    expect(icons.developerHub).toBeDefined();
  });

  it('aliases Material ligature ids to the same glyphs as canonical ids', () => {
    const tester = createExtensionTester(commonIconsExtension);
    const icons = tester.get(IconBundleBlueprint.dataRefs.icons);

    expect(icons.waving_hand).toBe(icons.quickstart);
    expect(icons.manage_accounts).toBe(icons.manageAccounts);
    expect(icons.query_stats).toBe(icons.queryStats);
    expect(icons.developer_hub).toBe(icons.developerHub);
  });
});
