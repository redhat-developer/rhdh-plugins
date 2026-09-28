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

import { act, render, screen, waitFor } from '@testing-library/react';

import { ChatbotDisplayMode } from '../../const';
import { LightspeedOverlayChat } from '../LightspeedOverlayChat';

let resolveStyles: (() => void) | undefined;
const loadChatPatternflyStyles = jest.fn(
  () =>
    new Promise<void>(resolve => {
      resolveStyles = resolve;
    }),
);

jest.mock('../../loadChatPatternflyStyles', () => ({
  loadChatPatternflyStyles: () => loadChatPatternflyStyles(),
  areChatPatternflyStylesLoaded: () => false,
}));

jest.mock('@patternfly/chatbot', () => ({
  ChatbotModal: ({
    children,
    ...props
  }: {
    children?: React.ReactNode;
    [key: string]: unknown;
  }) => (
    <div data-testid="chatbot-modal" {...props}>
      {children}
    </div>
  ),
}));

jest.mock('../LightspeedChatContainer', () => ({
  LightspeedChatContainer: () => (
    <div data-testid="lightspeed-chat-container">Chat Container</div>
  ),
}));

describe('LightspeedOverlayChat', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resolveStyles = undefined;
  });

  it('shows overlay ChatLoadingFallback until PatternFly styles are ready (RHDHBUGS-3803)', async () => {
    render(
      <LightspeedOverlayChat
        displayMode={ChatbotDisplayMode.default}
        onEscapePress={jest.fn()}
      />,
    );

    const fallback = screen.getByTestId('chat-loading-fallback');
    expect(fallback).toBeInTheDocument();
    expect(screen.queryByTestId('chatbot-modal')).not.toBeInTheDocument();

    // Overlay fallback must be fixed to the FAB-anchored overlay slot — not an
    // unstyled PatternFly modal (which lands in the wrong place before CSS loads).
    expect(fallback).toHaveStyle({ position: 'fixed' });

    await act(async () => {
      resolveStyles?.();
    });

    await waitFor(() => {
      expect(screen.getByTestId('chatbot-modal')).toBeInTheDocument();
    });
    expect(
      screen.queryByTestId('chat-loading-fallback'),
    ).not.toBeInTheDocument();
    expect(screen.getByTestId('lightspeed-chat-container')).toBeInTheDocument();
  });
});
