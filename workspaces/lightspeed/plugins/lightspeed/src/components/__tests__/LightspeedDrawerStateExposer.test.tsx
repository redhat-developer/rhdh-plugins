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

import { LightspeedDrawerContext } from '../LightspeedDrawerContext';
import {
  DrawerState,
  LightspeedDrawerStateExposer,
} from '../LightspeedDrawerStateExposer';

describe('LightspeedDrawerStateExposer', () => {
  const mockSetDrawerWidth = jest.fn();
  const mockOnStateChange = jest.fn();
  const mockToggleChatbot = jest.fn();

  const createContextValue = (overrides = {}) => ({
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
    isSettingsDropdownOpen: false,
    setIsSettingsDropdownOpen: jest.fn(),
    ...overrides,
  });

  const renderWithContext = (
    contextValue: ReturnType<typeof createContextValue>,
  ) => {
    return render(
      <LightspeedDrawerContext.Provider value={contextValue}>
        <LightspeedDrawerStateExposer onStateChange={mockOnStateChange} />
      </LightspeedDrawerContext.Provider>,
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should call onStateChange with initial state', async () => {
    renderWithContext(createContextValue());

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

  it('should set isDrawerOpen to true when displayMode is docked', async () => {
    renderWithContext(
      createContextValue({
        displayMode: ChatbotDisplayMode.docked,
      }),
    );

    await waitFor(() => {
      expect(mockOnStateChange).toHaveBeenCalledWith(
        expect.objectContaining({
          isDrawerOpen: true,
        }),
      );
    });
  });

  it('should set isDrawerOpen to false when displayMode is overlay', async () => {
    renderWithContext(
      createContextValue({
        displayMode: ChatbotDisplayMode.default,
      }),
    );

    await waitFor(() => {
      expect(mockOnStateChange).toHaveBeenCalledWith(
        expect.objectContaining({
          isDrawerOpen: false,
        }),
      );
    });
  });

  it('should set isDrawerOpen to false when displayMode is fullscreen', async () => {
    renderWithContext(
      createContextValue({
        displayMode: ChatbotDisplayMode.fullscreen,
      }),
    );

    await waitFor(() => {
      expect(mockOnStateChange).toHaveBeenCalledWith(
        expect.objectContaining({
          isDrawerOpen: false,
        }),
      );
    });
  });

  it('should include the correct drawerWidth in state', async () => {
    renderWithContext(
      createContextValue({
        drawerWidth: 600,
      }),
    );

    await waitFor(() => {
      expect(mockOnStateChange).toHaveBeenCalledWith(
        expect.objectContaining({
          drawerWidth: 600,
        }),
      );
    });
  });

  it('should call onStateChange when drawerWidth changes', async () => {
    const { rerender } = renderWithContext(
      createContextValue({
        drawerWidth: 500,
      }),
    );

    await waitFor(() => {
      expect(mockOnStateChange).toHaveBeenCalledTimes(1);
    });

    rerender(
      <LightspeedDrawerContext.Provider
        value={createContextValue({
          drawerWidth: 700,
        })}
      >
        <LightspeedDrawerStateExposer onStateChange={mockOnStateChange} />
      </LightspeedDrawerContext.Provider>,
    );

    await waitFor(() => {
      expect(mockOnStateChange).toHaveBeenCalledWith(
        expect.objectContaining({
          drawerWidth: 700,
        }),
      );
    });
  });

  it('should call onStateChange when displayMode changes', async () => {
    const { rerender } = renderWithContext(
      createContextValue({
        displayMode: ChatbotDisplayMode.default,
      }),
    );

    await waitFor(() => {
      expect(mockOnStateChange).toHaveBeenCalledWith(
        expect.objectContaining({
          isDrawerOpen: false,
        }),
      );
    });

    rerender(
      <LightspeedDrawerContext.Provider
        value={createContextValue({
          displayMode: ChatbotDisplayMode.docked,
        })}
      >
        <LightspeedDrawerStateExposer onStateChange={mockOnStateChange} />
      </LightspeedDrawerContext.Provider>,
    );

    await waitFor(() => {
      expect(mockOnStateChange).toHaveBeenCalledWith(
        expect.objectContaining({
          isDrawerOpen: true,
        }),
      );
    });
  });

  it('should render null', () => {
    const { container } = renderWithContext(createContextValue());
    expect(container.firstChild).toBeNull();
  });

  it('should always use lightspeed as the id', async () => {
    renderWithContext(createContextValue());

    await waitFor(() => {
      const callArg = mockOnStateChange.mock.calls[0][0] as DrawerState;
      expect(callArg.id).toBe('lightspeed');
    });
  });

  it('should pass setDrawerWidth function in state', async () => {
    renderWithContext(createContextValue());

    await waitFor(() => {
      const callArg = mockOnStateChange.mock.calls[0][0] as DrawerState;
      expect(callArg.setDrawerWidth).toBe(mockSetDrawerWidth);
    });
  });

  it('should call toggleChatbot when closeDrawer is invoked', async () => {
    renderWithContext(createContextValue());

    await waitFor(() => {
      const callArg = mockOnStateChange.mock.calls[0][0] as DrawerState;
      callArg.closeDrawer();
      expect(mockToggleChatbot).toHaveBeenCalledTimes(1);
    });
  });
});
