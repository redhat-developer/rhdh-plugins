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

import { mockUseTranslation } from '../../test-utils/mockTranslations';
import { LightspeedChatBox } from '../LightspeedChatBox';

jest.mock('../../hooks/useTranslation', () => ({
  useTranslation: jest.fn(() => mockUseTranslation()),
}));

jest.mock('../../hooks/useAutoScroll', () => ({
  useAutoScroll: jest.fn(() => ({
    autoScroll: true,
    resumeAutoScroll: jest.fn(),
    stopAutoScroll: jest.fn(),
    scrollToBottom: jest.fn(),
    scrollToTop: jest.fn(),
  })),
}));

jest.mock('../../hooks/useBufferedMessages', () => ({
  useBufferedMessages: jest.fn(messages => {
    return messages || [];
  }),
}));

jest.mock('../../hooks/useFeedbackActions', () => ({
  useFeedbackActions: jest.fn(messages => {
    return messages || [];
  }),
}));

jest.mock('@patternfly/chatbot', () => {
  const actual = jest.requireActual('@patternfly/chatbot');
  return {
    ...actual,
    DeepThinking: ({
      body,
      cardBodyProps,
    }: {
      body: React.ReactNode;
      cardBodyProps?: any;
    }) => (
      <div data-testid="deep-thinking" {...cardBodyProps}>
        {body}
      </div>
    ),
    MessageBox: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="message-box">{children}</div>
    ),
    Message: (props: any) => (
      <div data-testid={`message-${props.role || 'unknown'}`}>
        {props.extraContent?.beforeMainContent}
        {props.content}
        {props.extraContent?.afterMainContent}
      </div>
    ),
  };
});

describe('LightspeedChatBox', () => {
  const defaultProps = {
    userName: 'user:test',
    messages: [],
    announcement: undefined,
    conversationId: 'test-conversation-id',
    profileLoading: false,
    welcomePrompts: [],
    isStreaming: false,
    topicRestrictionEnabled: false,
    displayMode: ChatbotDisplayMode.embedded,
  };

  it('should render reasoning content with newlines using pre-line style', () => {
    const messagesWithReasoning = [
      {
        role: 'bot' as const,
        content: '<think>Line 1\nLine 2\nLine 3</think>Main response content',
        timestamp: '2026-01-22T00:00:00Z',
      },
    ];

    render(
      <LightspeedChatBox {...defaultProps} messages={messagesWithReasoning} />,
    );

    const deepThinking = screen.getByTestId('deep-thinking');
    expect(deepThinking).toBeInTheDocument();

    // Check that the reasoning body contains the content
    const reasoningContent = deepThinking.textContent;
    expect(reasoningContent).toContain('Line 1');
    expect(reasoningContent).toContain('Line 2');
    expect(reasoningContent).toContain('Line 3');

    expect(deepThinking).toHaveStyle({ whiteSpace: 'pre-line' });
  });

  it('should handle reasoning content without newlines', () => {
    const messagesWithReasoning = [
      {
        role: 'bot' as const,
        content: '<think>Single line reasoning</think>Main response',
        name: 'assistant',
        timestamp: '2024-01-01T00:00:00Z',
      },
    ];

    render(
      <LightspeedChatBox {...defaultProps} messages={messagesWithReasoning} />,
    );

    const deepThinking = screen.getByTestId('deep-thinking');
    expect(deepThinking).toBeInTheDocument();
    expect(deepThinking).toHaveTextContent('Single line reasoning');

    expect(deepThinking).toHaveStyle({ whiteSpace: 'pre-line' });
  });

  it('should handle reasoning in progress with newlines', () => {
    const messagesWithReasoningInProgress = [
      {
        role: 'bot' as const,
        content: '<think>Line 1\nLine 2\nLine 3',
        timestamp: '2024-01-01T00:00:00Z',
        name: 'assistant',
      },
    ];

    render(
      <LightspeedChatBox
        {...defaultProps}
        messages={messagesWithReasoningInProgress}
      />,
    );

    const deepThinking = screen.getByTestId('deep-thinking');
    expect(deepThinking).toBeInTheDocument();

    expect(deepThinking).toHaveStyle({ whiteSpace: 'pre-line' });
    expect(deepThinking.textContent).toContain('Line 1');
    expect(deepThinking.textContent).toContain('Line 2');
    expect(deepThinking.textContent).toContain('Line 3');
  });

  it('should handle reasoning content with multiple newlines', () => {
    const messagesWithReasoningInProgress = [
      {
        role: 'bot' as const,
        content: '<think>Line 1\n\n\nLine 2\nLine 3',
        timestamp: '2024-01-01T00:00:00Z',
        name: 'assistant',
      },
    ];

    render(
      <LightspeedChatBox
        {...defaultProps}
        messages={messagesWithReasoningInProgress}
      />,
    );

    const deepThinking = screen.getByTestId('deep-thinking');
    expect(deepThinking).toBeInTheDocument();

    expect(deepThinking).toHaveStyle({ whiteSpace: 'pre-line' });
    expect(deepThinking.textContent).toContain('Line 1');
    expect(deepThinking.textContent).toContain('Line 2');
    expect(deepThinking.textContent).toContain('Line 3');
  });
});
