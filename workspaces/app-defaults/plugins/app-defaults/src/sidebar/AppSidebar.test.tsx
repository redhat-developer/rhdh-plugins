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

import { fireEvent, screen, waitFor } from '@testing-library/react';
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

  it('renders inline groups collapsed and expands them on click', async () => {
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
    expect(screen.queryByText('Users')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Administration/ }));
    expect(screen.getByRole('link', { name: /Users/ })).toHaveAttribute(
      'href',
      '/admin/users',
    );

    fireEvent.click(screen.getByRole('button', { name: /Administration/ }));
    await waitFor(() =>
      expect(screen.queryByText('Users')).not.toBeInTheDocument(),
    );
  });

  it('starts an inline group expanded when the route matches an item', async () => {
    await renderInTestApp(
      <AppSidebar
        items={[
          { id: 'users', title: 'Users', to: '/admin/users', group: 'admin' },
        ]}
        groups={[{ id: 'admin', title: 'Administration' }]}
      />,
      { initialRouteEntries: ['/admin/users/42'] },
    );

    expect(screen.getByText('Users')).toBeInTheDocument();
  });

  it('renders an inline group with a link as a link that also toggles', async () => {
    await renderInTestApp(
      <AppSidebar
        items={[
          { id: 'users', title: 'Users', to: '/admin/users', group: 'admin' },
        ]}
        groups={[{ id: 'admin', title: 'Administration', to: '/admin' }]}
      />,
    );

    const header = screen.getByRole('link', { name: /Administration/ });
    expect(header).toHaveAttribute('href', '/admin');
    fireEvent.click(header);
    expect(screen.getByText('Users')).toBeInTheDocument();
  });

  it('renders flyout groups with their items inside a hover submenu', async () => {
    await renderInTestApp(
      <AppSidebar
        items={[
          { id: 'users', title: 'Users', to: '/admin/users', group: 'admin' },
        ]}
        groups={[{ id: 'admin', title: 'Administration', variant: 'flyout' }]}
      />,
    );

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

  it('renders custom elements in their priority slot', async () => {
    const Custom = () => <button type="button">Custom element</button>;
    await renderInTestApp(
      <AppSidebar
        items={[
          { id: 'top', title: 'Top', to: '/top', priority: 10 },
          { id: 'bottom', title: 'Bottom', to: '/bottom', priority: -10 },
        ]}
        groups={[]}
        elements={[{ id: 'custom', component: Custom, priority: 0 }]}
      />,
    );

    const nav = screen.getByRole('navigation');
    const texts = Array.from(nav.querySelectorAll('a, button')).map(
      el => el.textContent,
    );
    expect(texts).toEqual(['Top', 'Custom element', 'Bottom']);
  });

  it('contains a failing custom element behind an error boundary', async () => {
    const Broken = () => {
      throw new Error('boom');
    };
    // Silence the expected React error boundary logging for this render.
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    try {
      await renderInTestApp(
        <AppSidebar
          items={[{ id: 'top', title: 'Top', to: '/top', priority: 10 }]}
          groups={[]}
          elements={[{ id: 'broken', component: Broken, priority: 0 }]}
        />,
      );
    } finally {
      errorSpy.mockRestore();
    }

    // The rest of the sidebar still renders even though the element threw.
    expect(screen.getByRole('link', { name: 'Top' })).toBeInTheDocument();
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
