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

import { makeStyles } from '@material-ui/core';
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

const useStyles = makeStyles(theme => ({
  prompt: {
    'justify-content': 'flex-end',
  },
  container: {
    maxWidth: 'unset !important',
  },
  alert: {
    background: 'unset !important',
  },
  promptSuggestions: {
    '& div.pf-chatbot__prompt-suggestions': {
      'flex-direction': 'column !important',
    },
  },

  userMessageText: {
    '& div.pf-chatbot__message--user': {
      '& div.pf-chatbot__message-text': {
        '& p': {
          color: theme.palette.common.white,
        },
      },
    },
  },
}));

// Extended message type that includes tool calls
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
    ref: ForwardedRef<ScrollContainerHandle>,
  ) => {
    const classes = useStyles();
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

    const messageBoxClasses = `${classes.container} ${classes.userMessageText}`;
    const isEmbeddedMode = displayMode === ChatbotDisplayMode.embedded;

    const getMessageBoxClassName = () => {
      if (!welcomePrompts.length) {
        return messageBoxClasses;
      }
      const baseClasses = `${messageBoxClasses} ${classes.prompt}`;
      if (isEmbeddedMode) {
        return baseClasses;
      }
      return `${baseClasses} ${classes.promptSuggestions}`;
    };

    return (
      <MessageBox
        className={getMessageBoxClassName()}
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
          <Alert
            title={t('aria.important')}
            variant="info"
            isInline
            className={classes.alert}
          >
            {topicRestrictionEnabled
              ? t('disclaimer.withValidation')
              : t('disclaimer.withoutValidation')}
          </Alert>
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

          // Map first tool call to PatternFly's toolCall prop
          const firstToolCall = message.toolCalls?.[0];
          const toolCallProp = firstToolCall
            ? mapToPatternFlyToolCall(firstToolCall, t)
            : undefined;

          // Handle additional tool calls (if any) via extraContent
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
            const reasoningContent =
              parsedReasoning.reasoning ||
              (() => {
                const reasoningMatch = messageContent.match(/<think>(.*?)$/s);
                return reasoningMatch ? reasoningMatch[1].trim() : '';
              })();

            if (reasoningContent) {
              deepThinking = {
                toggleContent: t('reasoning.thinking'),
                body: reasoningContent,
                expandableSectionProps: {},
              };
              extraContentParts.beforeMainContent = (
                <DeepThinking {...deepThinking} />
              );
            }
          }

          if (additionalToolCalls && additionalToolCalls.length > 0) {
            extraContentParts.afterMainContent = (
              <>
                {additionalToolCalls.map(tc => {
                  const tcProps = mapToPatternFlyToolCall(tc, t);
                  return (
                    <div
                      key={`tool-${tc.id}-${tc.toolName}`}
                      style={{ marginTop: '8px' }}
                    >
                      <PatternFlyToolCall {...tcProps} />
                    </div>
                  );
                })}
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
              toolCall={toolCallProp}
              extraContent={extraContent}
              {...finalMessage}
            />
          );
        })}
      </MessageBox>
    );
  },
);
