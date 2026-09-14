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

import { styled } from '@mui/material/styles';
import { ChatbotContent } from '@patternfly/chatbot';

/** Centers PF jump (back to top / bottom) buttons over the scroll region. */
export const chatJumpButtonStyles = (hasOverflow?: boolean) =>
  ({
    '& .pf-chatbot__jump': {
      left: '50% !important',
      right: 'auto !important',
      transform: 'translateX(-50%)',
      visibility: hasOverflow ? 'visible' : 'hidden',
      pointerEvents: hasOverflow ? 'auto' : 'none',
    },
  }) as const;

export const ChatMessageScroll = styled('div', {
  shouldForwardProp: prop => prop !== 'isNewChat',
})<{ isNewChat?: boolean }>(({ isNewChat }) => ({
  minHeight: 0,
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  overflowY: 'auto',
  WebkitOverflowScrolling: 'touch',
  ...(isNewChat
    ? {
        backgroundColor:
          'var(--pf-t--global--background--color--floating--default) !important',
      }
    : {}),
}));

export const ChatMessageContentShell = styled(ChatbotContent, {
  shouldForwardProp: prop => prop !== 'hasOverflow',
})<{ hasOverflow?: boolean }>(({ hasOverflow }) => ({
  minHeight: 0,
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
  ...chatJumpButtonStyles(hasOverflow),
  '& .pf-chatbot__message-contents': {
    overflowX: 'hidden',
    overflowWrap: 'break-word',
    wordBreak: 'break-word',
  },
}));
