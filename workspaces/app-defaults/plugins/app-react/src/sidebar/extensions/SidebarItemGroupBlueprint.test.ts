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

import { SidebarItemGroupBlueprint } from './SidebarItemGroupBlueprint';
import { sidebarItemGroupDataRef } from './sidebarItemGroupDataRef';

describe('SidebarItemGroupBlueprint', () => {
  it('attaches to the sidebar groups input', () => {
    const extension = SidebarItemGroupBlueprint.make({
      name: 'admin',
      params: { id: 'admin', title: 'Administration' },
    });
    const spec = JSON.parse(JSON.stringify(extension));

    expect(spec.kind).toBe('sidebar-item-group');
    expect(spec.name).toBe('admin');
    expect(spec.attachTo).toEqual({
      id: 'nav-content:app/sidebar',
      input: 'groups',
    });
  });

  it('yields the group data', () => {
    const tester = createExtensionTester(
      SidebarItemGroupBlueprint.make({
        name: 'admin',
        params: {
          id: 'admin',
          title: 'Administration',
          icon: 'admin',
          to: '/admin',
          priority: -10,
          submenu: 'flyout',
        },
      }),
    );

    expect(tester.get(sidebarItemGroupDataRef)).toEqual({
      id: 'admin',
      title: 'Administration',
      icon: 'admin',
      to: '/admin',
      priority: -10,
      submenu: 'flyout',
    });
  });

  it('lets app-config override title, icon, to, priority and submenu', () => {
    const tester = createExtensionTester(
      SidebarItemGroupBlueprint.make({
        name: 'admin',
        params: { id: 'admin', title: 'Administration', priority: -10 },
      }),
      {
        config: {
          title: 'Admin',
          icon: 'settings',
          to: '/x',
          priority: 5,
          submenu: 'flyout',
        },
      },
    );

    expect(tester.get(sidebarItemGroupDataRef)).toEqual({
      id: 'admin',
      title: 'Admin',
      icon: 'settings',
      to: '/x',
      priority: 5,
      submenu: 'flyout',
    });
  });
});
