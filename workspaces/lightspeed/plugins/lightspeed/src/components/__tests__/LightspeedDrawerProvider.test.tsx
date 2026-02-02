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

import { MemoryRouter } from 'react-router-dom';

import { ChatbotDisplayMode } from '@patternfly/chatbot';
import { render, screen, waitFor } from '@testing-library/react';

import { useLightspeedDrawerContext } from '../../hooks/useLightspeedDrawerContext';
import { LightspeedDrawerProvider } from '../LightspeedDrawerProvider';

const mockSetPersistedDisplayMode = jest.fn();
const mockUseDisplayModeSettings = jest.fn(() => ({
  displayMode: ChatbotDisplayMode.default,
  setDisplayMode: mockSetPersistedDisplayMode,
}));

const mockUser = 'user:default/test';
const mockUseBackstageUserIdentity = jest.fn(() => mockUser);

jest.mock('../../hooks/useDisplayModeSettings', () => ({
  useDisplayModeSettings: () => mockUseDisplayModeSettings(),
}));

jest.mock('../../hooks/useBackstageUserIdentity', () => ({
  useBackstageUserIdentity: () => mockUseBackstageUserIdentity(),
}));

jest.mock('../LightspeedChatContainer', () => ({
  LightspeedChatContainer: () => (
    <div data-testid="lightspeed-chat-container">Chat Container</div>
  ),
}));

describe('LightspeedDrawerProvider', () => {
  const TestComponent = () => {
    const context = useLightspeedDrawerContext();
    return (
      <div>
        <div data-testid="display-mode">{context.displayMode}</div>
        <div data-testid="is-open">
          {context.isChatbotActive ? 'open' : 'closed'}
        </div>
        <button data-testid="toggle-button" onClick={context.toggleChatbot}>
          Toggle
        </button>
        <button
          data-testid="set-mode-button"
          onClick={() => context.setDisplayMode(ChatbotDisplayMode.docked)}
        >
          Set Docked
        </button>
      </div>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseDisplayModeSettings.mockReturnValue({
      displayMode: ChatbotDisplayMode.default,
      setDisplayMode: mockSetPersistedDisplayMode,
    });
  });

  const renderWithRouter = (initialEntries = ['/']) => {
    return render(
      <MemoryRouter initialEntries={initialEntries}>
        <LightspeedDrawerProvider>
          <TestComponent />
        </LightspeedDrawerProvider>
      </MemoryRouter>,
    );
  };

  describe('initialization', () => {
    it('should initialize with persisted display mode', () => {
      mockUseDisplayModeSettings.mockReturnValue({
        displayMode: ChatbotDisplayMode.docked,
        setDisplayMode: mockSetPersistedDisplayMode,
      });

      renderWithRouter();

      expect(screen.getByTestId('display-mode')).toHaveTextContent(
        ChatbotDisplayMode.docked,
      );
    });

    it('should initialize with default mode for first-time users', () => {
      mockUseDisplayModeSettings.mockReturnValue({
        displayMode: ChatbotDisplayMode.default,
        setDisplayMode: mockSetPersistedDisplayMode,
      });

      renderWithRouter();

      expect(screen.getByTestId('display-mode')).toHaveTextContent(
        ChatbotDisplayMode.default,
      );
    });

    it('should start with chatbot closed', () => {
      renderWithRouter();

      expect(screen.getByTestId('is-open')).toHaveTextContent('closed');
    });
  });

  describe('opening chatbot', () => {
    it('should open chatbot in persisted overlay mode', async () => {
      mockUseDisplayModeSettings.mockReturnValue({
        displayMode: ChatbotDisplayMode.default,
        setDisplayMode: mockSetPersistedDisplayMode,
      });

      renderWithRouter();

      const toggleButton = screen.getByTestId('toggle-button');
      toggleButton.click();

      await waitFor(() => {
        expect(screen.getByTestId('is-open')).toHaveTextContent('open');
      });

      expect(screen.getByTestId('display-mode')).toHaveTextContent(
        ChatbotDisplayMode.default,
      );
    });

    it('should open chatbot in persisted docked mode', async () => {
      mockUseDisplayModeSettings.mockReturnValue({
        displayMode: ChatbotDisplayMode.docked,
        setDisplayMode: mockSetPersistedDisplayMode,
      });

      renderWithRouter();

      const toggleButton = screen.getByTestId('toggle-button');
      toggleButton.click();

      await waitFor(() => {
        expect(screen.getByTestId('is-open')).toHaveTextContent('open');
      });

      expect(screen.getByTestId('display-mode')).toHaveTextContent(
        ChatbotDisplayMode.docked,
      );
    });
  });

  describe('closing chatbot', () => {
    it('should close chatbot without resetting display mode', async () => {
      mockUseDisplayModeSettings.mockReturnValue({
        displayMode: ChatbotDisplayMode.docked,
        setDisplayMode: mockSetPersistedDisplayMode,
      });

      renderWithRouter();

      const toggleButton = screen.getByTestId('toggle-button');
      toggleButton.click();

      await waitFor(() => {
        expect(screen.getByTestId('is-open')).toHaveTextContent('open');
      });

      toggleButton.click();

      await waitFor(() => {
        expect(screen.getByTestId('is-open')).toHaveTextContent('closed');
      });

      expect(screen.getByTestId('display-mode')).toHaveTextContent(
        ChatbotDisplayMode.docked,
      );
    });
  });

  describe('setting display mode', () => {
    it('should persist display mode when user changes it', async () => {
      renderWithRouter();

      const setModeButton = screen.getByTestId('set-mode-button');
      setModeButton.click();

      await waitFor(() => {
        expect(mockSetPersistedDisplayMode).toHaveBeenCalledWith(
          ChatbotDisplayMode.docked,
        );
      });
    });

    it('should update display mode in context', async () => {
      renderWithRouter();

      const setModeButton = screen.getByTestId('set-mode-button');
      setModeButton.click();

      await waitFor(() => {
        expect(screen.getByTestId('display-mode')).toHaveTextContent(
          ChatbotDisplayMode.default,
        );
      });
    });
  });

  describe('lightspeed route handling', () => {
    it('should set embedded mode when on /lightspeed route', async () => {
      mockUseDisplayModeSettings.mockReturnValue({
        displayMode: ChatbotDisplayMode.default,
        setDisplayMode: mockSetPersistedDisplayMode,
      });

      renderWithRouter(['/lightspeed']);

      await waitFor(() => {
        expect(screen.getByTestId('display-mode')).toHaveTextContent(
          ChatbotDisplayMode.embedded,
        );
        expect(screen.getByTestId('is-open')).toHaveTextContent('open');
      });
    });

    it('should preserve docked mode when on /lightspeed route if persisted', async () => {
      mockUseDisplayModeSettings.mockReturnValue({
        displayMode: ChatbotDisplayMode.docked,
        setDisplayMode: mockSetPersistedDisplayMode,
      });

      renderWithRouter(['/lightspeed']);

      await waitFor(() => {
        expect(screen.getByTestId('display-mode')).toHaveTextContent(
          ChatbotDisplayMode.embedded,
        );
      });
    });

    it('should restore persisted mode when leaving /lightspeed route', async () => {
      mockUseDisplayModeSettings.mockReturnValue({
        displayMode: ChatbotDisplayMode.docked,
        setDisplayMode: mockSetPersistedDisplayMode,
      });

      const { rerender } = renderWithRouter(['/lightspeed']);

      await waitFor(() => {
        expect(screen.getByTestId('display-mode')).toHaveTextContent(
          ChatbotDisplayMode.embedded,
        );
      });

      rerender(
        <MemoryRouter initialEntries={['/catalog']}>
          <LightspeedDrawerProvider>
            <TestComponent />
          </LightspeedDrawerProvider>
        </MemoryRouter>,
      );

      await waitFor(() => {
        expect(screen.getByTestId('display-mode')).toHaveTextContent(
          ChatbotDisplayMode.embedded,
        );
      });
    });
  });
});
