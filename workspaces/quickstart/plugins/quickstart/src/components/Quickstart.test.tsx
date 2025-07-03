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

beforeEach(() => {
  localStorage.clear();
  jest.clearAllMocks();
});

describe('Quickstart', () => {
  const mockHandleDrawerClose = jest.fn();

  it('renders header, content and footer', async () => {
    await renderInTestApp(
      <Quickstart
        quickstartItems={mockQuickstartItems}
        handleDrawerClose={mockHandleDrawerClose}
      />,
    );

    expect(screen.getByText('Step 1')).toBeInTheDocument();
    expect(screen.getByText('Step 2')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Hide' })).toBeInTheDocument();
  });

  it('shows "Not started" in footer initially', async () => {
    await renderInTestApp(
      <Quickstart
        quickstartItems={mockQuickstartItems}
        handleDrawerClose={mockHandleDrawerClose}
      />,
    );

    expect(screen.getByText('Not started')).toBeInTheDocument();
  });

  it('updates progress when CTA is clicked', async () => {
    await renderInTestApp(
      <Quickstart
        quickstartItems={mockQuickstartItems}
        handleDrawerClose={mockHandleDrawerClose}
      />,
    );

    // Expand and click CTA for Step One
    const expandButtons = screen.getAllByRole('button', {
      name: /expand item/i,
    });
    fireEvent.click(expandButtons[0]);

    const cta = await screen.findByRole('button', { name: 'Start Now' });
    fireEvent.click(cta);

    await waitFor(() => {
      expect(screen.getByText('50% progress')).toBeInTheDocument();
    });

    // Expand and click CTA for Step Two
    fireEvent.click(expandButtons[1]);
    const cta2 = await screen.findByRole('button', { name: 'Continue' });
    fireEvent.click(cta2);

    await waitFor(() => {
      expect(screen.getByText('100% progress')).toBeInTheDocument();
    });
  });

  it('stores and reads progress from localStorage', async () => {
    localStorage.setItem('Step 1-0', 'true');
    await renderInTestApp(
      <Quickstart
        quickstartItems={mockQuickstartItems}
        handleDrawerClose={mockHandleDrawerClose}
      />,
    );

    expect(screen.getByText('50% progress')).toBeInTheDocument();
  });

  it('calls handleDrawerClose when Hide button is clicked', async () => {
    await renderInTestApp(
      <Quickstart
        quickstartItems={mockQuickstartItems}
        handleDrawerClose={mockHandleDrawerClose}
      />,
    );

    const hideBtn = screen.getByRole('button', { name: 'Hide' });
    fireEvent.click(hideBtn);

    expect(mockHandleDrawerClose).toHaveBeenCalledTimes(1);
  });
});
