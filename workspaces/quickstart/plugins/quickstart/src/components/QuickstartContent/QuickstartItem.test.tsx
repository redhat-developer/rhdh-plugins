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

import { screen, fireEvent } from '@testing-library/react';
import { renderInTestApp } from '@backstage/test-utils';
import { QuickstartItem } from './QuickstartItem';
import { QuickstartItemData } from '../../types';

jest.mock('@mui/material/Collapse', () => ({
  __esModule: true,
  default: ({ in: open, children }: any) => (open ? children : null),
}));

describe('QuickstartItem)', () => {
  const mockSetProgress = jest.fn();
  const mockHandleOpen = jest.fn();
  const item: QuickstartItemData = {
    title: 'Test Step',
    description: 'This is the test description',
    icon: 'bolt',
    cta: {
      text: 'Start Now',
      link: '#',
    },
  };

  const renderItem = (open = false) =>
    renderInTestApp(
      <QuickstartItem
        item={item}
        setProgress={mockSetProgress}
        handleOpen={mockHandleOpen}
        open={open}
        index={0}
      />,
    );

  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  it('renders the item title and icon', async () => {
    await renderItem();
    expect(screen.getByText('Test Step')).toBeInTheDocument();
    expect(screen.getByText('bolt')).toBeInTheDocument();
  });

  it('does not show description and CTA when closed', async () => {
    await renderItem(false);
    expect(
      screen.queryByText('This is the test description'),
    ).not.toBeInTheDocument();
    expect(screen.queryByText('Start Now')).not.toBeInTheDocument();
  });

  it('shows description and CTA when open is true', async () => {
    await renderItem(true);
    expect(
      screen.getByText('This is the test description'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Start Now' }),
    ).toBeInTheDocument();
  });

  it('calls handleOpen when expand/collapse item is clicked', async () => {
    await renderItem(false);
    const toggleBtn = screen.getByRole('button', {
      name: /expand.*details/i,
    });
    fireEvent.click(toggleBtn);
    expect(mockHandleOpen).toHaveBeenCalled();
  });

  it('calls setProgress and sets stepCompleted in localStorage on CTA click', async () => {
    await renderItem(true);

    const cta = screen.getByRole('button', { name: 'Start Now' });
    fireEvent.click(cta);

    expect(mockSetProgress).toHaveBeenCalled();
    expect(localStorage.getItem('Test Step-0')).toBe('true');
  });

  it('reads stepCompleted from localStorage on mount', async () => {
    localStorage.setItem('Test Step-0', 'true');
    await renderItem(true);
    expect(screen.getByText('Start Now')).toBeInTheDocument();
    expect(localStorage.getItem('Test Step-0')).toBe('true');
  });
});
