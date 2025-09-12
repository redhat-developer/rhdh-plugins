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

import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderInTestApp } from '@backstage/test-utils';
import { Quickstart } from './Quickstart';
import { mockQuickstartItems } from './mockData';
import { filterQuickstartItemsByRole } from '../utils';

beforeEach(() => {
  localStorage.clear();
  jest.clearAllMocks();
});

describe('Quickstart', () => {
  const mockHandleDrawerClose = jest.fn();

  beforeEach(() => {
    mockHandleDrawerClose.mockClear();
  });

  const renderWithRole = async (role: string) => {
    const items = filterQuickstartItemsByRole(mockQuickstartItems, role);
    await renderInTestApp(
      <Quickstart
        quickstartItems={items}
        handleDrawerClose={mockHandleDrawerClose}
        isLoading={false}
      />,
    );
  };

  const expectHideButton = () => {
    expect(screen.getByRole('button', { name: 'Hide' })).toBeInTheDocument();
  };

  describe('Role-based item rendering', () => {
    it('renders admin-specific items and items with no roles', async () => {
      await renderWithRole('admin');

      // Admin-specific items should be visible
      expect(screen.getByText('Step 1 for Admin')).toBeInTheDocument();
      expect(screen.getByText('Step 2 for Admin')).toBeInTheDocument();

      // Items with no roles should also be visible (defaults to admin)
      expect(
        screen.getByText('Step 1 - No Roles Assigned'),
      ).toBeInTheDocument();
      expect(
        screen.getByText('Step 2 - No Roles Assigned'),
      ).toBeInTheDocument();

      // Developer items should not be visible
      expect(
        screen.queryByText('Step 1 for Developer'),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByText('Step 2 for Developer'),
      ).not.toBeInTheDocument();

      expectHideButton();
    });

    it('renders developer-specific items only', async () => {
      await renderWithRole('developer');

      // Developer-specific items should be visible
      expect(screen.getByText('Step 1 for Developer')).toBeInTheDocument();
      expect(screen.getByText('Step 2 for Developer')).toBeInTheDocument();

      // Admin items and no-role items should not be visible
      expect(screen.queryByText('Step 1 for Admin')).not.toBeInTheDocument();
      expect(screen.queryByText('Step 2 for Admin')).not.toBeInTheDocument();
      expect(
        screen.queryByText('Step 1 - No Roles Assigned'),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByText('Step 2 - No Roles Assigned'),
      ).not.toBeInTheDocument();

      expectHideButton();
    });
  });

  describe('Progress calculation with role-based items', () => {
    it('calculates progress correctly for admin items', async () => {
      await renderWithRole('admin');

      expect(screen.getByText('Not started')).toBeInTheDocument();

      // Complete first admin item
      const expandButtons = screen.getAllByRole('button', {
        name: /expand item/i,
      });
      fireEvent.click(expandButtons[0]);

      const cta = await screen.findByRole('button', { name: 'Start Now' });
      fireEvent.click(cta);

      await waitFor(() => {
        expect(screen.getByText('25% progress')).toBeInTheDocument();
      });

      // Complete second admin item
      fireEvent.click(expandButtons[1]);
      const cta2 = await screen.findByRole('button', { name: 'Continue' });
      fireEvent.click(cta2);

      await waitFor(() => {
        expect(screen.getByText('50% progress')).toBeInTheDocument();
      });
    });

    it('calculates progress correctly for developer items', async () => {
      await renderWithRole('developer');

      expect(screen.getByText('Not started')).toBeInTheDocument();

      // Complete first developer item
      const expandButtons = screen.getAllByRole('button', {
        name: /expand item/i,
      });
      fireEvent.click(expandButtons[0]);

      const cta = await screen.findByRole('button', { name: 'Start Now' });
      fireEvent.click(cta);

      await waitFor(() => {
        expect(screen.getByText('50% progress')).toBeInTheDocument();
      });

      // Complete second developer item
      fireEvent.click(expandButtons[1]);
      const cta2 = await screen.findByRole('button', { name: 'Continue' });
      fireEvent.click(cta2);

      await waitFor(() => {
        expect(screen.getByText('100% progress')).toBeInTheDocument();
      });
    });

    it('reads existing progress from localStorage for role-specific items', async () => {
      // Mark first admin item as complete
      localStorage.setItem('Step 1 for Admin-0', 'true');

      await renderWithRole('admin');

      expect(screen.getByText('25% progress')).toBeInTheDocument();
    });
  });

  describe('Component interaction', () => {
    it('calls handleDrawerClose when Hide button is clicked', async () => {
      await renderWithRole('admin');

      const hideBtn = screen.getByRole('button', { name: 'Hide' });
      fireEvent.click(hideBtn);

      expect(mockHandleDrawerClose).toHaveBeenCalledTimes(1);
    });
  });
});
