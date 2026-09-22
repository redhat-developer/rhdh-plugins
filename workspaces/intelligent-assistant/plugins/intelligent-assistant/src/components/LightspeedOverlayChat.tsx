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
import {
  ChatbotModal,
  type ChatbotDisplayMode as PfChatbotDisplayMode,
} from '@patternfly/chatbot';

import {
  DOCKED_CONTENT_OFFSET,
  LIGHTSPEED_OVERLAY_BOTTOM,
  LIGHTSPEED_OVERLAY_CHATBOT_MODAL_CLASS,
  LIGHTSPEED_OVERLAY_MAX_WIDTH,
  LIGHTSPEED_OVERLAY_RIGHT,
  type ChatbotDisplayMode,
} from '../const';
import { LightspeedChatContainer } from './LightspeedChatContainer';

const LIGHTSPEED_OVERLAY_CHAT_Z_INDEX = 300;

const StyledChatbotModal = styled(ChatbotModal)(() => ({
  zIndex: LIGHTSPEED_OVERLAY_CHAT_Z_INDEX,
  boxShadow:
    '0 14px 20px -7px rgba(0, 0, 0, 0.22), 0 32px 50px 6px rgba(0, 0, 0, 0.16), 0 12px 60px 12px rgba(0, 0, 0, 0.14) !important',
  bottom: `${LIGHTSPEED_OVERLAY_BOTTOM} !important`,
  right: `${LIGHTSPEED_OVERLAY_RIGHT} !important`,
  maxWidth: `${LIGHTSPEED_OVERLAY_MAX_WIDTH} !important`,
  overflow: 'hidden',
  transition:
    'margin-right 0.3s ease, bottom 0.3s ease, right 0.3s ease, inset-block-end 0.3s ease, inset-inline-end 0.3s ease',
  'body.docked-drawer-open &': {
    marginRight: DOCKED_CONTENT_OFFSET,
  },
}));

type Props = {
  displayMode: ChatbotDisplayMode;
  onEscapePress: () => void;
};

/**
 * Overlay chat modal — lazy-loaded from LightspeedDrawerProvider when needed.
 * ChatContainer is imported statically so ChatbotModal and chat PatternFly CSS
 * share one chunk order (avoids css-extract-rspack-plugin CI failures).
 */
export const LightspeedOverlayChat = ({
  displayMode,
  onEscapePress,
}: Props) => (
  <StyledChatbotModal
    isOpen
    className={LIGHTSPEED_OVERLAY_CHATBOT_MODAL_CLASS}
    displayMode={displayMode as PfChatbotDisplayMode}
    disableFocusTrap
    onEscapePress={onEscapePress}
    ouiaId="LightspeedChatbotModal"
    aria-labelledby="lightspeed-chatpopup-modal"
    data-screen-capture-exclude
  >
    <LightspeedChatContainer />
  </StyledChatbotModal>
);
