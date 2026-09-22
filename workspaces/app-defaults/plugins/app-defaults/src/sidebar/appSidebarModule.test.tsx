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
  SidebarElementBlueprint,
  SidebarItemBlueprint,
  SidebarItemGroupBlueprint,
} from '@red-hat-developer-hub/backstage-plugin-app-react';

import { appSidebarExtension } from './appSidebarModule';

// createExtensionTester resolves ids without a plugin namespace, so the
// subject becomes `nav-content:sidebar` instead of `nav-content:app/sidebar`.
const itemsInput = { id: 'nav-content:sidebar', input: 'items' } as const;
const groupsInput = { id: 'nav-content:sidebar', input: 'groups' } as const;
const elementsInput = {
  id: 'nav-content:sidebar',
  input: 'elements',
} as const;

const CustomElement = () => <button type="button">Custom</button>;

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
      )
      .add(
        SidebarElementBlueprint.make({
          attachTo: elementsInput,
          name: 'custom',
          params: { component: CustomElement, priority: 15 },
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

    const nav = screen.getByRole('navigation');
    const texts = Array.from(nav.querySelectorAll('a, button')).map(
      el => el.textContent,
    );
    expect(texts.slice(0, 3)).toEqual(['Home', 'Custom', 'Chat']);
    expect(screen.queryByText('Users')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Administration/ }));
    expect(screen.getByText('Users')).toBeInTheDocument();
  });
});
