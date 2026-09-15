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
import { renderInTestApp } from '@backstage/frontend-test-utils';
import type {
  NavContentNavItem,
  NavContentNavItems,
} from '@backstage/plugin-app-react';

import { AppSidebar } from './AppSidebar';

const navItems = (items: NavContentNavItem[]): NavContentNavItems => ({
  take: () => undefined,
  rest: () => items,
  clone: () => navItems(items),
  withComponent: () => ({ take: () => null, rest: () => [] }),
});

const HomeIcon = () => <span data-testid="home-icon" />;

describe('AppSidebar', () => {
  it('renders items in priority order with links', async () => {
    await renderInTestApp(
      <AppSidebar
        items={[
          { id: 'low', title: 'Low', to: '/low', priority: -1 },
          {
            id: 'high',
            title: 'High',
            to: '/high',
            priority: 1,
            icon: HomeIcon,
          },
        ]}
        groups={[]}
      />,
    );

    const links = screen.getAllByRole('link');
    expect(links.map(l => l.textContent)).toEqual(['High', 'Low']);
    expect(links[0]).toHaveAttribute('href', '/high');
    expect(screen.getByTestId('home-icon')).toBeInTheDocument();
  });

  it('renders onClick items as buttons and invokes the handler', async () => {
    const onClick = jest.fn();
    await renderInTestApp(
      <AppSidebar
        items={[{ id: 'chat', title: 'Chat', onClick }]}
        groups={[]}
      />,
    );

    screen.getByRole('button', { name: 'Chat' }).click();
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('resolves string icons through the icons api', async () => {
    await renderInTestApp(
      <AppSidebar
        items={[{ id: 'a', title: 'Alpha', to: '/a', icon: 'star' }]}
        groups={[]}
      />,
    );

    // Unknown keys never break rendering: a fallback icon is always drawn.
    expect(screen.getByRole('link', { name: /Alpha/ })).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /Alpha/ }).querySelector('svg'),
    ).not.toBeNull();
  });

  it('renders groups with their items inside a submenu', async () => {
    await renderInTestApp(
      <AppSidebar
        items={[
          { id: 'users', title: 'Users', to: '/admin/users', group: 'admin' },
          { id: 'top', title: 'Top', to: '/top', priority: 5 },
        ]}
        groups={[{ id: 'admin', title: 'Administration' }]}
      />,
    );

    expect(screen.getByText('Top')).toBeInTheDocument();
    expect(screen.getByText('Administration')).toBeInTheDocument();
    // Submenu content is only mounted while the group entry is hovered.
    expect(screen.queryByText('Users')).not.toBeInTheDocument();
    fireEvent.mouseEnter(screen.getByTestId('item-with-submenu'));
    expect(screen.getByText('Users')).toBeInTheDocument();
  });

  it('skips groups without items and without a link', async () => {
    await renderInTestApp(
      <AppSidebar
        items={[]}
        groups={[
          { id: 'empty', title: 'Empty' },
          { id: 'linked', title: 'Linked', to: '/linked' },
        ]}
      />,
    );

    expect(screen.queryByText('Empty')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Linked/ })).toHaveAttribute(
      'href',
      '/linked',
    );
  });

  it('merges auto-discovered nav items', async () => {
    await renderInTestApp(
      <AppSidebar
        items={[{ id: 'chat', title: 'Chat', to: '/chat', priority: 1 }]}
        groups={[]}
        navItems={navItems([
          {
            node: { spec: { id: 'page:catalog' } },
            title: 'Catalog',
            href: '/catalog',
            icon: <span />,
          } as unknown as NavContentNavItem,
        ])}
      />,
    );

    const links = screen.getAllByRole('link');
    expect(links.map(l => l.textContent)).toEqual(['Chat', 'Catalog']);
  });
});
