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

import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom';

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
  const location = useLocation();
  const { contextValue, shouldRenderOverlayModal } =
    useLightspeedProviderState();

  return (
    <div>
      <div data-testid="pathname">{location.pathname}</div>
      <div data-testid="display-mode">{contextValue.displayMode}</div>
      <div data-testid="is-open">
        {contextValue.isChatbotActive ? 'open' : 'closed'}
      </div>
      <div data-testid="overlay-modal-flag">
        {shouldRenderOverlayModal ? 'yes' : 'no'}
      </div>
      <div data-testid="conversation-id">
        {contextValue.currentConversationId ?? 'none'}
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
        data-testid="set-overlay-mode"
        onClick={() => contextValue.setDisplayMode(ChatbotDisplayMode.default)}
      >
        Set overlay
      </button>
      <button
        type="button"
        data-testid="late-conversation-id"
        onClick={() =>
          contextValue.setCurrentConversationId('late-from-stream')
        }
      >
        Late conversation id
      </button>
      <button
        type="button"
        data-testid="go-catalog"
        onClick={() => navigate('/catalog')}
      >
        Go catalog
      </button>
      <button
        type="button"
        data-testid="go-lightspeed-base"
        onClick={() => navigate('/lightspeed')}
      >
        Go lightspeed base
      </button>
      <button
        type="button"
        data-testid="go-notebooks"
        onClick={() => navigate('/lightspeed/notebooks')}
      >
        Go notebooks
      </button>
      <button
        type="button"
        data-testid="set-embedded-notebooks"
        onClick={() =>
          contextValue.setDisplayMode(
            ChatbotDisplayMode.embedded,
            undefined,
            'notebooks',
          )
        }
      >
        Set embedded notebooks
      </button>
      <button
        type="button"
        data-testid="set-embedded-notebook-session"
        onClick={() =>
          contextValue.setDisplayMode(ChatbotDisplayMode.embedded, undefined, {
            notebookSessionId: 'sess-1',
          })
        }
      >
        Set embedded notebook session
      </button>
      <button
        type="button"
        data-testid="set-shell-notebooks-tab"
        onClick={() => contextValue.setShellViewTab(1)}
      >
        Shell notebooks tab
      </button>
      <button
        type="button"
        data-testid="set-shell-chat-tab"
        onClick={() => contextValue.setShellViewTab(0)}
      >
        Shell chat tab
      </button>
      <button
        type="button"
        data-testid="set-embedded-plain"
        onClick={() => contextValue.setDisplayMode(ChatbotDisplayMode.embedded)}
      >
        Set embedded plain
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

    it('navigates to /lightspeed/notebooks when setDisplayMode(embedded, undefined, notebooks)', async () => {
      renderWithRouter(['/catalog']);

      screen.getByTestId('set-embedded-notebooks').click();

      await waitFor(() => {
        expect(screen.getByTestId('pathname')).toHaveTextContent(
          '/lightspeed/notebooks',
        );
        expect(screen.getByTestId('display-mode')).toHaveTextContent(
          ChatbotDisplayMode.embedded,
        );
      });
    });

    it('navigates to notebook session URL when setDisplayMode passes notebookSessionId', async () => {
      renderWithRouter(['/catalog']);

      screen.getByTestId('set-embedded-notebook-session').click();

      await waitFor(() => {
        expect(screen.getByTestId('pathname')).toHaveTextContent(
          '/lightspeed/notebooks/sess-1',
        );
      });
    });

    it('navigates to /lightspeed/notebooks when setDisplayMode(embedded) if shellViewTab is 1', async () => {
      renderWithRouter(['/catalog']);

      screen.getByTestId('set-shell-notebooks-tab').click();
      screen.getByTestId('set-embedded-plain').click();

      await waitFor(() => {
        expect(screen.getByTestId('pathname')).toHaveTextContent(
          '/lightspeed/notebooks',
        );
      });
    });

    it('navigates to /lightspeed when setDisplayMode(embedded) if shellViewTab is 0', async () => {
      renderWithRouter(['/catalog']);

      screen.getByTestId('set-shell-chat-tab').click();
      screen.getByTestId('set-embedded-plain').click();

      await waitFor(() => {
        expect(screen.getByTestId('pathname')).toHaveTextContent('/lightspeed');
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

    it('keeps display mode when navigating between Lightspeed sub-routes (e.g. Chat ↔ Notebooks)', async () => {
      displayModeSettingsRef.displayMode = ChatbotDisplayMode.embedded;

      renderWithRouter(['/lightspeed']);

      await waitFor(() => {
        expect(screen.getByTestId('display-mode')).toHaveTextContent(
          ChatbotDisplayMode.embedded,
        );
      });

      screen.getByTestId('go-notebooks').click();

      await waitFor(() => {
        expect(screen.getByTestId('pathname')).toHaveTextContent(
          '/lightspeed/notebooks',
        );
      });

      expect(screen.getByTestId('display-mode')).toHaveTextContent(
        ChatbotDisplayMode.embedded,
      );

      screen.getByTestId('go-lightspeed-base').click();

      await waitFor(() => {
        expect(screen.getByTestId('pathname')).toHaveTextContent('/lightspeed');
      });

      expect(screen.getByTestId('display-mode')).toHaveTextContent(
        ChatbotDisplayMode.embedded,
      );
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

    it('keeps currentConversationId after leaving /lightspeed/conversation/:id', async () => {
      displayModeSettingsRef.displayMode = ChatbotDisplayMode.default;

      renderWithRouter(['/lightspeed/conversation/active-thread']);

      await waitFor(() => {
        expect(screen.getByTestId('conversation-id')).toHaveTextContent(
          'active-thread',
        );
      });

      screen.getByTestId('go-catalog').click();

      await waitFor(() => {
        expect(screen.getByTestId('conversation-id')).toHaveTextContent(
          'active-thread',
        );
      });
    });

    it('clears currentConversationId when navigating to /lightspeed without conversation segment', async () => {
      displayModeSettingsRef.displayMode = ChatbotDisplayMode.default;

      renderWithRouter(['/lightspeed/conversation/active-thread']);

      await waitFor(() => {
        expect(screen.getByTestId('conversation-id')).toHaveTextContent(
          'active-thread',
        );
      });

      screen.getByTestId('go-lightspeed-base').click();

      await waitFor(() => {
        expect(screen.getByTestId('conversation-id')).toHaveTextContent('none');
      });
    });

    it('navigates to /catalog when switching from fullscreen route to overlay', async () => {
      displayModeSettingsRef.displayMode = ChatbotDisplayMode.embedded;

      renderWithRouter(['/lightspeed/conversation/stream-done']);

      await waitFor(() => {
        expect(screen.getByTestId('display-mode')).toHaveTextContent(
          ChatbotDisplayMode.embedded,
        );
      });

      screen.getByTestId('set-overlay-mode').click();

      await waitFor(() => {
        expect(screen.getByTestId('pathname')).toHaveTextContent('/catalog');
        expect(screen.getByTestId('display-mode')).toHaveTextContent(
          ChatbotDisplayMode.default,
        );
      });
    });

    it('does not navigate to /lightspeed when late stream sets id after overlay switch', async () => {
      displayModeSettingsRef.displayMode = ChatbotDisplayMode.embedded;

      renderWithRouter(['/lightspeed/conversation/before-switch']);

      await waitFor(() => {
        expect(screen.getByTestId('pathname')).toHaveTextContent(
          '/lightspeed/conversation/before-switch',
        );
      });

      screen.getByTestId('set-overlay-mode').click();

      await waitFor(() => {
        expect(screen.getByTestId('pathname')).toHaveTextContent('/catalog');
      });

      screen.getByTestId('late-conversation-id').click();

      await waitFor(() => {
        expect(screen.getByTestId('pathname')).toHaveTextContent('/catalog');
        expect(screen.getByTestId('conversation-id')).toHaveTextContent(
          'late-from-stream',
        );
      });
    });
  });
});
