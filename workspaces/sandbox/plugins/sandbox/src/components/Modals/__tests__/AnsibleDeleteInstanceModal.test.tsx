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

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import AnsibleDeleteInstanceModal from '../AnsibleDeleteInstanceModal';

describe('AnsibleDeleteInstanceModal', () => {
  const mockSetOpen = jest.fn();
  const mockHandleAnsibleDeleteInstance = jest.fn();
  const theme = createTheme();

  const renderComponent = (props = {}) => {
    return render(
      <ThemeProvider theme={theme}>
        <AnsibleDeleteInstanceModal
          modalOpen
          setOpen={mockSetOpen}
          handleAnsibleDeleteInstance={mockHandleAnsibleDeleteInstance}
          {...props}
        />
      </ThemeProvider>,
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders the modal with the correct title and warning', () => {
    renderComponent();

    expect(screen.getByText('Delete instance?')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Your AAP instance will be deleted. Consider backing up your work before continuing.',
      ),
    ).toBeInTheDocument();
  });

  test('closes the modal when the close button is clicked', () => {
    renderComponent();

    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);

    expect(mockSetOpen).toHaveBeenCalledWith(false);
  });

  test('calls setOpen(false) when the cancel button is clicked', () => {
    renderComponent();

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);

    expect(mockSetOpen).toHaveBeenCalledWith(false);
  });

  test('calls handleAnsibleDeleteInstance when the delete button is clicked', () => {
    renderComponent();

    const deleteButton = screen.getByRole('button', {
      name: /delete instance/i,
    });
    fireEvent.click(deleteButton);

    expect(mockHandleAnsibleDeleteInstance).toHaveBeenCalledTimes(1);
  });

  test('displays warning icon', () => {
    renderComponent();

    const warningIcon = document.querySelector(
      'svg[data-testid="WarningIcon"]',
    );
    expect(warningIcon).toBeInTheDocument();
  });

  test('does not render when modalOpen is false', () => {
    renderComponent({ modalOpen: false });

    expect(screen.queryByText('Delete instance?')).not.toBeInTheDocument();
  });
});
