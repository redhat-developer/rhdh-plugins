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

import {
  ForwardedRef,
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from 'react';

import GlobalStyles from '@mui/material/GlobalStyles';
import { styled } from '@mui/material/styles';
import {
  ChatbotDisplayMode,
  ChatbotWelcomePrompt,
  DeepThinking,
  DeepThinkingProps,
  Message,
  MessageBox,
  MessageBoxHandle,
  MessageProps,
  ToolCall as PatternFlyToolCall,
  WelcomePrompt,
} from '@patternfly/chatbot';
import { Alert } from '@patternfly/react-core';

import { useAutoScroll } from '../hooks/useAutoScroll';
import { useBufferedMessages } from '../hooks/useBufferedMessages';
import { useFeedbackActions } from '../hooks/useFeedbackActions';
import { useTranslation } from '../hooks/useTranslation';
import { ToolCall } from '../types';
import { parseReasoning } from '../utils/reasoningParser';
import { mapToPatternFlyToolCall } from '../utils/toolCallMapper';

const DEEP_THINKING_CLASS = 'lightspeed-deep-thinking';

const StyledMessageBox = styled(MessageBox, {
  shouldForwardProp: (prop: string) =>
    !['isNewChat', 'hasPrompts', 'isEmbeddedMode'].includes(prop),
})<{ isNewChat?: boolean; hasPrompts?: boolean; isEmbeddedMode?: boolean }>(
  ({ theme, isNewChat, hasPrompts, isEmbeddedMode }) => ({
    maxWidth: 'unset !important',
    '& div.pf-chatbot__message--user': {
      '& div.pf-chatbot__message-text': {
        '& p': {
          color: theme.palette.common.white,
        },
      },
    },
    ...(isNewChat
      ? {
          flex: 'none',
          height: 'auto',
          overflow: 'visible',
        }
      : {
          flex: 1,
          minHeight: 0,
        }),
    ...(hasPrompts && {
      justifyContent: 'flex-end',
    }),
    ...(hasPrompts &&
      !isEmbeddedMode && {
        '& div.pf-chatbot__prompt-suggestions': {
          flexDirection: 'column !important',
        },
      }),
  }),
);

const StyledAlert = styled(Alert)({
  background: 'unset !important',
});

interface ExtendedMessageProps extends MessageProps {
  toolCalls?: ToolCall[];
}

type LightspeedChatBoxProps = {
  userName?: string;
  messages: ExtendedMessageProps[];
  profileLoading: boolean;
  announcement: string | undefined;
  topicRestrictionEnabled: boolean;
  welcomePrompts: WelcomePrompt[];
  conversationId: string;
  isStreaming: boolean;
  displayMode?: ChatbotDisplayMode;
};

export interface ScrollContainerHandle {
  scrollToBottom: () => void;
}

export const LightspeedChatBox = forwardRef(
  (
    {
      userName,
      messages,
      announcement,
      conversationId,
      profileLoading,
      welcomePrompts,
      isStreaming,
      topicRestrictionEnabled,
      displayMode,
    }: LightspeedChatBoxProps,
    ref: ForwardedRef<ScrollContainerHandle | null>,
  ) => {
    const scrollQueued = useRef(false);
    const containerRef = useRef<MessageBoxHandle>(null);
    const { t } = useTranslation();

    const cmessages = useBufferedMessages(messages, 30);
    const { autoScroll, scrollToBottom, scrollToTop } =
      useAutoScroll(containerRef);
    const conversationMessages = useFeedbackActions(
      cmessages,
      conversationId,
      isStreaming,
    );

    useImperativeHandle(ref, () => ({
      scrollToBottom: () => {
        if (scrollQueued.current) return;
        scrollQueued.current = true;

        requestAnimationFrame(() => {
          scrollToBottom();
          scrollQueued.current = false;
        });
      },
    }));

    // Auto-scrolls to the latest message
    useEffect(() => {
      if (!autoScroll || scrollQueued.current) return undefined;

      scrollQueued.current = true;

      const rafId = requestAnimationFrame(() => {
        const container = containerRef.current;
        if (!container) return;

        setTimeout(() => {
          container.scrollTo({
            top: container.scrollHeight,
            behavior: 'auto',
          });
        }, 0);

        scrollQueued.current = false;
      });

      return () => {
        cancelAnimationFrame(rafId);
        scrollQueued.current = false;
      };

      // eslint-disable-next-line
    }, [autoScroll, cmessages, containerRef]);

    const isNewChat = welcomePrompts.length > 0 && messages.length === 0;
    const isEmbeddedMode = displayMode === ChatbotDisplayMode.embedded;

    return (
      <StyledMessageBox
        isNewChat={isNewChat}
        hasPrompts={welcomePrompts.length > 0}
        isEmbeddedMode={isEmbeddedMode}
        announcement={announcement}
        ref={containerRef}
        onScrollToTopClick={scrollToTop}
        onScrollToBottomClick={scrollToBottom}
        jumpButtonBottomProps={{ 'aria-label': t('aria.scroll.down') }}
        jumpButtonTopProps={{ 'aria-label': t('aria.scroll.up') }}
        jumpButtonBottomTooltipProps={{ content: t('tooltip.backToBottom') }}
        jumpButtonTopTooltipProps={{ content: t('tooltip.backToTop') }}
      >
        <div>
          <GlobalStyles
            styles={{
              '@keyframes lightspeedDeepThinking': {
                '0%': { opacity: 0.65 },
                '50%': { opacity: 1 },
                '100%': { opacity: 0.65 },
              },
              [`.${DEEP_THINKING_CLASS}`]: {
                animation: 'lightspeedDeepThinking 1.6s ease-in-out infinite',
              },
            }}
          />
          <StyledAlert title={t('aria.important')} variant="info" isInline>
            {topicRestrictionEnabled
              ? t('disclaimer.withValidation')
              : t('disclaimer.withoutValidation')}
          </StyledAlert>
          <br />
        </div>
        {welcomePrompts.length ? (
          <ChatbotWelcomePrompt
            title={t('chatbox.welcome.greeting' as any, {
              userName: profileLoading
                ? t('user.loading')
                : (userName ?? t('user.guest')),
            })}
            description={t('chatbox.welcome.description')}
            prompts={welcomePrompts}
            style={{ paddingBottom: '0' }}
          />
        ) : (
          <br />
        )}
        {conversationMessages.map((message, index) => {
          const messageContent = message.content as string;
          const parsedReasoning = parseReasoning(messageContent || '');

          const firstToolCall = message.toolCalls?.[0];
          const toolCallProp = firstToolCall
            ? mapToPatternFlyToolCall(firstToolCall, t, message.role)
            : undefined;

          const additionalToolCalls = message.toolCalls?.slice(1);

          const extraContentParts: {
            beforeMainContent?: React.ReactNode;
            afterMainContent?: React.ReactNode;
          } = {};

          let deepThinking: DeepThinkingProps | undefined = undefined;

          if (
            parsedReasoning.isReasoningInProgress ||
            parsedReasoning.hasReasoning
          ) {
            const reasoningContent = parsedReasoning.reasoning;

            if (reasoningContent) {
              deepThinking = {
                cardBodyProps: {
                  id: `deep-thinking-${index}`,
                  style: { whiteSpace: 'pre-line' },
                  className: parsedReasoning.isReasoningInProgress
                    ? DEEP_THINKING_CLASS
                    : undefined,
                },
                toggleContent: t('reasoning.thinking'),
                body: reasoningContent,
                isDefaultExpanded: false,
              };
            }
          }

          const allToolCalls: React.ReactNode[] = [];

          if (toolCallProp && firstToolCall) {
            allToolCalls.push(
              <div
                key={`tool-${firstToolCall.id}-${firstToolCall.toolName}`}
                style={{ marginTop: '8px' }}
              >
                <PatternFlyToolCall {...toolCallProp} />
              </div>,
            );
          }

          if (additionalToolCalls && additionalToolCalls.length > 0) {
            additionalToolCalls.forEach(tc => {
              const tcProps = mapToPatternFlyToolCall(tc, t, message.role);
              allToolCalls.push(
                <div
                  key={`tool-${tc.id}-${tc.toolName}`}
                  style={{ marginTop: '8px' }}
                >
                  <PatternFlyToolCall {...tcProps} />
                </div>,
              );
            });
          }

          if (deepThinking || allToolCalls.length > 0) {
            extraContentParts.beforeMainContent = (
              <>
                {deepThinking && <DeepThinking {...deepThinking} />}
                {allToolCalls.length > 0 && (
                  <div style={{ marginTop: deepThinking ? '8px' : '0' }}>
                    {allToolCalls}
                  </div>
                )}
              </>
            );
          }

          const extraContent =
            extraContentParts.beforeMainContent ||
            extraContentParts.afterMainContent
              ? extraContentParts
              : undefined;

          const finalMessage =
            parsedReasoning.hasReasoning ||
            parsedReasoning.isReasoningInProgress
              ? { ...message, content: parsedReasoning.mainContent }
              : message;

          return (
            <Message
              key={`${message.role}-${index}`}
              extraContent={extraContent}
              {...finalMessage}
            />
          );
        })}
      </StyledMessageBox>
    );
  },
);
