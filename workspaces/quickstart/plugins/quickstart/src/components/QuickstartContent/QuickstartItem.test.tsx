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
import { AccordionGroup } from '@backstage/ui';
import { QuickstartItem } from './QuickstartItem';
import { QuickstartItemData } from '../../types';

describe('QuickstartItem)', () => {
  const mockSetProgress = jest.fn();
  const item: QuickstartItemData = {
    title: 'Test Step',
    description: 'This is the test description',
    icon: 'bolt',
    cta: {
      text: 'Start Now',
      link: '#',
    },
  };

  const renderItem = () =>
    renderInTestApp(
      <AccordionGroup>
        <QuickstartItem item={item} setProgress={mockSetProgress} index={0} />
      </AccordionGroup>,
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
    await renderItem();
    // Accordion keeps panel content mounted but hidden when collapsed.
    expect(
      screen.queryByText('This is the test description'),
    ).not.toBeVisible();
    expect(screen.queryByText('Start Now')).not.toBeVisible();
  });

  it('shows description and CTA when expanded', async () => {
    await renderItem();
    fireEvent.click(screen.getByRole('button', { name: /Test Step/i }));
    expect(
      screen.getByText('This is the test description'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Start Now' }),
    ).toBeInTheDocument();
  });

  it('expands when the trigger is clicked', async () => {
    await renderItem();
    const trigger = screen.getByRole('button', { name: /Test Step/i });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
  });

  it('marks the step completed after CTA click', async () => {
    await renderItem();
    fireEvent.click(screen.getByRole('button', { name: /Test Step/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Start Now' }));
    expect(mockSetProgress).toHaveBeenCalled();
    expect(localStorage.getItem('Test Step-0')).toBe('true');
  });
});
