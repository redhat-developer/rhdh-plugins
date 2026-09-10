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

import {
  useEffect,
  useState,
  type ComponentProps,
  type ComponentType,
} from 'react';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MenuItem from '@mui/material/MenuItem';
import { renderInTestApp } from '@backstage/test-utils';

import { GlobalHeaderProvider } from '../extensions/GlobalHeaderContext';
import type { GlobalHeaderMenuItemData } from '../types';
import { GlobalHeaderDropdown } from './GlobalHeaderDropdown';

jest.mock('../hooks/useTranslation', () => {
  const { mockUseTranslation } = require('../test-utils/mockTranslations');
  return { useTranslation: mockUseTranslation };
});

jest.mock('../components/Trans', () => {
  const { MockTrans } = require('../test-utils/mockTranslations');
  return { Trans: MockTrans };
});

const emptyState = <div data-testid="empty-state">No items</div>;

const renderDropdown = (
  menuItems: GlobalHeaderMenuItemData[],
  props: Partial<ComponentProps<typeof GlobalHeaderDropdown>> = {},
) =>
  renderInTestApp(
    <GlobalHeaderProvider components={[]} menuItems={menuItems}>
      <GlobalHeaderDropdown
        target="help"
        buttonContent={<span>Help</span>}
        emptyState={emptyState}
        {...props}
      />
    </GlobalHeaderProvider>,
  );

/** Flush React.lazy() of dropdown content under fake timers. */
const flushLazyMenu = async () => {
  await act(async () => {
    await Promise.resolve();
  });
};

const openMenu = async () => {
  fireEvent.click(screen.getByRole('button', { name: /help/i }));
  await flushLazyMenu();
};

describe('GlobalHeaderDropdown', () => {
  beforeEach(() => {
    jest.useRealTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('returns null when there are no menu items and no emptyState', async () => {
    const { container } = await renderInTestApp(
      <GlobalHeaderProvider components={[]} menuItems={[]}>
        <GlobalHeaderDropdown target="help" buttonContent={<span>Help</span>} />
      </GlobalHeaderProvider>,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('renders the trigger when emptyState is provided with no menu items', async () => {
    await renderDropdown([]);

    expect(screen.getByRole('button', { name: /help/i })).toBeInTheDocument();
  });

  it('shows emptyState immediately when there are no contributions', async () => {
    await renderDropdown([]);
    await openMenu();

    expect(await screen.findByTestId('empty-state')).toBeInTheDocument();
  });

  it('renders data-driven menu items', async () => {
    const menuItems: GlobalHeaderMenuItemData[] = [
      {
        target: 'help',
        type: 'data',
        title: 'Documentation',
        link: '/docs',
        priority: 10,
      },
    ];

    await renderDropdown(menuItems);
    await openMenu();

    expect(
      await screen.findByRole('menuitem', { name: /documentation/i }),
    ).toBeInTheDocument();
    expect(screen.queryByTestId('empty-state')).not.toBeInTheDocument();
  }, 15000);

  it('renders component-type menu items', async () => {
    const SupportItem: ComponentType<{ handleClose?: () => void }> = () => (
      <MenuItem>Support</MenuItem>
    );

    const menuItems: GlobalHeaderMenuItemData[] = [
      {
        target: 'help',
        type: 'component',
        component: SupportItem,
        priority: 10,
      },
    ];

    await renderDropdown(menuItems);
    await openMenu();

    expect(
      await screen.findByRole('menuitem', { name: /support/i }),
    ).toBeInTheDocument();
  });

  it('ignores menu items for other targets', async () => {
    const menuItems: GlobalHeaderMenuItemData[] = [
      {
        target: 'create',
        type: 'data',
        title: 'Create template',
        link: '/create',
        priority: 10,
      },
    ];

    await renderDropdown(menuItems);
    await openMenu();

    expect(await screen.findByTestId('empty-state')).toBeInTheDocument();
    expect(
      screen.queryByRole('menuitem', { name: /create template/i }),
    ).not.toBeInTheDocument();
  });

  describe('trackValidity', () => {
    it('shows emptyState after settle timeout when contributed items render nothing', async () => {
      jest.useFakeTimers();
      const user = userEvent.setup({
        advanceTimers: jest.advanceTimersByTime,
      });

      const NullItem: ComponentType = () => null;
      const menuItems: GlobalHeaderMenuItemData[] = [
        {
          target: 'help',
          type: 'component',
          component: NullItem,
          priority: 10,
        },
      ];

      await renderDropdown(menuItems, { trackValidity: true });
      await user.click(screen.getByRole('button', { name: /help/i }));
      await flushLazyMenu();

      expect(screen.queryByTestId('empty-state')).not.toBeInTheDocument();

      await act(async () => {
        jest.advanceTimersByTime(500);
      });

      expect(await screen.findByTestId('empty-state')).toBeInTheDocument();
    });

    it('keeps showing menu content when a menuitem is present synchronously', async () => {
      jest.useFakeTimers();
      const user = userEvent.setup({
        advanceTimers: jest.advanceTimersByTime,
      });

      const SupportItem: ComponentType = () => <MenuItem>Support</MenuItem>;
      const menuItems: GlobalHeaderMenuItemData[] = [
        {
          target: 'help',
          type: 'component',
          component: SupportItem,
          priority: 10,
        },
      ];

      await renderDropdown(menuItems, { trackValidity: true });
      await user.click(screen.getByRole('button', { name: /help/i }));
      await flushLazyMenu();

      expect(
        await screen.findByRole('menuitem', { name: /support/i }),
      ).toBeInTheDocument();

      await act(async () => {
        jest.advanceTimersByTime(1500);
      });

      expect(screen.queryByTestId('empty-state')).not.toBeInTheDocument();
      expect(
        screen.getByRole('menuitem', { name: /support/i }),
      ).toBeInTheDocument();
    });

    it('does not show emptyState when a lazy item appears before settle timeout', async () => {
      jest.useFakeTimers();
      const user = userEvent.setup({
        advanceTimers: jest.advanceTimersByTime,
      });

      const LazySupport: ComponentType = () => {
        const [ready, setReady] = useState(false);
        useEffect(() => {
          const id = window.setTimeout(() => setReady(true), 100);
          return () => window.clearTimeout(id);
        }, []);
        if (!ready) return null;
        return <MenuItem>Support</MenuItem>;
      };

      const menuItems: GlobalHeaderMenuItemData[] = [
        {
          target: 'help',
          type: 'component',
          component: LazySupport,
          priority: 10,
        },
      ];

      await renderDropdown(menuItems, { trackValidity: true });
      await user.click(screen.getByRole('button', { name: /help/i }));
      await flushLazyMenu();

      await act(async () => {
        jest.advanceTimersByTime(100);
      });

      expect(
        await screen.findByRole('menuitem', { name: /support/i }),
      ).toBeInTheDocument();

      await act(async () => {
        jest.advanceTimersByTime(1500);
      });

      expect(screen.queryByTestId('empty-state')).not.toBeInTheDocument();
    });

    it('recovers from emptyState when a lazy item appears after settle timeout', async () => {
      jest.useFakeTimers();
      const user = userEvent.setup({
        advanceTimers: jest.advanceTimersByTime,
      });

      const VeryLazySupport: ComponentType = () => {
        const [ready, setReady] = useState(false);
        useEffect(() => {
          const id = window.setTimeout(() => setReady(true), 800);
          return () => window.clearTimeout(id);
        }, []);
        if (!ready) return null;
        return <MenuItem>Support</MenuItem>;
      };

      const menuItems: GlobalHeaderMenuItemData[] = [
        {
          target: 'help',
          type: 'component',
          component: VeryLazySupport,
          priority: 10,
        },
      ];

      await renderDropdown(menuItems, { trackValidity: true });
      await user.click(screen.getByRole('button', { name: /help/i }));
      await flushLazyMenu();

      await act(async () => {
        jest.advanceTimersByTime(500);
      });

      expect(await screen.findByTestId('empty-state')).toBeInTheDocument();

      await act(async () => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(screen.queryByTestId('empty-state')).not.toBeInTheDocument();
      });
      expect(
        screen.getByRole('menuitem', { name: /support/i }),
      ).toBeInTheDocument();
    });

    it('hides contributed content while emptyState is shown, without unmounting it', async () => {
      jest.useFakeTimers();
      const user = userEvent.setup({
        advanceTimers: jest.advanceTimersByTime,
      });

      let unmounted = false;
      const PersistentNullItem: ComponentType = () => {
        useEffect(() => {
          return () => {
            unmounted = true;
          };
        }, []);
        return <div data-testid="persistent-null-host" />;
      };

      const menuItems: GlobalHeaderMenuItemData[] = [
        {
          target: 'help',
          type: 'component',
          component: PersistentNullItem,
          priority: 10,
        },
      ];

      await renderDropdown(menuItems, { trackValidity: true });
      await user.click(screen.getByRole('button', { name: /help/i }));
      await flushLazyMenu();

      await act(async () => {
        jest.advanceTimersByTime(500);
      });

      expect(await screen.findByTestId('empty-state')).toBeInTheDocument();
      expect(screen.getByTestId('persistent-null-host')).not.toBeVisible();
      expect(unmounted).toBe(false);
    });
  });

  it('supports arrow-key navigation between visible menu items', async () => {
    const menuItems: GlobalHeaderMenuItemData[] = [
      {
        target: 'help',
        type: 'data',
        title: 'First item',
        link: '/first',
        priority: 20,
      },
      {
        target: 'help',
        type: 'data',
        title: 'Second item',
        link: '/second',
        priority: 10,
      },
    ];

    await renderDropdown(menuItems);
    await openMenu();

    const firstItem = await screen.findByRole('menuitem', {
      name: /first item/i,
    });
    const secondItem = screen.getByRole('menuitem', { name: /second item/i });

    firstItem.focus();
    expect(firstItem).toHaveFocus();

    await userEvent.keyboard('{ArrowDown}');
    expect(secondItem).toHaveFocus();
  });

  it('forwards tooltip and icon button props to the trigger', async () => {
    await renderDropdown([], {
      isIconButton: true,
      tooltip: 'Help menu',
      buttonContent: <span>icon</span>,
    });

    expect(
      screen.getByRole('button', { name: 'Help menu' }),
    ).toBeInTheDocument();
  });
});
