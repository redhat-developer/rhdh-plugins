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
  Fragment,
  useEffect,
  useImperativeHandle,
  useRef,
} from 'react';

import { makeStyles } from '@material-ui/core';
import {
  ChatbotWelcomePrompt,
  Message,
  MessageBox,
  MessageBoxHandle,
  MessageProps,
  WelcomePrompt,
} from '@patternfly/chatbot';
import { Alert } from '@patternfly/react-core';

import { useAutoScroll } from '../hooks/useAutoScroll';
import { useBufferedMessages } from '../hooks/useBufferedMessages';
import { useFeedbackActions } from '../hooks/useFeedbackActions';
import { useTranslation } from '../hooks/useTranslation';

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

type LightspeedChatBoxProps = {
  userName?: string;
  messages: MessageProps[];
  profileLoading: boolean;
  announcement: string | undefined;
  topicRestrictionEnabled: boolean;
  welcomePrompts: WelcomePrompt[];
  conversationId: string;
  isStreaming: boolean;
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
    return (
      <MessageBox
        className={
          welcomePrompts.length
            ? `${messageBoxClasses} ${classes.prompt}`
            : messageBoxClasses
        }
        announcement={announcement}
        ref={containerRef}
        onScrollToTopClick={scrollToTop}
        onScrollToBottomClick={scrollToBottom}
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
          />
        ) : (
          <br />
        )}
        {conversationMessages.map((message, index) => {
          if (index === cmessages.length - 1) {
            return (
              <Fragment key={`${message.role}-${index}`}>
                <Message key={`${message.role}-${index}`} {...message} />
              </Fragment>
            );
          }
          return <Message key={`${message.role}-${index}`} {...message} />;
        })}
      </MessageBox>
    );
  },
);
