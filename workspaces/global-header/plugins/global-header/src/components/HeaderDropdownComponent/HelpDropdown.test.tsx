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
import {
  MockTrans,
  mockUseTranslation,
} from '../../test-utils/mockTranslations';
import { HelpDropdown } from './HelpDropdown';
import { useDropdownManager } from '../../hooks';
import { useHelpDropdownMountPoints } from '../../hooks/useHelpDropdownMountPoints';
import { HelpDropdownMountPoint } from '../../types';

jest.mock('../../hooks', () => ({
  useDropdownManager: jest.fn(),
}));

jest.mock('../../hooks/useHelpDropdownMountPoints', () => ({
  useHelpDropdownMountPoints: jest.fn(),
}));

// Mock translation hooks
jest.mock('../../hooks/useTranslation', () => ({
  useTranslation: mockUseTranslation,
}));

jest.mock('../../components/Trans', () => ({
  Trans: MockTrans,
}));

const MockComponent = ({ title, icon }: any) => (
  <div data-testid="mock-component">
    {icon && <span data-testid="mock-icon">{icon}</span>}
    {title}
  </div>
);

const MockNullComponent = () => null;

describe('HelpDropdown', () => {
  const mockHandleOpen = jest.fn();
  const mockHandleClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    (useDropdownManager as jest.Mock).mockReturnValue({
      anchorEl: null,
      handleOpen: mockHandleOpen,
      handleClose: mockHandleClose,
    });
  });

  it('shows empty state when there are no mount points', async () => {
    (useHelpDropdownMountPoints as jest.Mock).mockReturnValue([]);

    await renderInTestApp(<HelpDropdown />);

    expect(screen.getByRole('button')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button'));

    expect(await screen.findByText('No support links')).toBeInTheDocument();
  });

  it('shows empty state when mount points is undefined', async () => {
    (useHelpDropdownMountPoints as jest.Mock).mockReturnValue(undefined);

    await renderInTestApp(<HelpDropdown />);

    expect(screen.getByRole('button')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button'));

    expect(await screen.findByText('No support links')).toBeInTheDocument();
  });

  it('shows empty state when all components return null', async () => {
    const mockMountPoints: HelpDropdownMountPoint[] = [
      {
        Component: MockNullComponent,
        config: {
          props: {
            title: 'Null Component',
          },
          priority: 1,
        },
      },
    ];

    (useHelpDropdownMountPoints as jest.Mock).mockReturnValue(mockMountPoints);

    await renderInTestApp(<HelpDropdown />);

    expect(screen.getByRole('button')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button'));

    expect(await screen.findByText('No support links')).toBeInTheDocument();
  });

  it('renders help dropdown button when mount points exist', async () => {
    const mockMountPoints: HelpDropdownMountPoint[] = [
      {
        Component: MockComponent,
        config: {
          props: {
            title: 'Help Item 1',
            icon: 'help-icon',
            link: '/help1',
            tooltip: 'Help tooltip',
          },
          priority: 1,
        },
      },
    ];

    (useHelpDropdownMountPoints as jest.Mock).mockReturnValue(mockMountPoints);

    await renderInTestApp(<HelpDropdown />);

    expect(screen.getByRole('button')).toBeInTheDocument();
    const button = screen.getByRole('button');
    expect(button.querySelector('svg')).toBeInTheDocument();
  });

  it('opens dropdown when help button is clicked', async () => {
    const mockMountPoints: HelpDropdownMountPoint[] = [
      {
        Component: MockComponent,
        config: {
          props: {
            title: 'Help Item 1',
          },
          priority: 1,
        },
      },
    ];

    (useHelpDropdownMountPoints as jest.Mock).mockReturnValue(mockMountPoints);

    await renderInTestApp(<HelpDropdown />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(mockHandleOpen).toHaveBeenCalled();
  });

  it('displays tooltip when provided', async () => {
    const mockMountPoints: HelpDropdownMountPoint[] = [
      {
        Component: MockComponent,
        config: {
          props: {
            title: 'Help Item 1',
          },
          priority: 1,
        },
      },
    ];

    (useHelpDropdownMountPoints as jest.Mock).mockReturnValue(mockMountPoints);

    await renderInTestApp(<HelpDropdown />);

    // Hover over the button to trigger the tooltip
    fireEvent.mouseOver(screen.getByRole('button'));

    // The tooltip should now be visible
    expect(await screen.findByText('Help')).toBeInTheDocument();
  });

  it('sorts mount points by priority in descending order', async () => {
    const mockMountPoints: HelpDropdownMountPoint[] = [
      {
        Component: MockComponent,
        config: {
          props: {
            title: 'Low Priority Item',
          },
          priority: 1,
        },
      },
      {
        Component: MockComponent,
        config: {
          props: {
            title: 'High Priority Item',
          },
          priority: 5,
        },
      },
      {
        Component: MockComponent,
        config: {
          props: {
            title: 'Medium Priority Item',
          },
          priority: 3,
        },
      },
    ];

    (useHelpDropdownMountPoints as jest.Mock).mockReturnValue(mockMountPoints);

    // Mock anchor element to show dropdown content
    (useDropdownManager as jest.Mock).mockReturnValue({
      anchorEl: document.createElement('div'),
      handleOpen: mockHandleOpen,
      handleClose: mockHandleClose,
    });

    await renderInTestApp(<HelpDropdown />);

    const menuItems = screen.getAllByTestId('mock-component');
    expect(menuItems).toHaveLength(3);

    // Check order by text content
    expect(menuItems[0]).toHaveTextContent('High Priority Item');
    expect(menuItems[1]).toHaveTextContent('Medium Priority Item');
    expect(menuItems[2]).toHaveTextContent('Low Priority Item');
  });

  it('handles mount points without priority (defaults to 0)', async () => {
    const mockMountPoints: HelpDropdownMountPoint[] = [
      {
        Component: MockComponent,
        config: {
          props: {
            title: 'Item Without Priority',
          },
          // No priority specified
        },
      },
      {
        Component: MockComponent,
        config: {
          props: {
            title: 'Item With Priority',
          },
          priority: 2,
        },
      },
    ];

    (useHelpDropdownMountPoints as jest.Mock).mockReturnValue(mockMountPoints);

    // Mock anchor element to show dropdown content
    (useDropdownManager as jest.Mock).mockReturnValue({
      anchorEl: document.createElement('div'),
      handleOpen: mockHandleOpen,
      handleClose: mockHandleClose,
    });

    await renderInTestApp(<HelpDropdown />);

    const menuItems = screen.getAllByTestId('mock-component');
    expect(menuItems).toHaveLength(2);

    // Item with priority 2 should come first, item without priority (default 0) second
    expect(menuItems[0]).toHaveTextContent('Item With Priority');
    expect(menuItems[1]).toHaveTextContent('Item Without Priority');
  });

  it('passes layout styles to button', async () => {
    const mockMountPoints: HelpDropdownMountPoint[] = [
      {
        Component: MockComponent,
        config: {
          props: {
            title: 'Help Item 1',
          },
          priority: 1,
        },
      },
    ];

    (useHelpDropdownMountPoints as jest.Mock).mockReturnValue(mockMountPoints);

    const layoutStyle = { marginLeft: '16px', color: 'red' };

    await renderInTestApp(<HelpDropdown layout={layoutStyle} />);

    const button = screen.getByRole('button');
    expect(button).toHaveStyle('margin-left: 16px');
    expect(button).toHaveStyle('color: red');
  });

  it('processes mount point configurations correctly', async () => {
    const mockMountPoints: HelpDropdownMountPoint[] = [
      {
        Component: MockComponent,
        config: {
          props: {
            title: 'Documentation',
            icon: 'doc-icon',
            link: '/docs',
            tooltip: 'View documentation',
          },
          style: { color: 'blue' },
          priority: 3,
        },
      },
    ];

    (useHelpDropdownMountPoints as jest.Mock).mockReturnValue(mockMountPoints);

    // Mock anchor element to show dropdown content
    (useDropdownManager as jest.Mock).mockReturnValue({
      anchorEl: document.createElement('div'),
      handleOpen: mockHandleOpen,
      handleClose: mockHandleClose,
    });

    await renderInTestApp(<HelpDropdown />);

    // Verify that the mount point component is rendered
    expect(screen.getByTestId('mock-component')).toBeInTheDocument();
    expect(screen.getByText('Documentation')).toBeInTheDocument();
  });

  it('handles empty mount point config gracefully', async () => {
    const mockMountPoints: HelpDropdownMountPoint[] = [
      {
        Component: MockComponent,
        config: {
          props: {
            title: 'Simple Item',
          },
        },
      },
    ];

    (useHelpDropdownMountPoints as jest.Mock).mockReturnValue(mockMountPoints);

    await renderInTestApp(<HelpDropdown />);

    expect(screen.getByRole('button')).toBeInTheDocument();
  });
});
