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

import { fireEvent, screen } from '@testing-library/react';
import {
  createExtensionTester,
  renderInTestApp,
} from '@backstage/frontend-test-utils';
import { NavContentBlueprint } from '@backstage/plugin-app-react';
import {
  SidebarItemBlueprint,
  SidebarItemGroupBlueprint,
} from '@red-hat-developer-hub/backstage-plugin-app-react';

import { appSidebarExtension } from './appSidebarModule';

// createExtensionTester resolves ids without a plugin namespace, so the
// subject becomes `nav-content:sidebar` instead of `nav-content:app/sidebar`.
const itemsInput = { id: 'nav-content:sidebar', input: 'items' } as const;
const groupsInput = { id: 'nav-content:sidebar', input: 'groups' } as const;

describe('appSidebarExtension', () => {
  it('is a nav-content extension named sidebar', () => {
    const spec = JSON.parse(JSON.stringify(appSidebarExtension));

    expect(spec.kind).toBe('nav-content');
    expect(spec.name).toBe('sidebar');
    expect(spec.attachTo).toEqual({ id: 'app/nav', input: 'content' });
  });

  it('renders contributed items and groups ordered by priority', async () => {
    const tester = createExtensionTester(appSidebarExtension)
      .add(
        SidebarItemBlueprint.make({
          attachTo: itemsInput,
          name: 'chat',
          params: { title: 'Chat', to: '/chat', priority: 10 },
        }),
      )
      .add(
        SidebarItemBlueprint.make({
          attachTo: itemsInput,
          name: 'users',
          params: { title: 'Users', to: '/users', group: 'admin' },
        }),
      )
      .add(
        SidebarItemGroupBlueprint.make({
          attachTo: groupsInput,
          name: 'admin',
          params: { id: 'admin', title: 'Administration', priority: -10 },
        }),
      )
      .add(
        SidebarItemBlueprint.make({
          attachTo: itemsInput,
          name: 'home',
          params: { title: 'Home', to: '/home', priority: 20 },
        }),
      );

    const Content = tester.get(NavContentBlueprint.dataRefs.component);
    await renderInTestApp(
      <Content
        items={[]}
        navItems={{
          take: () => undefined,
          rest: () => [],
          clone: () => ({} as any),
          withComponent: () => ({ take: () => null, rest: () => [] }),
        }}
      />,
    );

    const links = screen.getAllByRole('link');
    expect(links.map(l => l.textContent)).toEqual(['Home', 'Chat']);
    expect(screen.getByText('Administration')).toBeInTheDocument();
    fireEvent.mouseEnter(screen.getByTestId('item-with-submenu'));
    expect(screen.getByText('Users')).toBeInTheDocument();
  });
});
