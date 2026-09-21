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

import { SidebarPinToggle } from './SidebarPinToggle';

const mockToggleSidebarPinState = jest.fn();

jest.mock('@backstage/core-components', () => ({
  useSidebarPinState: jest.fn(),
}));

jest.mock('../../hooks/useTranslation', () => {
  const messages: Record<string, string> = {
    'sidebar.pinSidebar': 'Pin sidebar',
    'sidebar.unpinSidebar': 'Unpin sidebar',
  };
  return {
    useTranslation: () => ({
      t: (key: string) => messages[key] ?? key,
    }),
  };
});

const { useSidebarPinState } = jest.requireMock('@backstage/core-components');

describe('SidebarPinToggle', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with "Unpin sidebar" label when sidebar is pinned', () => {
    useSidebarPinState.mockReturnValue({
      isPinned: true,
      toggleSidebarPinState: mockToggleSidebarPinState,
      isMobile: false,
    });

    render(<SidebarPinToggle />);

    expect(
      screen.getByRole('button', { name: 'Unpin sidebar' }),
    ).toBeInTheDocument();
  });

  it('renders with "Pin sidebar" label when sidebar is not pinned', () => {
    useSidebarPinState.mockReturnValue({
      isPinned: false,
      toggleSidebarPinState: mockToggleSidebarPinState,
      isMobile: false,
    });

    render(<SidebarPinToggle />);

    expect(
      screen.getByRole('button', { name: 'Pin sidebar' }),
    ).toBeInTheDocument();
  });

  it('calls toggleSidebarPinState on click', async () => {
    useSidebarPinState.mockReturnValue({
      isPinned: false,
      toggleSidebarPinState: mockToggleSidebarPinState,
      isMobile: false,
    });

    render(<SidebarPinToggle />);

    await userEvent.click(screen.getByRole('button', { name: 'Pin sidebar' }));

    expect(mockToggleSidebarPinState).toHaveBeenCalledTimes(1);
  });

  it('renders nothing when on mobile', () => {
    useSidebarPinState.mockReturnValue({
      isPinned: false,
      toggleSidebarPinState: mockToggleSidebarPinState,
      isMobile: true,
    });

    const { container } = render(<SidebarPinToggle />);

    expect(container).toBeEmptyDOMElement();
  });
});
