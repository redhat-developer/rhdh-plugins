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
import { HeaderDropdownComponent } from './HeaderDropdownComponent';
import { renderInTestApp } from '@backstage/test-utils';

describe('HeaderDropdownComponent', () => {
  const mockOnOpen = jest.fn();
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    jest.spyOn(console, 'warn').mockImplementation(message => {
      if (message.includes('⚠️ React Router Future Flag Warning')) {
        return; // Suppress React Router warning
      }
      // eslint-disable-next-line no-console
      console.warn(message); // Log other warnings
    });

    jest.spyOn(console, 'error').mockImplementation(message => {
      if (
        typeof message === 'string' &&
        message.includes('findDOMNode is deprecated')
      ) {
        return; // Suppress findDOMNode warning in tests
      }
      // eslint-disable-next-line no-console
      console.error(message); // Allow other errors to be logged
    });
  });

  it('renders button with provided content', async () => {
    await renderInTestApp(
      <HeaderDropdownComponent
        buttonContent={<span>Click Me</span>}
        onOpen={mockOnOpen}
        onClose={mockOnClose}
        anchorEl={null}
      >
        <div>Dropdown Content</div>
      </HeaderDropdownComponent>,
    );

    expect(screen.getByText('Click Me')).toBeInTheDocument();
  });

  it('opens dropdown when button is clicked', async () => {
    await renderInTestApp(
      <HeaderDropdownComponent
        buttonContent={<span>Click Me</span>}
        onOpen={mockOnOpen}
        onClose={mockOnClose}
        anchorEl={null}
      >
        <div>Dropdown Content</div>
      </HeaderDropdownComponent>,
    );

    fireEvent.click(screen.getByText('Click Me'));
    expect(mockOnOpen).toHaveBeenCalled();
  });

  it('renders as an icon button if isIconButton is true', async () => {
    await renderInTestApp(
      <HeaderDropdownComponent
        buttonContent={<span>Icon</span>}
        onOpen={jest.fn()}
        onClose={jest.fn()}
        anchorEl={null}
        isIconButton // Explicitly set to true
      >
        <div>Dropdown Content</div>
      </HeaderDropdownComponent>,
    );

    // Check that an IconButton is rendered
    const iconButton = screen.getByRole('button');
    expect(iconButton).toBeInTheDocument();
    expect(iconButton).toHaveClass('v5-MuiIconButton-root'); // Ensures it's an IconButton
  });

  it('displays tooltip when hovered', async () => {
    await renderInTestApp(
      <HeaderDropdownComponent
        buttonContent={<span>Click Me</span>}
        onOpen={jest.fn()}
        onClose={jest.fn()}
        anchorEl={null}
        tooltip="Test Tooltip"
      >
        <div>Dropdown Content</div>
      </HeaderDropdownComponent>,
    );

    // Ensure the tooltip is not visible initially
    expect(screen.queryByText('Test Tooltip')).not.toBeInTheDocument();

    // Hover over the button to trigger the tooltip
    fireEvent.mouseOver(screen.getByRole('button'));

    // The tooltip should now be visible
    expect(await screen.findByText('Test Tooltip')).toBeInTheDocument();
  });
});
