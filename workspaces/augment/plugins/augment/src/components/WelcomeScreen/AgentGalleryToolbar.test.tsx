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
import userEvent from '@testing-library/user-event';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { AgentGalleryToolbar, type SortOption } from './AgentGalleryToolbar';

const theme = createTheme();

function renderToolbar(
  props: Partial<React.ComponentProps<typeof AgentGalleryToolbar>> = {},
) {
  const defaultProps: React.ComponentProps<typeof AgentGalleryToolbar> = {
    search: '',
    onSearchChange: jest.fn(),
    tab: 'all',
    onTabChange: jest.fn(),
    frameworks: ['LangGraph', 'CrewAI'],
    recentCount: 2,
    pinnedCount: 1,
    totalCount: 10,
    filteredCount: 10,
    sort: 'name' as SortOption,
    onSortChange: jest.fn(),
    ...props,
  };
  return render(
    <ThemeProvider theme={theme}>
      <AgentGalleryToolbar {...defaultProps} />
    </ThemeProvider>,
  );
}

describe('AgentGalleryToolbar', () => {
  it('renders the heading', () => {
    renderToolbar();
    expect(screen.getByText('Agents')).toBeInTheDocument();
  });

  it('renders the total count chip', () => {
    renderToolbar({ totalCount: 15, filteredCount: 15 });
    expect(screen.getByText('15')).toBeInTheDocument();
  });

  it('renders filtered/total count when different', () => {
    renderToolbar({ totalCount: 20, filteredCount: 5 });
    expect(screen.getByText('5 / 20')).toBeInTheDocument();
  });

  it('renders search input', () => {
    renderToolbar();
    expect(screen.getByPlaceholderText(/search agents/i)).toBeInTheDocument();
  });

  it('calls onSearchChange when typing', async () => {
    const onSearchChange = jest.fn();
    renderToolbar({ onSearchChange });
    const user = userEvent.setup();
    const input = screen.getByPlaceholderText(/search agents/i);
    await user.type(input, 'hello');
    expect(onSearchChange).toHaveBeenCalled();
  });

  it('renders All, Recent, Pinned tabs', () => {
    renderToolbar();
    expect(screen.getByRole('tab', { name: /all/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /recent/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /pinned/i })).toBeInTheDocument();
  });

  it('renders framework tabs', () => {
    renderToolbar({ frameworks: ['LangGraph', 'CrewAI'] });
    expect(screen.getByRole('tab', { name: 'LangGraph' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'CrewAI' })).toBeInTheDocument();
  });

  it('disables Recent tab when recentCount is 0', () => {
    renderToolbar({ recentCount: 0 });
    expect(screen.getByRole('tab', { name: /recent/i })).toBeDisabled();
  });

  it('disables Pinned tab when pinnedCount is 0', () => {
    renderToolbar({ pinnedCount: 0 });
    expect(screen.getByRole('tab', { name: /pinned/i })).toBeDisabled();
  });

  it('calls onTabChange when a tab is clicked', async () => {
    const onTabChange = jest.fn();
    renderToolbar({ onTabChange, recentCount: 3 });
    const user = userEvent.setup();
    await user.click(screen.getByRole('tab', { name: /recent/i }));
    expect(onTabChange).toHaveBeenCalled();
  });

  it('renders sort dropdown', () => {
    renderToolbar();
    expect(screen.getByText('Name')).toBeInTheDocument();
  });
});
