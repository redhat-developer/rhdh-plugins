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

import { SidebarDivider, SidebarSpace } from '@backstage/core-components';
import { createExtensionTester } from '@backstage/frontend-test-utils';

import { SidebarDividerBlueprint } from './SidebarDividerBlueprint';
import { SidebarSpacerBlueprint } from './SidebarSpacerBlueprint';
import { sidebarElementDataRef } from './sidebarElementDataRef';

describe('SidebarDividerBlueprint', () => {
  it('attaches to the sidebar elements input', () => {
    const spec = JSON.parse(
      JSON.stringify(
        SidebarDividerBlueprint.make({ name: 'x', params: { priority: -1 } }),
      ),
    );

    expect(spec.kind).toBe('sidebar-divider');
    expect(spec.attachTo).toEqual({
      id: 'nav-content:app/sidebar',
      input: 'elements',
    });
  });

  it('yields a SidebarDivider element, with the priority overridable', () => {
    const tester = createExtensionTester(
      SidebarDividerBlueprint.make({ name: 'x', params: { priority: -1 } }),
      { config: { priority: -90 } },
    );

    expect(tester.get(sidebarElementDataRef)).toEqual({
      id: 'sidebar-divider:x',
      component: SidebarDivider,
      priority: -90,
    });
  });
});

describe('SidebarSpacerBlueprint', () => {
  it('attaches to the sidebar elements input', () => {
    const spec = JSON.parse(
      JSON.stringify(SidebarSpacerBlueprint.make({ name: 'x', params: {} })),
    );

    expect(spec.kind).toBe('sidebar-spacer');
    expect(spec.attachTo).toEqual({
      id: 'nav-content:app/sidebar',
      input: 'elements',
    });
  });

  it('yields a SidebarSpace element with the given priority', () => {
    const tester = createExtensionTester(
      SidebarSpacerBlueprint.make({ name: 'x', params: { priority: -30 } }),
    );

    expect(tester.get(sidebarElementDataRef)).toEqual({
      id: 'sidebar-spacer:x',
      component: SidebarSpace,
      priority: -30,
    });
  });
});
