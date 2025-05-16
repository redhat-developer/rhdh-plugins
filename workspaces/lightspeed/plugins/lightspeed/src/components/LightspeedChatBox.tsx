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

import React from 'react';

import { makeStyles } from '@material-ui/core';
import {
  ChatbotWelcomePrompt,
  Message,
  MessageBox,
  MessageProps,
  WelcomePrompt,
} from '@patternfly/chatbot';
import { Alert } from '@patternfly/react-core';

import { useAutoScroll } from '../hooks/useAutoScroll';
import { useBufferedMessages } from '../hooks/useBufferedMessages';

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
  welcomePrompts: WelcomePrompt[];
};

export interface ScrollContainerHandle {
  scrollToBottom: () => void;
}

export const LightspeedChatBox = React.forwardRef(
  (
    {
      userName,
      messages,
      announcement,
      profileLoading,
      welcomePrompts,
    }: LightspeedChatBoxProps,
    ref: React.ForwardedRef<ScrollContainerHandle>,
  ) => {
    const classes = useStyles();
    const scrollQueued = React.useRef(false);
    const containerRef = React.useRef<HTMLDivElement>(null);

    const cmessages = useBufferedMessages(messages, 30);
    const { autoScroll, scrollToBottom, scrollToTop } =
      useAutoScroll(containerRef);

    React.useImperativeHandle(ref, () => ({
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
    React.useEffect(() => {
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
            title="Important"
            variant="info"
            isInline
            className={classes.alert}
          >
            Red Hat Developer Hub Lightspeed can answer questions on many topics
            using your preferred models. Lightspeed's responses are influenced
            by the Red Hat Developer Hub documentation but Lightspeed does not
            have access to your Software Catalog, TechDocs, or Templates etc. Do
            NOT include personal or business sensitive information in your
            input. Interactions with Developer Hub Lightspeed may be reviewed
            and used to improve responses.
          </Alert>
          <br />
        </div>
        {welcomePrompts.length ? (
          <ChatbotWelcomePrompt
            title={`Hello, ${profileLoading ? '...' : (userName ?? 'Guest')}`}
            description="How can I help you today?"
            prompts={welcomePrompts}
          />
        ) : (
          <br />
        )}
        {cmessages.map((message, index) => {
          if (index === cmessages.length - 1) {
            return (
              <React.Fragment key={`${message.role}-${index}`}>
                <Message key={`${message.role}-${index}`} {...message} />
              </React.Fragment>
            );
          }
          return <Message key={`${message.role}-${index}`} {...message} />;
        })}
      </MessageBox>
    );
  },
);
