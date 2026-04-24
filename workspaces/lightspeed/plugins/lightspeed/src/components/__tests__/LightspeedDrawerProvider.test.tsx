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
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { useLightspeedDrawerContext } from '../../hooks/useLightspeedDrawerContext';
import type { LightspeedDrawerContextType } from '../LightspeedDrawerContext';
import { LightspeedDrawerProvider } from '../LightspeedDrawerProvider';

const mockUseLightspeedProviderState = jest.fn();

jest.mock('../../hooks/useLightspeedProviderState', () => ({
  useLightspeedProviderState: () => mockUseLightspeedProviderState(),
}));

jest.mock('@patternfly/chatbot', () => {
  const actual = jest.requireActual('@patternfly/chatbot');
  return {
    ...actual,
    ChatbotModal: ({
      children,
      onClose,
      onEscapePress,
      displayMode,
      className,
      ouiaId,
      'aria-labelledby': ariaLabelledBy,
    }: {
      children: React.ReactNode;
      onClose?: () => void;
      onEscapePress?: () => void;
      displayMode: ChatbotDisplayMode;
      className?: string;
      ouiaId?: string;
      'aria-labelledby'?: string;
    }) => (
      <div
        data-testid="chatbot-modal"
        data-ouia-id={ouiaId}
        data-aria-labelledby={ariaLabelledBy}
        data-display-mode={displayMode}
        className={className}
      >
        {onClose ? (
          <button type="button" data-testid="modal-close" onClick={onClose}>
            Close
          </button>
        ) : null}
        {onEscapePress ? (
          <button
            type="button"
            data-testid="modal-escape-close"
            onClick={() => onEscapePress()}
          >
            Escape close
          </button>
        ) : null}
        {children}
      </div>
    ),
  };
});

jest.mock('../LightspeedChatContainer', () => ({
  LightspeedChatContainer: () => (
    <div data-testid="lightspeed-chat-container">Chat Container</div>
  ),
}));

function baseContextValue(): LightspeedDrawerContextType {
  return {
    isChatbotActive: false,
    toggleChatbot: jest.fn(),
    displayMode: ChatbotDisplayMode.default,
    setDisplayMode: jest.fn(),
    drawerWidth: 400,
    setDrawerWidth: jest.fn(),
    currentConversationId: undefined,
    setCurrentConversationId: jest.fn(),
    draftMessage: '',
    setDraftMessage: jest.fn(),
    draftFileContents: [],
    setDraftFileContents: jest.fn(),
  };
}

describe('LightspeedDrawerProvider', () => {
  const ContextReader = () => {
    const ctx = useLightspeedDrawerContext();
    return <span data-testid="context-display-mode">{ctx.displayMode}</span>;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    const closeChatbot = jest.fn();
    mockUseLightspeedProviderState.mockReturnValue({
      contextValue: baseContextValue(),
      shouldRenderOverlayModal: false,
      closeChatbot,
    });
  });

  it('renders children', () => {
    render(
      <LightspeedDrawerProvider>
        <div>child content</div>
      </LightspeedDrawerProvider>,
    );
    expect(screen.getByText('child content')).toBeInTheDocument();
  });

  it('exposes hook contextValue to consumers', () => {
    mockUseLightspeedProviderState.mockReturnValue({
      contextValue: {
        ...baseContextValue(),
        displayMode: ChatbotDisplayMode.docked,
      },
      shouldRenderOverlayModal: false,
      closeChatbot: jest.fn(),
    });

    render(
      <LightspeedDrawerProvider>
        <ContextReader />
      </LightspeedDrawerProvider>,
    );

    expect(screen.getByTestId('context-display-mode')).toHaveTextContent(
      ChatbotDisplayMode.docked,
    );
  });

  it('does not render overlay ChatbotModal when shouldRenderOverlayModal is false', () => {
    render(
      <LightspeedDrawerProvider>
        <div />
      </LightspeedDrawerProvider>,
    );
    expect(screen.queryByTestId('chatbot-modal')).not.toBeInTheDocument();
  });

  it('renders ChatbotModal with LightspeedChatContainer when shouldRenderOverlayModal is true', () => {
    const closeChatbot = jest.fn();
    mockUseLightspeedProviderState.mockReturnValue({
      contextValue: {
        ...baseContextValue(),
        displayMode: ChatbotDisplayMode.default,
      },
      shouldRenderOverlayModal: true,
      closeChatbot,
    });

    render(
      <LightspeedDrawerProvider>
        <div />
      </LightspeedDrawerProvider>,
    );

    const modal = screen.getByTestId('chatbot-modal');
    expect(modal).toHaveAttribute(
      'data-display-mode',
      ChatbotDisplayMode.default,
    );
    expect(modal).toHaveAttribute('data-ouia-id', 'LightspeedChatbotModal');
    expect(modal).toHaveAttribute(
      'data-aria-labelledby',
      'lightspeed-chatpopup-modal',
    );
    expect(modal.className).toBeTruthy();
    expect(screen.getByTestId('lightspeed-chat-container')).toBeInTheDocument();
  });

  it('wires ChatbotModal onEscapePress to closeChatbot from the hook', async () => {
    const user = userEvent.setup();
    const closeChatbot = jest.fn();
    mockUseLightspeedProviderState.mockReturnValue({
      contextValue: baseContextValue(),
      shouldRenderOverlayModal: true,
      closeChatbot,
    });

    render(
      <LightspeedDrawerProvider>
        <div />
      </LightspeedDrawerProvider>,
    );

    await user.click(screen.getByTestId('modal-escape-close'));
    expect(closeChatbot).toHaveBeenCalledTimes(1);
  });
});
