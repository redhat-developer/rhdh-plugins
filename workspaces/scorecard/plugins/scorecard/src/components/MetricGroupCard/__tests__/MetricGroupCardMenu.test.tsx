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

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, createTheme } from '@mui/material/styles';

import { MetricGroupCardMenu } from '../MetricGroupCardMenu';
import type { MenuAction } from '../MetricGroupCardMenu';

const theme = createTheme();

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
}

const mockActions: MenuAction[] = [
  {
    id: 'edit',
    label: 'Edit scorecard',
    icon: <span data-testid="edit-icon" />,
    onClick: jest.fn(),
  },
  {
    id: 'delete',
    label: 'Delete scorecard',
    icon: <span data-testid="delete-icon" />,
    onClick: jest.fn(),
  },
];

describe('MetricGroupCardMenu', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return null when actions array is empty', () => {
    const { container } = renderWithTheme(
      <MetricGroupCardMenu ariaLabel="Menu" actions={[]} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('should render IconButton with the provided aria-label', () => {
    renderWithTheme(
      <MetricGroupCardMenu ariaLabel="Card options" actions={mockActions} />,
    );

    const button = screen.getByLabelText('Card options');
    expect(button).toBeInTheDocument();
    expect(button.tagName.toLowerCase()).toBe('button');
  });

  it('should open menu when IconButton clicked and show action labels', async () => {
    const user = userEvent.setup();
    renderWithTheme(
      <MetricGroupCardMenu ariaLabel="Card options" actions={mockActions} />,
    );

    expect(screen.queryByText('Edit scorecard')).not.toBeInTheDocument();

    await user.click(screen.getByLabelText('Card options'));

    expect(screen.getByText('Edit scorecard')).toBeInTheDocument();
    expect(screen.getByText('Delete scorecard')).toBeInTheDocument();
  });

  it('should call action onClick when menu item clicked', async () => {
    const user = userEvent.setup();
    renderWithTheme(
      <MetricGroupCardMenu ariaLabel="Card options" actions={mockActions} />,
    );

    await user.click(screen.getByLabelText('Card options'));
    await user.click(screen.getByText('Edit scorecard'));

    expect(mockActions[0].onClick).toHaveBeenCalledTimes(1);
  });

  it('should close menu after action click', async () => {
    const user = userEvent.setup();
    renderWithTheme(
      <MetricGroupCardMenu ariaLabel="Card options" actions={mockActions} />,
    );

    await user.click(screen.getByLabelText('Card options'));
    expect(screen.getByText('Edit scorecard')).toBeInTheDocument();

    await user.click(screen.getByText('Delete scorecard'));

    await waitFor(() => {
      expect(screen.queryByText('Edit scorecard')).not.toBeInTheDocument();
    });
    expect(mockActions[1].onClick).toHaveBeenCalledTimes(1);
  });
});
