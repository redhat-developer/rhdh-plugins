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

import { PropsWithChildren } from 'react';

import { makeStyles } from '@mui/styles';
import { ChatbotModal } from '@patternfly/chatbot';

import { DOCKED_CONTENT_OFFSET } from '../const';
import { useLightspeedProviderState } from '../hooks/useLightspeedProviderState';
import { LightspeedChatContainer } from './LightspeedChatContainer';
import { LightspeedDrawerContext } from './LightspeedDrawerContext';

const useStyles = makeStyles(theme => ({
  chatbotModal: {
    boxShadow:
      '0 14px 20px -7px rgba(0, 0, 0, 0.22), 0 32px 50px 6px rgba(0, 0, 0, 0.16), 0 12px 60px 12px rgba(0, 0, 0, 0.14) !important',
    bottom: `calc(${theme?.spacing?.(2) ?? '16px'} + 5em)`,
    right: `calc(${theme?.spacing?.(2) ?? '16px'} + 1.5em)`,
    maxWidth: 'min(30rem, calc(100vw - 32px)) !important',
    overflowX: 'hidden' as const,
    transition: 'margin-right 0.3s ease',
    'body.docked-drawer-open &': {
      marginRight: DOCKED_CONTENT_OFFSET,
    },
  },
}));

/**
 * @public
 */
export const LightspeedDrawerProvider = ({ children }: PropsWithChildren) => {
  const classes = useStyles();
  const { contextValue, shouldRenderOverlayModal, closeChatbot } =
    useLightspeedProviderState();

  return (
    <LightspeedDrawerContext.Provider value={contextValue}>
      {children}
      {shouldRenderOverlayModal && (
        <ChatbotModal
          isOpen
          displayMode={contextValue.displayMode}
          onClose={closeChatbot}
          ouiaId="LightspeedChatbotModal"
          aria-labelledby="lightspeed-chatpopup-modal"
          className={classes.chatbotModal}
        >
          <LightspeedChatContainer />
        </ChatbotModal>
      )}
    </LightspeedDrawerContext.Provider>
  );
};
