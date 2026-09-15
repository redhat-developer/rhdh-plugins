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

import { SidebarElementBlueprint } from './SidebarElementBlueprint';
import { sidebarElementDataRef } from './sidebarElementDataRef';

const Element = () => null;

describe('SidebarElementBlueprint', () => {
  it('attaches to the sidebar elements input', () => {
    const extension = SidebarElementBlueprint.make({
      name: 'notifications',
      params: { component: Element },
    });
    const spec = JSON.parse(JSON.stringify(extension));

    expect(spec.kind).toBe('sidebar-element');
    expect(spec.name).toBe('notifications');
    expect(spec.attachTo).toEqual({
      id: 'nav-content:app/sidebar',
      input: 'elements',
    });
  });

  it('yields the element data with the extension id', () => {
    const tester = createExtensionTester(
      SidebarElementBlueprint.make({
        name: 'notifications',
        params: { component: Element, to: '/notifications', priority: -50 },
      }),
    );

    expect(tester.get(sidebarElementDataRef)).toEqual({
      id: 'sidebar-element:notifications',
      component: Element,
      to: '/notifications',
      priority: -50,
    });
  });

  it('lets app-config override to and priority', () => {
    const tester = createExtensionTester(
      SidebarElementBlueprint.make({
        name: 'notifications',
        params: { component: Element, to: '/notifications', priority: -50 },
      }),
      { config: { to: '/inbox', priority: 7 } },
    );

    expect(tester.get(sidebarElementDataRef)).toMatchObject({
      to: '/inbox',
      priority: 7,
    });
  });
});
