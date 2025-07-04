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

import { render, screen, fireEvent } from '@testing-library/react';
import { QuickstartButton } from './QuickstartButton';
import { useQuickstartPermission } from '../../hooks/useQuickstartPermission';
import { useQuickstartDrawerContext } from '../../hooks/useQuickstartDrawerContext';

// Mock the hooks
jest.mock('../../hooks/useQuickstartPermission', () => ({
  useQuickstartPermission: jest.fn(),
}));

jest.mock('../../hooks/useQuickstartDrawerContext', () => ({
  useQuickstartDrawerContext: jest.fn(),
}));

describe('QuickstartButton', () => {
  const mockToggleDrawer = jest.fn();
  const mockOnClick = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useQuickstartPermission as jest.Mock).mockReturnValue(true);
    (useQuickstartDrawerContext as jest.Mock).mockReturnValue({
      toggleDrawer: mockToggleDrawer,
    });
  });

  it('renders the button when permission is allowed', () => {
    render(<QuickstartButton />);

    const button = screen.getByTestId('quickstart-button');
    expect(button).toBeInTheDocument();
    expect(screen.getByText('Quick start')).toBeInTheDocument();
  });

  it('does not render when permission is denied', () => {
    (useQuickstartPermission as jest.Mock).mockReturnValue(false);

    render(<QuickstartButton />);

    expect(screen.queryByTestId('quickstart-button')).not.toBeInTheDocument();
  });

  it('calls toggleDrawer when clicked', () => {
    render(<QuickstartButton />);

    const button = screen.getByTestId('quickstart-button');
    fireEvent.click(button);

    expect(mockToggleDrawer).toHaveBeenCalledTimes(1);
  });

  it('calls custom onClick when provided', () => {
    render(<QuickstartButton onClick={mockOnClick} />);

    const button = screen.getByTestId('quickstart-button');
    fireEvent.click(button);

    expect(mockToggleDrawer).toHaveBeenCalledTimes(1);
    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it('renders with custom title', () => {
    render(<QuickstartButton title="Custom Quickstart" />);

    expect(screen.getByText('Custom Quickstart')).toBeInTheDocument();
  });

  it('applies custom styles', () => {
    const customStyle = { backgroundColor: 'red' };
    render(<QuickstartButton style={customStyle} />);

    const button = screen.getByTestId('quickstart-button');
    expect(button).toHaveStyle('background-color: red');
  });
});
