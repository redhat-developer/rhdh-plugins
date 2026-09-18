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

import { SidebarItemBlueprint } from './SidebarItemBlueprint';
import { sidebarItemDataRef } from './sidebarItemDataRef';

const Icon = () => null;

describe('SidebarItemBlueprint', () => {
  it('attaches to the sidebar items input', () => {
    const extension = SidebarItemBlueprint.make({
      name: 'dashboard',
      params: { title: 'Dashboard', to: '/dashboard' },
    });
    const spec = JSON.parse(JSON.stringify(extension));

    expect(spec.kind).toBe('sidebar-item');
    expect(spec.name).toBe('dashboard');
    expect(spec.attachTo).toEqual({
      id: 'nav-content:app/sidebar',
      input: 'items',
    });
  });

  it('yields the item data with the extension id', () => {
    const onClick = jest.fn();
    const tester = createExtensionTester(
      SidebarItemBlueprint.make({
        name: 'dashboard',
        params: {
          title: 'Dashboard',
          icon: Icon,
          to: '/dashboard',
          onClick,
          priority: 10,
          group: 'admin',
        },
      }),
    );

    expect(tester.get(sidebarItemDataRef)).toEqual({
      id: 'sidebar-item:dashboard',
      title: 'Dashboard',
      icon: Icon,
      to: '/dashboard',
      onClick,
      priority: 10,
      group: 'admin',
    });
  });

  it('passes requiresRoute through and lets app-config override it', () => {
    const guarded = createExtensionTester(
      SidebarItemBlueprint.make({
        name: 'rbac',
        params: { title: 'RBAC', to: '/rbac', requiresRoute: true },
      }),
    );
    expect(guarded.get(sidebarItemDataRef)).toMatchObject({
      requiresRoute: true,
    });

    const overridden = createExtensionTester(
      SidebarItemBlueprint.make({
        name: 'rbac',
        params: { title: 'RBAC', to: '/rbac', requiresRoute: true },
      }),
      { config: { requiresRoute: false } },
    );
    expect(overridden.get(sidebarItemDataRef)).toMatchObject({
      requiresRoute: false,
    });
  });

  it('lets app-config override title, icon, to, priority and group', () => {
    const tester = createExtensionTester(
      SidebarItemBlueprint.make({
        name: 'dashboard',
        params: {
          title: 'Dashboard',
          icon: Icon,
          to: '/dashboard',
          priority: 10,
          group: 'admin',
        },
      }),
      {
        config: {
          title: 'Overview',
          icon: 'home',
          to: '/overview',
          priority: 99,
          group: 'tools',
        },
      },
    );

    expect(tester.get(sidebarItemDataRef)).toMatchObject({
      title: 'Overview',
      icon: 'home',
      to: '/overview',
      priority: 99,
      group: 'tools',
    });
  });
});
