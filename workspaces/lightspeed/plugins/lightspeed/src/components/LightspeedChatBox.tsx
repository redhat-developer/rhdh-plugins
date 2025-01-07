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
} from '@patternfly/virtual-assistant';

const useStyles = makeStyles(theme => ({
  prompt: {
    'justify-content': 'flex-end',
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

export const LightspeedChatBox = React.forwardRef(
  (
    {
      userName,
      messages,
      announcement,
      profileLoading,
      welcomePrompts,
    }: LightspeedChatBoxProps,
    ref: React.ForwardedRef<HTMLDivElement>,
  ) => {
    const [cmessages, setCMessages] = React.useState(messages);
    const classes = useStyles();

    React.useEffect(() => {
      setCMessages(messages);
    }, [messages]);

    return (
      <MessageBox
        className={
          welcomePrompts.length
            ? `${classes.userMessageText} ${classes.prompt}`
            : classes.userMessageText
        }
        announcement={announcement}
        style={{ justifyContent: 'flex-end' }}
      >
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
                <div ref={ref} />
              </React.Fragment>
            );
          }
          return <Message key={`${message.role}-${index}`} {...message} />;
        })}
      </MessageBox>
    );
  },
);
