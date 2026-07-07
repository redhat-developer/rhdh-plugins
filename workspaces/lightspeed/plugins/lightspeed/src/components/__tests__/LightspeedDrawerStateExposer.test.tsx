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

import { ChatbotDisplayMode } from '@patternfly/chatbot';
import { render, waitFor } from '@testing-library/react';

import { useLightspeedDrawer } from '../../hooks/useLightspeedDrawer';
import {
  DrawerState,
  LightspeedDrawerStateExposer,
} from '../LightspeedDrawerStateExposer';

jest.mock('../../hooks/useLightspeedDrawer', () => ({
  useLightspeedDrawer: jest.fn(),
}));

const mockUseLightspeedDrawer = useLightspeedDrawer as jest.MockedFunction<
  typeof useLightspeedDrawer
>;

describe('LightspeedDrawerStateExposer', () => {
  const mockSetDrawerWidth = jest.fn();
  const mockOnStateChange = jest.fn();
  const mockToggleChatbot = jest.fn();

  const createMockReturn = (overrides = {}) => ({
    isChatbotActive: false,
    toggleChatbot: mockToggleChatbot,
    displayMode: ChatbotDisplayMode.default,
    setDisplayMode: jest.fn(),
    drawerWidth: 500,
    setDrawerWidth: mockSetDrawerWidth,
    currentConversationId: undefined,
    setCurrentConversationId: jest.fn(),
    draftMessage: '',
    setDraftMessage: jest.fn(),
    draftFileContents: [],
    setDraftFileContents: jest.fn(),
    consumePendingOverlayThreadHandoff: jest.fn(() => false),
    shellViewTab: 0,
    setShellViewTab: jest.fn(),
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseLightspeedDrawer.mockReturnValue(createMockReturn());
  });

  it('should call onStateChange with initial state', async () => {
    render(<LightspeedDrawerStateExposer onStateChange={mockOnStateChange} />);

    await waitFor(() => {
      expect(mockOnStateChange).toHaveBeenCalledWith({
        id: 'lightspeed',
        isDrawerOpen: false,
        drawerWidth: 500,
        setDrawerWidth: mockSetDrawerWidth,
        closeDrawer: expect.any(Function),
      });
    });
  });

  it('should set isDrawerOpen to true when displayMode is docked AND chatbot is active', async () => {
    mockUseLightspeedDrawer.mockReturnValue(
      createMockReturn({
        displayMode: ChatbotDisplayMode.docked,
        isChatbotActive: true,
      }),
    );

    render(<LightspeedDrawerStateExposer onStateChange={mockOnStateChange} />);

    await waitFor(() => {
      expect(mockOnStateChange).toHaveBeenCalledWith(
        expect.objectContaining({
          isDrawerOpen: true,
        }),
      );
    });
  });

  it('should set isDrawerOpen to false when displayMode is docked but chatbot is not active', async () => {
    mockUseLightspeedDrawer.mockReturnValue(
      createMockReturn({
        displayMode: ChatbotDisplayMode.docked,
        isChatbotActive: false,
      }),
    );

    render(<LightspeedDrawerStateExposer onStateChange={mockOnStateChange} />);

    await waitFor(() => {
      expect(mockOnStateChange).toHaveBeenCalledWith(
        expect.objectContaining({
          isDrawerOpen: false,
        }),
      );
    });
  });

  it('should set isDrawerOpen to false when displayMode is overlay', async () => {
    mockUseLightspeedDrawer.mockReturnValue(
      createMockReturn({ displayMode: ChatbotDisplayMode.default }),
    );

    render(<LightspeedDrawerStateExposer onStateChange={mockOnStateChange} />);

    await waitFor(() => {
      expect(mockOnStateChange).toHaveBeenCalledWith(
        expect.objectContaining({
          isDrawerOpen: false,
        }),
      );
    });
  });

  it('should set isDrawerOpen to false when displayMode is fullscreen', async () => {
    mockUseLightspeedDrawer.mockReturnValue(
      createMockReturn({ displayMode: ChatbotDisplayMode.fullscreen }),
    );

    render(<LightspeedDrawerStateExposer onStateChange={mockOnStateChange} />);

    await waitFor(() => {
      expect(mockOnStateChange).toHaveBeenCalledWith(
        expect.objectContaining({
          isDrawerOpen: false,
        }),
      );
    });
  });

  it('should include the correct drawerWidth in state', async () => {
    mockUseLightspeedDrawer.mockReturnValue(
      createMockReturn({ drawerWidth: 600 }),
    );

    render(<LightspeedDrawerStateExposer onStateChange={mockOnStateChange} />);

    await waitFor(() => {
      expect(mockOnStateChange).toHaveBeenCalledWith(
        expect.objectContaining({
          drawerWidth: 600,
        }),
      );
    });
  });

  it('should render null', () => {
    const { container } = render(
      <LightspeedDrawerStateExposer onStateChange={mockOnStateChange} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('should always use lightspeed as the id', async () => {
    render(<LightspeedDrawerStateExposer onStateChange={mockOnStateChange} />);

    await waitFor(() => {
      const callArg = mockOnStateChange.mock.calls[0][0] as DrawerState;
      expect(callArg.id).toBe('lightspeed');
    });
  });

  it('should pass setDrawerWidth function in state', async () => {
    render(<LightspeedDrawerStateExposer onStateChange={mockOnStateChange} />);

    await waitFor(() => {
      const callArg = mockOnStateChange.mock.calls[0][0] as DrawerState;
      expect(callArg.setDrawerWidth).toBe(mockSetDrawerWidth);
    });
  });

  it('should call toggleChatbot when closeDrawer is invoked', async () => {
    render(<LightspeedDrawerStateExposer onStateChange={mockOnStateChange} />);

    await waitFor(() => {
      const callArg = mockOnStateChange.mock.calls[0][0] as DrawerState;
      callArg.closeDrawer();
      expect(mockToggleChatbot).toHaveBeenCalledTimes(1);
    });
  });
});
