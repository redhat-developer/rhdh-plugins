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
import { QuickstartContent } from './QuickstartContent';
import { renderInTestApp } from '@backstage/test-utils';
import { mockQuickstartItems } from '../mockData';
import { filterQuickstartItemsByRole } from '../../utils';

jest.mock('@mui/material/Collapse', () => ({
  __esModule: true,
  default: ({ in: open, children }: any) => (open ? children : null),
}));

beforeEach(() => {
  localStorage.clear();
  jest.clearAllMocks();
});

describe('QuickstartContent', () => {
  const mockSetProgress = jest.fn();

  it('renders EmptyState when no items are passed', async () => {
    await renderInTestApp(
      <QuickstartContent
        quickstartItems={[]}
        setProgress={mockSetProgress}
        itemCount={0}
      />,
    );

    expect(
      screen.getByText('Quickstart content not available for your role.'),
    ).toBeInTheDocument();
  });

  it('renders all quickstart items for admin role', async () => {
    const adminItems = filterQuickstartItemsByRole(
      mockQuickstartItems,
      'admin',
    );

    await renderInTestApp(
      <QuickstartContent
        quickstartItems={adminItems}
        setProgress={mockSetProgress}
        itemCount={adminItems.length}
      />,
    );

    // Admin-specific items should be visible
    expect(screen.getByText('Step 1 for Admin')).toBeInTheDocument();
    expect(screen.getByText('Step 2 for Admin')).toBeInTheDocument();
    // Items with other roles should not be visible
    expect(screen.queryByText('Step 1 for Developer')).not.toBeInTheDocument();
    expect(screen.queryByText('Step 2 for Developer')).not.toBeInTheDocument();
  });

  it('treats items with no roles as admin items when rendering', async () => {
    // Using actual filtering logic: items with no roles default to admin
    const adminAndNoRoleItems = filterQuickstartItemsByRole(
      mockQuickstartItems,
      'admin',
    );

    await renderInTestApp(
      <QuickstartContent
        quickstartItems={adminAndNoRoleItems}
        setProgress={mockSetProgress}
        itemCount={adminAndNoRoleItems.length}
      />,
    );

    // Both admin items and no-role items should be visible
    expect(screen.getByText('Step 1 for Admin')).toBeInTheDocument();
    expect(screen.getByText('Step 2 for Admin')).toBeInTheDocument();
    expect(screen.getByText('Step 1 - No Roles Assigned')).toBeInTheDocument();
    expect(screen.getByText('Step 2 - No Roles Assigned')).toBeInTheDocument();

    // Developer items should not be visible
    expect(screen.queryByText('Step 1 for Developer')).not.toBeInTheDocument();
    expect(screen.queryByText('Step 2 for Developer')).not.toBeInTheDocument();
  });

  it('renders all quickstart items for developer role', async () => {
    const developerItems = filterQuickstartItemsByRole(
      mockQuickstartItems,
      'developer',
    );

    await renderInTestApp(
      <QuickstartContent
        quickstartItems={developerItems}
        setProgress={mockSetProgress}
        itemCount={developerItems.length}
      />,
    );

    // Developer-specific items should be visible
    expect(screen.getByText('Step 1 for Developer')).toBeInTheDocument();
    expect(screen.getByText('Step 2 for Developer')).toBeInTheDocument();
    // Items with other roles should not be visible
    expect(screen.queryByText('Step 1 for Admin')).not.toBeInTheDocument();
    expect(screen.queryByText('Step 2 for Admin')).not.toBeInTheDocument();
  });

  it('renders EmptyState when no quickstart items match the user role', async () => {
    const managerItems = filterQuickstartItemsByRole(
      mockQuickstartItems,
      'manager',
    );

    await renderInTestApp(
      <QuickstartContent
        quickstartItems={managerItems}
        setProgress={mockSetProgress}
        itemCount={managerItems.length}
      />,
    );

    // No items for manager, should show EmptyState
    expect(
      screen.getByText('Quickstart content not available for your role.'),
    ).toBeInTheDocument();
  });

  it('renders EmptyState when no quickstart items match the current role', async () => {
    const userRole = 'test'; // A role that doesn't exist in our mock data
    const filteredItems = filterQuickstartItemsByRole(
      mockQuickstartItems,
      userRole,
    );

    await renderInTestApp(
      <QuickstartContent
        quickstartItems={filteredItems}
        setProgress={mockSetProgress}
        itemCount={filteredItems.length}
      />,
    );

    // No quickstart items for the test role, should show EmptyState
    expect(
      screen.getByText('Quickstart content not available for your role.'),
    ).toBeInTheDocument();
  });

  it('only opens one item at a time', async () => {
    await renderInTestApp(
      <QuickstartContent
        quickstartItems={mockQuickstartItems}
        setProgress={mockSetProgress}
        itemCount={2}
      />,
    );

    const expandIcon1 = screen.getAllByRole('button', {
      name: /expand item/i,
    })[0];
    const expandIcon2 = screen.getAllByRole('button', {
      name: /expand item/i,
    })[1];

    fireEvent.click(expandIcon1);

    await waitFor(() =>
      expect(screen.getByText('Description for Step 1')).toBeInTheDocument(),
    );

    fireEvent.click(expandIcon2);

    await waitFor(() =>
      expect(screen.getByText('Description for Step 2')).toBeInTheDocument(),
    );

    expect(
      screen.queryByText('Description for Step 1'),
    ).not.toBeInTheDocument();
  });
});
