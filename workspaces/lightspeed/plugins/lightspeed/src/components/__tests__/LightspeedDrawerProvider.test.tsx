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

import { useContext } from 'react';
import { MemoryRouter } from 'react-router-dom';

import { ChatbotDisplayMode } from '@patternfly/chatbot';
import { act, fireEvent, render, screen } from '@testing-library/react';

import { LightspeedDrawerContext } from '../LightspeedDrawerContext';
import { LightspeedDrawerProvider } from '../LightspeedDrawerProvider';

// Mock the LightspeedChatContainer to avoid complex dependencies
jest.mock('../LightspeedChatContainer', () => ({
  LightspeedChatContainer: () => (
    <div data-testid="lightspeed-chat-container">Chat Container</div>
  ),
}));

// Test component to access and display context values
const ContextConsumer = () => {
  const context = useContext(LightspeedDrawerContext);
  if (!context) return null;

  return (
    <div>
      <span data-testid="display-mode">{context.displayMode}</span>
      <span data-testid="is-chatbot-active">
        {context.isChatbotActive.toString()}
      </span>
      <span data-testid="is-settings-dropdown-open">
        {context.isSettingsDropdownOpen.toString()}
      </span>
      <button
        data-testid="toggle-chatbot"
        onClick={() => context.toggleChatbot()}
      >
        Toggle Chatbot
      </button>
      <button
        data-testid="set-display-mode-fullscreen"
        onClick={() => context.setDisplayMode(ChatbotDisplayMode.embedded)}
      >
        Set Fullscreen
      </button>
      <button
        data-testid="set-display-mode-docked"
        onClick={() => context.setDisplayMode(ChatbotDisplayMode.docked)}
      >
        Set Docked
      </button>
      <button
        data-testid="set-display-mode-overlay"
        onClick={() => context.setDisplayMode(ChatbotDisplayMode.default)}
      >
        Set Overlay
      </button>
      <button
        data-testid="set-settings-dropdown-open"
        onClick={() => context.setIsSettingsDropdownOpen(true)}
      >
        Open Settings Dropdown
      </button>
      <button
        data-testid="set-settings-dropdown-closed"
        onClick={() => context.setIsSettingsDropdownOpen(false)}
      >
        Close Settings Dropdown
      </button>
    </div>
  );
};

const renderWithRouter = (initialEntries: string[] = ['/']) => {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <LightspeedDrawerProvider>
        <ContextConsumer />
      </LightspeedDrawerProvider>
    </MemoryRouter>,
  );
};

describe('LightspeedDrawerProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Escape key display mode cycling', () => {
    it('should cycle from fullscreen to docked when Escape is pressed', async () => {
      renderWithRouter(['/lightspeed']);

      // Verify we start in fullscreen mode (embedded) on lightspeed route
      expect(screen.getByTestId('display-mode').textContent).toBe(
        ChatbotDisplayMode.embedded,
      );

      // Press Escape
      await act(async () => {
        fireEvent.keyDown(document, { key: 'Escape' });
      });

      // Should now be in docked mode
      expect(screen.getByTestId('display-mode').textContent).toBe(
        ChatbotDisplayMode.docked,
      );
    });

    it('should cycle from docked to overlay when Escape is pressed', async () => {
      renderWithRouter();

      // Open chatbot first
      await act(async () => {
        fireEvent.click(screen.getByTestId('toggle-chatbot'));
      });

      // Set to docked mode
      await act(async () => {
        fireEvent.click(screen.getByTestId('set-display-mode-docked'));
      });

      expect(screen.getByTestId('display-mode').textContent).toBe(
        ChatbotDisplayMode.docked,
      );

      // Press Escape
      await act(async () => {
        fireEvent.keyDown(document, { key: 'Escape' });
      });

      // Should now be in overlay mode
      expect(screen.getByTestId('display-mode').textContent).toBe(
        ChatbotDisplayMode.default,
      );
    });

    it('should close chatbot when Escape is pressed in overlay mode', async () => {
      renderWithRouter();

      // Open chatbot
      await act(async () => {
        fireEvent.click(screen.getByTestId('toggle-chatbot'));
      });

      expect(screen.getByTestId('is-chatbot-active').textContent).toBe('true');
      expect(screen.getByTestId('display-mode').textContent).toBe(
        ChatbotDisplayMode.default,
      );

      // Press Escape
      await act(async () => {
        fireEvent.keyDown(document, { key: 'Escape' });
      });

      // Chatbot should be closed
      expect(screen.getByTestId('is-chatbot-active').textContent).toBe('false');
    });

    it('should not cycle display mode when settings dropdown is open', async () => {
      renderWithRouter();

      // Open chatbot
      await act(async () => {
        fireEvent.click(screen.getByTestId('toggle-chatbot'));
      });

      // Set to docked mode
      await act(async () => {
        fireEvent.click(screen.getByTestId('set-display-mode-docked'));
      });

      // Open settings dropdown
      await act(async () => {
        fireEvent.click(screen.getByTestId('set-settings-dropdown-open'));
      });

      expect(screen.getByTestId('is-settings-dropdown-open').textContent).toBe(
        'true',
      );

      // Press Escape - should not cycle mode because dropdown is open
      await act(async () => {
        fireEvent.keyDown(document, { key: 'Escape' });
      });

      // Should still be in docked mode
      expect(screen.getByTestId('display-mode').textContent).toBe(
        ChatbotDisplayMode.docked,
      );
    });

    it('should not respond to Escape when chatbot is closed', async () => {
      renderWithRouter();

      // Chatbot should be closed initially
      expect(screen.getByTestId('is-chatbot-active').textContent).toBe('false');

      const initialDisplayMode = screen.getByTestId('display-mode').textContent;

      // Press Escape
      await act(async () => {
        fireEvent.keyDown(document, { key: 'Escape' });
      });

      // Display mode should remain unchanged
      expect(screen.getByTestId('display-mode').textContent).toBe(
        initialDisplayMode,
      );
    });
  });

  describe('isSettingsDropdownOpen state', () => {
    it('should track settings dropdown open state', async () => {
      renderWithRouter();

      // Initially should be false
      expect(screen.getByTestId('is-settings-dropdown-open').textContent).toBe(
        'false',
      );

      // Open settings dropdown
      await act(async () => {
        fireEvent.click(screen.getByTestId('set-settings-dropdown-open'));
      });

      expect(screen.getByTestId('is-settings-dropdown-open').textContent).toBe(
        'true',
      );

      // Close settings dropdown
      await act(async () => {
        fireEvent.click(screen.getByTestId('set-settings-dropdown-closed'));
      });

      expect(screen.getByTestId('is-settings-dropdown-open').textContent).toBe(
        'false',
      );
    });
  });
});
