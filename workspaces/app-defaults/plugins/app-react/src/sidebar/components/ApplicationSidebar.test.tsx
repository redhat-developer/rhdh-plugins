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

import { render, screen } from '@testing-library/react';

import type { NavContentNavItems } from '@backstage/plugin-app-react';

import { ApplicationSidebar } from './ApplicationSidebar';
import type { AppSidebarItem } from '../types';

// Mock @backstage/core-components to avoid context provider requirements.
// This lets us test our rendering logic without Backstage's sidebar providers.
jest.mock('@backstage/core-components', () => ({
  Sidebar: ({ children }: { children: React.ReactNode }) => (
    <nav data-testid="sidebar">{children}</nav>
  ),
  SidebarDivider: () => <hr data-testid="sidebar-divider" />,
  SidebarItem: ({ text, to }: { text: string; to?: string }) => (
    <div data-testid="sidebar-item" data-to={to}>
      {text}
    </div>
  ),
  SidebarScrollWrapper: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="sidebar-scroll-wrapper">{children}</div>
  ),
  SidebarSpace: () => <div data-testid="sidebar-space" />,
}));

function DummyIcon() {
  return <span>icon</span>;
}

function createMockNavItems(
  navItemsList: Array<{ id: string; title: string; href: string }> = [],
): NavContentNavItems {
  const taken = new Set<string>();

  const navItems: NavContentNavItems = {
    take(id: string) {
      const item = navItemsList.find(n => n.id === id);
      if (item && !taken.has(id)) {
        taken.add(id);
        return item as any;
      }
      return undefined;
    },
    rest() {
      return navItemsList.filter(n => !taken.has(n.id)) as any;
    },
    clone() {
      return createMockNavItems(navItemsList);
    },
    withComponent(Component: any) {
      return {
        take(id: string) {
          const item = navItems.take(id);
          return item ? <Component key={id} {...item} /> : null;
        },
        rest(opts?: { sortBy?: string }) {
          const remaining = navItems.rest();
          if (opts?.sortBy === 'title') {
            remaining.sort((a: any, b: any) => a.title.localeCompare(b.title));
          }
          return remaining.map((item: any) => (
            <Component key={item.id} {...item} />
          ));
        },
      };
    },
  };

  return navItems;
}

describe('ApplicationSidebar', () => {
  it('renders the sidebar structure', () => {
    const navItems = createMockNavItems();
    render(<ApplicationSidebar navItems={navItems} items={[]} />);

    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar-scroll-wrapper')).toBeInTheDocument();
  });

  it('renders nav items from the extension system', () => {
    const navItems = createMockNavItems([
      { id: 'page:catalog', title: 'Catalog', href: '/catalog' },
      { id: 'page:docs', title: 'Docs', href: '/docs' },
    ]);

    render(<ApplicationSidebar navItems={navItems} items={[]} />);

    expect(screen.getByText('Catalog')).toBeInTheDocument();
    expect(screen.getByText('Docs')).toBeInTheDocument();
  });

  it('renders contributed sidebar items', () => {
    const navItems = createMockNavItems();
    const items: AppSidebarItem[] = [
      { id: 'chat', title: 'Chat', icon: DummyIcon, to: '/chat' },
    ];

    render(<ApplicationSidebar navItems={navItems} items={items} />);

    expect(screen.getByText('Chat')).toBeInTheDocument();
  });

  it('sorts contributed items by priority descending', () => {
    const navItems = createMockNavItems();
    const items: AppSidebarItem[] = [
      { id: 'low', title: 'Low Priority', icon: DummyIcon, priority: 1 },
      { id: 'high', title: 'High Priority', icon: DummyIcon, priority: 10 },
      { id: 'mid', title: 'Mid Priority', icon: DummyIcon, priority: 5 },
    ];

    render(<ApplicationSidebar navItems={navItems} items={items} />);

    const sidebarItems = screen.getAllByTestId('sidebar-item');
    // contributed items should be sorted: High (10), Mid (5), Low (1)
    const contributedItems = sidebarItems.filter(el =>
      ['High Priority', 'Mid Priority', 'Low Priority'].includes(
        el.textContent ?? '',
      ),
    );
    expect(contributedItems[0]).toHaveTextContent('High Priority');
    expect(contributedItems[1]).toHaveTextContent('Mid Priority');
    expect(contributedItems[2]).toHaveTextContent('Low Priority');
  });

  it('does not render divider or space when no contributed items', () => {
    const navItems = createMockNavItems([
      { id: 'page:catalog', title: 'Catalog', href: '/catalog' },
    ]);

    render(<ApplicationSidebar navItems={navItems} items={[]} />);

    expect(screen.queryByTestId('sidebar-space')).not.toBeInTheDocument();
    expect(screen.queryByTestId('sidebar-divider')).not.toBeInTheDocument();
  });

  it('renders divider and space when contributed items exist', () => {
    const navItems = createMockNavItems();
    const items: AppSidebarItem[] = [
      { id: 'item', title: 'My Item', icon: DummyIcon },
    ];

    render(<ApplicationSidebar navItems={navItems} items={items} />);

    expect(screen.getByTestId('sidebar-space')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar-divider')).toBeInTheDocument();
  });

  it('renders items without optional to prop', () => {
    const navItems = createMockNavItems();
    const items: AppSidebarItem[] = [
      { id: 'action', title: 'Action Button', icon: DummyIcon },
    ];

    render(<ApplicationSidebar navItems={navItems} items={items} />);

    const actionItem = screen.getByText('Action Button');
    expect(actionItem).toBeInTheDocument();
    expect(
      actionItem.closest('[data-testid="sidebar-item"]'),
    ).not.toHaveAttribute('data-to');
  });

  it('renders items with default priority when not specified', () => {
    const navItems = createMockNavItems();
    const items: AppSidebarItem[] = [
      { id: 'no-priority', title: 'No Priority', icon: DummyIcon },
      {
        id: 'has-priority',
        title: 'Has Priority',
        icon: DummyIcon,
        priority: 5,
      },
    ];

    render(<ApplicationSidebar navItems={navItems} items={items} />);

    const sidebarItems = screen.getAllByTestId('sidebar-item');
    const contributedItems = sidebarItems.filter(el =>
      ['No Priority', 'Has Priority'].includes(el.textContent ?? ''),
    );
    // Has Priority (5) should come before No Priority (0)
    expect(contributedItems[0]).toHaveTextContent('Has Priority');
    expect(contributedItems[1]).toHaveTextContent('No Priority');
  });
});
