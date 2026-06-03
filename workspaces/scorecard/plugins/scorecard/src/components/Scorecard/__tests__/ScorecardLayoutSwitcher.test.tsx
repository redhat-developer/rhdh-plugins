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

import { ScorecardLayoutSwitcher } from '../ScorecardLayoutSwitcher';
import type { ScorecardLayoutItem } from '../ScorecardLayoutSwitcher';

const theme = createTheme();

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider theme={theme}>{children}</ThemeProvider>
);

const gridLayout: ScorecardLayoutItem = {
  title: 'Grid',
  element: <div data-testid="grid-view">Grid Content</div>,
};

const listLayout: ScorecardLayoutItem = {
  title: 'List',
  element: <div data-testid="list-view">List Content</div>,
};

describe('ScorecardLayoutSwitcher', () => {
  it('should render nothing when layouts is empty', () => {
    const { container } = render(
      <TestWrapper>
        <ScorecardLayoutSwitcher layouts={[]} />
      </TestWrapper>,
    );

    expect(container.innerHTML).toBe('');
  });

  it('should render the single layout without a toggle', () => {
    render(
      <TestWrapper>
        <ScorecardLayoutSwitcher layouts={[gridLayout]} />
      </TestWrapper>,
    );

    expect(screen.getByTestId('grid-view')).toBeInTheDocument();
    expect(screen.queryByRole('group')).not.toBeInTheDocument();
  });

  it('should render a toggle when multiple layouts are provided', () => {
    render(
      <TestWrapper>
        <ScorecardLayoutSwitcher layouts={[gridLayout, listLayout]} />
      </TestWrapper>,
    );

    expect(screen.getByRole('group')).toBeInTheDocument();
    expect(screen.getAllByRole('button')).toHaveLength(2);
  });

  it('should show the first layout by default', () => {
    render(
      <TestWrapper>
        <ScorecardLayoutSwitcher layouts={[gridLayout, listLayout]} />
      </TestWrapper>,
    );

    expect(screen.getByTestId('grid-view')).toBeInTheDocument();
    expect(screen.queryByTestId('list-view')).not.toBeInTheDocument();
  });

  it('should switch to a different layout when a toggle button is clicked', async () => {
    const user = userEvent.setup();

    render(
      <TestWrapper>
        <ScorecardLayoutSwitcher layouts={[gridLayout, listLayout]} />
      </TestWrapper>,
    );

    const buttons = screen.getAllByRole('button');
    await user.click(buttons[1]);

    expect(screen.getByTestId('list-view')).toBeInTheDocument();
    expect(screen.queryByTestId('grid-view')).not.toBeInTheDocument();
  });

  it('should keep the current layout when clicking the already-selected toggle', async () => {
    const user = userEvent.setup();

    render(
      <TestWrapper>
        <ScorecardLayoutSwitcher layouts={[gridLayout, listLayout]} />
      </TestWrapper>,
    );

    const buttons = screen.getAllByRole('button');
    await user.click(buttons[0]);

    expect(screen.getByTestId('grid-view')).toBeInTheDocument();
  });

  it('should render the correct icon for known layout titles', () => {
    render(
      <TestWrapper>
        <ScorecardLayoutSwitcher layouts={[gridLayout, listLayout]} />
      </TestWrapper>,
    );

    const buttons = screen.getAllByRole('button');
    expect(buttons[0].querySelector('svg')).toBeInTheDocument();
    expect(buttons[1].querySelector('svg')).toBeInTheDocument();
  });

  it('should handle layouts with unknown titles gracefully', () => {
    const customLayout: ScorecardLayoutItem = {
      title: 'Custom',
      element: <div data-testid="custom-view">Custom Content</div>,
    };

    render(
      <TestWrapper>
        <ScorecardLayoutSwitcher layouts={[gridLayout, customLayout]} />
      </TestWrapper>,
    );

    const buttons = screen.getAllByRole('button');
    expect(buttons[0].querySelector('svg')).toBeInTheDocument();
    expect(buttons[1].querySelector('svg')).not.toBeInTheDocument();
  });

  it('should mark the first toggle button as pressed by default', () => {
    render(
      <TestWrapper>
        <ScorecardLayoutSwitcher layouts={[gridLayout, listLayout]} />
      </TestWrapper>,
    );

    const buttons = screen.getAllByRole('button');
    expect(buttons[0]).toHaveAttribute('aria-pressed', 'true');
    expect(buttons[1]).toHaveAttribute('aria-pressed', 'false');
  });

  it('should update pressed state after switching', async () => {
    const user = userEvent.setup();

    render(
      <TestWrapper>
        <ScorecardLayoutSwitcher layouts={[gridLayout, listLayout]} />
      </TestWrapper>,
    );

    const buttons = screen.getAllByRole('button');
    await user.click(buttons[1]);

    expect(buttons[0]).toHaveAttribute('aria-pressed', 'false');
    expect(buttons[1]).toHaveAttribute('aria-pressed', 'true');
  });
});
