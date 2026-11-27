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

beforeEach(() => {
  localStorage.clear();
  jest.clearAllMocks();
});

describe('QuickstartContent', () => {
  const mockSetProgress = jest.fn();

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
        isLoading={false}
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
        isLoading={false}
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
        isLoading={false}
      />,
    );

    // Developer-specific items should be visible
    expect(screen.getByText('Step 1 for Developer')).toBeInTheDocument();
    expect(screen.getByText('Step 2 for Developer')).toBeInTheDocument();
    // Items with other roles should not be visible
    expect(screen.queryByText('Step 1 for Admin')).not.toBeInTheDocument();
    expect(screen.queryByText('Step 2 for Admin')).not.toBeInTheDocument();
  });

  it('only opens one item at a time', async () => {
    const adminItems = filterQuickstartItemsByRole(
      mockQuickstartItems,
      'admin',
    ).slice(0, 2);

    await renderInTestApp(
      <QuickstartContent
        quickstartItems={adminItems}
        setProgress={mockSetProgress}
        itemCount={adminItems.length}
        isLoading={false}
      />,
    );

    const first = screen.getByRole('button', { name: /Step 1 for Admin/i });
    const second = screen.getByRole('button', { name: /Step 2 for Admin/i });

    fireEvent.click(first);
    await waitFor(() => expect(first).toHaveAttribute('aria-expanded', 'true'));
    expect(second).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(second);
    await waitFor(() =>
      expect(second).toHaveAttribute('aria-expanded', 'true'),
    );
    expect(first).toHaveAttribute('aria-expanded', 'false');
  });
});
