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

import { MemoryRouter, useNavigate } from 'react-router-dom';

import { ChatbotDisplayMode } from '@patternfly/chatbot';
import { render, screen, waitFor } from '@testing-library/react';

import { LIGHTSPEED_APP_DRAWER_ID } from '../../const';
import { useBackstageUserIdentity } from '../useBackstageUserIdentity';
import { useDisplayModeSettings } from '../useDisplayModeSettings';
import { useLightspeedProviderState } from '../useLightspeedProviderState';

const mockOpenDrawer = jest.fn();
const mockCloseDrawer = jest.fn();

jest.mock('@red-hat-developer-hub/backstage-plugin-app-react', () => ({
  useAppDrawer: () => ({
    activeDrawerId: null,
    isOpen: jest.fn(),
    getWidth: jest.fn(),
    openDrawer: mockOpenDrawer,
    closeDrawer: mockCloseDrawer,
    toggleDrawer: jest.fn(),
    setWidth: jest.fn(),
  }),
}));

jest.mock('../useDisplayModeSettings');
jest.mock('../useBackstageUserIdentity');

const mockSetPersistedDisplayMode = jest.fn();
const displayModeSettingsRef: {
  displayMode: ChatbotDisplayMode;
} = { displayMode: ChatbotDisplayMode.default };

const mockUser = 'user:default/test';

function HookHarness() {
  const navigate = useNavigate();
  const { contextValue, shouldRenderOverlayModal } =
    useLightspeedProviderState();

  return (
    <div>
      <div data-testid="display-mode">{contextValue.displayMode}</div>
      <div data-testid="is-open">
        {contextValue.isChatbotActive ? 'open' : 'closed'}
      </div>
      <div data-testid="overlay-modal-flag">
        {shouldRenderOverlayModal ? 'yes' : 'no'}
      </div>
      <button
        type="button"
        data-testid="toggle-button"
        onClick={() => contextValue.toggleChatbot()}
      >
        Toggle
      </button>
      <button
        type="button"
        data-testid="set-mode-button"
        onClick={() => contextValue.setDisplayMode(ChatbotDisplayMode.docked)}
      >
        Set Docked
      </button>
      <button
        type="button"
        data-testid="go-catalog"
        onClick={() => navigate('/catalog')}
      >
        Go catalog
      </button>
    </div>
  );
}

function renderWithRouter(initialEntries: string[] = ['/']) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <HookHarness />
    </MemoryRouter>,
  );
}

describe('useLightspeedProviderState', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockOpenDrawer.mockClear();
    mockCloseDrawer.mockClear();
    displayModeSettingsRef.displayMode = ChatbotDisplayMode.default;

    jest.mocked(useDisplayModeSettings).mockImplementation(() => ({
      displayMode: displayModeSettingsRef.displayMode,
      setDisplayMode: (mode: ChatbotDisplayMode) => {
        mockSetPersistedDisplayMode(mode);
        displayModeSettingsRef.displayMode = mode;
      },
    }));

    jest.mocked(useBackstageUserIdentity).mockReturnValue(mockUser);
  });

  describe('initialization', () => {
    it('initializes with persisted display mode', () => {
      displayModeSettingsRef.displayMode = ChatbotDisplayMode.docked;

      renderWithRouter();

      expect(screen.getByTestId('display-mode')).toHaveTextContent(
        ChatbotDisplayMode.docked,
      );
    });

    it('initializes with default mode for first-time users', () => {
      displayModeSettingsRef.displayMode = ChatbotDisplayMode.default;

      renderWithRouter();

      expect(screen.getByTestId('display-mode')).toHaveTextContent(
        ChatbotDisplayMode.default,
      );
    });

    it('starts with chatbot closed', () => {
      renderWithRouter();

      expect(screen.getByTestId('is-open')).toHaveTextContent('closed');
      expect(screen.getByTestId('overlay-modal-flag')).toHaveTextContent('no');
    });
  });

  describe('opening chatbot', () => {
    it('opens chatbot in persisted overlay mode', async () => {
      displayModeSettingsRef.displayMode = ChatbotDisplayMode.default;

      renderWithRouter();

      screen.getByTestId('toggle-button').click();

      await waitFor(() => {
        expect(screen.getByTestId('is-open')).toHaveTextContent('open');
      });

      expect(screen.getByTestId('display-mode')).toHaveTextContent(
        ChatbotDisplayMode.default,
      );
      expect(mockCloseDrawer).toHaveBeenCalledWith(LIGHTSPEED_APP_DRAWER_ID);
      expect(mockOpenDrawer).not.toHaveBeenCalled();
      await waitFor(() => {
        expect(screen.getByTestId('overlay-modal-flag')).toHaveTextContent(
          'yes',
        );
      });
    });

    it('opens chatbot in persisted docked mode', async () => {
      displayModeSettingsRef.displayMode = ChatbotDisplayMode.docked;

      renderWithRouter();

      screen.getByTestId('toggle-button').click();

      await waitFor(() => {
        expect(screen.getByTestId('is-open')).toHaveTextContent('open');
      });

      expect(screen.getByTestId('display-mode')).toHaveTextContent(
        ChatbotDisplayMode.docked,
      );
      expect(mockOpenDrawer).toHaveBeenCalledWith(LIGHTSPEED_APP_DRAWER_ID);
    });

    it('opens chatbot in persisted fullscreen (embedded) by navigating to /lightspeed', async () => {
      displayModeSettingsRef.displayMode = ChatbotDisplayMode.embedded;

      renderWithRouter(['/catalog']);

      screen.getByTestId('toggle-button').click();

      await waitFor(() => {
        expect(screen.getByTestId('is-open')).toHaveTextContent('open');
      });

      expect(screen.getByTestId('display-mode')).toHaveTextContent(
        ChatbotDisplayMode.embedded,
      );
      expect(screen.getByTestId('overlay-modal-flag')).toHaveTextContent('no');
    });
  });

  describe('closing chatbot', () => {
    it('closes chatbot without resetting display mode', async () => {
      displayModeSettingsRef.displayMode = ChatbotDisplayMode.docked;

      renderWithRouter();

      screen.getByTestId('toggle-button').click();

      await waitFor(() => {
        expect(screen.getByTestId('is-open')).toHaveTextContent('open');
      });

      screen.getByTestId('toggle-button').click();

      await waitFor(() => {
        expect(screen.getByTestId('is-open')).toHaveTextContent('closed');
      });

      expect(screen.getByTestId('display-mode')).toHaveTextContent(
        ChatbotDisplayMode.docked,
      );
      expect(mockCloseDrawer).toHaveBeenCalledWith(LIGHTSPEED_APP_DRAWER_ID);
    });
  });

  describe('setDisplayMode', () => {
    it('persists display mode when user changes it', async () => {
      renderWithRouter();

      screen.getByTestId('set-mode-button').click();

      await waitFor(() => {
        expect(mockSetPersistedDisplayMode).toHaveBeenCalledWith(
          ChatbotDisplayMode.docked,
        );
      });
    });

    it('updates display mode in context after setDisplayMode(docked)', async () => {
      renderWithRouter();

      screen.getByTestId('set-mode-button').click();

      await waitFor(() => {
        expect(screen.getByTestId('display-mode')).toHaveTextContent(
          ChatbotDisplayMode.docked,
        );
      });
    });
  });

  describe('/lightspeed route handling', () => {
    it('sets embedded mode when on /lightspeed route', async () => {
      displayModeSettingsRef.displayMode = ChatbotDisplayMode.default;

      renderWithRouter(['/lightspeed']);

      await waitFor(() => {
        expect(screen.getByTestId('display-mode')).toHaveTextContent(
          ChatbotDisplayMode.embedded,
        );
        expect(screen.getByTestId('is-open')).toHaveTextContent('open');
      });
    });

    it('forces embedded UI when on /lightspeed even if persisted mode is docked', async () => {
      displayModeSettingsRef.displayMode = ChatbotDisplayMode.docked;

      renderWithRouter(['/lightspeed']);

      await waitFor(() => {
        expect(screen.getByTestId('display-mode')).toHaveTextContent(
          ChatbotDisplayMode.embedded,
        );
      });
    });

    it('restores persisted docked mode after navigating away from /lightspeed', async () => {
      displayModeSettingsRef.displayMode = ChatbotDisplayMode.docked;

      renderWithRouter(['/lightspeed']);

      await waitFor(() => {
        expect(screen.getByTestId('display-mode')).toHaveTextContent(
          ChatbotDisplayMode.embedded,
        );
      });

      screen.getByTestId('go-catalog').click();

      await waitFor(() => {
        expect(screen.getByTestId('display-mode')).toHaveTextContent(
          ChatbotDisplayMode.docked,
        );
      });
    });

    it('uses overlay when leaving /lightspeed while fullscreen preference is persisted', async () => {
      displayModeSettingsRef.displayMode = ChatbotDisplayMode.embedded;

      renderWithRouter(['/lightspeed']);

      await waitFor(() => {
        expect(screen.getByTestId('display-mode')).toHaveTextContent(
          ChatbotDisplayMode.embedded,
        );
        expect(screen.getByTestId('is-open')).toHaveTextContent('open');
      });

      screen.getByTestId('go-catalog').click();

      await waitFor(() => {
        expect(screen.getByTestId('display-mode')).toHaveTextContent(
          ChatbotDisplayMode.default,
        );
      });
    });
  });
});
