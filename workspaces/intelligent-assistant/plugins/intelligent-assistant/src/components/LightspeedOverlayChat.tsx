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

import { useEffect, useState } from 'react';

import { styled } from '@mui/material/styles';
import {
  ChatbotModal,
  type ChatbotDisplayMode as PfChatbotDisplayMode,
} from '@patternfly/chatbot';

import {
  LIGHTSPEED_OVERLAY_BOTTOM,
  LIGHTSPEED_OVERLAY_CHATBOT_MODAL_CLASS,
  LIGHTSPEED_OVERLAY_MAX_WIDTH,
  LIGHTSPEED_OVERLAY_RIGHT,
  type ChatbotDisplayMode,
} from '../const';
import {
  areChatPatternflyStylesLoaded,
  loadChatPatternflyStyles,
} from '../loadChatPatternflyStyles';
import { ChatLoadingFallback } from './ChatLoadingFallback';
import { LightspeedChatContainer } from './LightspeedChatContainer';

const LIGHTSPEED_OVERLAY_CHAT_Z_INDEX = 300;

/**
 * Overlay shell matches PF basic ChatBot chrome:
 * floating-secondary fill + medium radius + subtle border.
 * @see https://chatbot-pr-chatbot-902.surge.sh/extensions/chatbot/overview/demo/basic-chatbot/
 *
 * Inner Chatbot stays `embedded` for layout (static, 100%), so the modal —
 * not the embedded chatbot — owns the visible border/radius. Children inherit
 * radius + overflow clip so dark fills do not square-cut the corners.
 *
 * Horizontal position comes only from {@link LIGHTSPEED_OVERLAY_RIGHT} (measured
 * FAB inset). Do not also apply `DOCKED_CONTENT_OFFSET` — the FAB already shifts
 * for Quickstart/`docked-drawer-open`, and a second margin double-offsets the
 * modal onto the left side of the viewport.
 */
const StyledChatbotModal = styled(ChatbotModal)(() => ({
  zIndex: LIGHTSPEED_OVERLAY_CHAT_Z_INDEX,
  boxShadow:
    '0 14px 20px -7px rgba(0, 0, 0, 0.22), 0 32px 50px 6px rgba(0, 0, 0, 0.16), 0 12px 60px 12px rgba(0, 0, 0, 0.14) !important',
  bottom: `${LIGHTSPEED_OVERLAY_BOTTOM} !important`,
  right: `${LIGHTSPEED_OVERLAY_RIGHT} !important`,
  maxWidth: `${LIGHTSPEED_OVERLAY_MAX_WIDTH} !important`,
  overflow: 'hidden',
  backgroundColor:
    'var(--pf-t--global--background--color--floating--secondary--default) !important',
  borderRadius: 'var(--pf-t--global--border--radius--medium) !important',
  border:
    'var(--pf-t--global--border--width--regular) solid var(--pf-t--global--border--color--subtle) !important',
  // Embedded Chatbot zeros radius; restore PF default overlay chrome inside.
  '& .pf-chatbot': {
    backgroundColor: 'transparent !important',
    border: 'none !important',
    boxShadow: 'none !important',
    borderRadius: 'inherit !important',
  },
  '& .pf-chatbot-container': {
    borderRadius: 'inherit !important',
    overflow: 'hidden',
  },
  '& .pf-chatbot__header, & .pf-chatbot__content, & .pf-chatbot__footer': {
    backgroundColor:
      'var(--pf-t--global--background--color--floating--secondary--default) !important',
  },
  transition:
    'bottom 0.3s ease, right 0.3s ease, inset-block-end 0.3s ease, inset-inline-end 0.3s ease',
}));

type Props = {
  displayMode: ChatbotDisplayMode;
  onEscapePress: () => void;
};

/**
 * Overlay chat modal — lazy-loaded from LightspeedDrawerProvider when needed.
 * ChatContainer is imported statically so ChatbotModal and chat PatternFly CSS
 * share one chunk order (avoids css-extract-rspack-plugin CI failures).
 * Wait for PatternFly CSS before mounting ChatbotModal (RHDHBUGS-3803).
 */
export const LightspeedOverlayChat = ({
  displayMode,
  onEscapePress,
}: Props) => {
  const [stylesReady, setStylesReady] = useState(areChatPatternflyStylesLoaded);

  useEffect(() => {
    if (stylesReady) {
      return undefined;
    }

    let cancelled = false;
    loadChatPatternflyStyles()
      .then(() => {
        if (!cancelled) {
          setStylesReady(true);
        }
      })
      .catch(() => {
        // Leave stylesReady false; retry on remount via cleared loadPromise.
      });

    return () => {
      cancelled = true;
    };
  }, [stylesReady]);

  if (!stylesReady) {
    return <ChatLoadingFallback variant="overlay" />;
  }

  return (
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
};
