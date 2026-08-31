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

import { useLayoutEffect, useRef } from 'react';

import Box from '@mui/material/Box';
import Fab from '@mui/material/Fab';
import GlobalStyles from '@mui/material/GlobalStyles';
import Tooltip from '@mui/material/Tooltip';
import { ChatbotDisplayMode } from '@patternfly/chatbot';

import {
  DOCKED_CONTENT_OFFSET,
  getLightspeedFabInset,
  LIGHTSPEED_FAB_ANCHOR_VARS,
  LIGHTSPEED_FAB_ELEMENT_ID,
} from '../const';
import { useLightspeedDrawerContext } from '../hooks/useLightspeedDrawerContext';
import { useTranslation } from '../hooks/useTranslation';
import { LightspeedFABIcon, LightspeedFABOpenIcon } from './LightspeedIcon';

const publishFabAnchor = (fab: HTMLElement) => {
  const rect = fab.getBoundingClientRect();
  if (rect.width < 1 || rect.height < 1) {
    return;
  }
  const root = document.documentElement;
  root.style.setProperty(
    LIGHTSPEED_FAB_ANCHOR_VARS.insetBlockEnd,
    `${window.innerHeight - rect.bottom}px`,
  );
  root.style.setProperty(
    LIGHTSPEED_FAB_ANCHOR_VARS.insetInlineEnd,
    `${window.innerWidth - rect.right}px`,
  );
  root.style.setProperty(LIGHTSPEED_FAB_ANCHOR_VARS.height, `${rect.height}px`);
};

const clearFabAnchor = () => {
  const root = document.documentElement;
  root.style.removeProperty(LIGHTSPEED_FAB_ANCHOR_VARS.insetBlockEnd);
  root.style.removeProperty(LIGHTSPEED_FAB_ANCHOR_VARS.insetInlineEnd);
  root.style.removeProperty(LIGHTSPEED_FAB_ANCHOR_VARS.height);
};

export const LightspeedFABContent = () => {
  const { t } = useTranslation();
  const { isChatbotActive, toggleChatbot, displayMode } =
    useLightspeedDrawerContext();
  const fabRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const fab = fabRef.current;
    if (!fab) {
      return undefined;
    }

    const syncAnchor = () => publishFabAnchor(fab);
    syncAnchor();

    const resizeObserver =
      typeof ResizeObserver === 'function'
        ? new ResizeObserver(syncAnchor)
        : undefined;
    resizeObserver?.observe(fab);

    window.addEventListener('resize', syncAnchor);
    fab.addEventListener('transitionend', syncAnchor);
    const mutationObserver = new MutationObserver(syncAnchor);
    mutationObserver.observe(document.body, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener('resize', syncAnchor);
      fab.removeEventListener('transitionend', syncAnchor);
      mutationObserver.disconnect();
      clearFabAnchor();
    };
  }, [displayMode]);

  if (displayMode === ChatbotDisplayMode.embedded) {
    return null;
  }

  return (
    <>
      <GlobalStyles
        styles={theme => {
          const inset = getLightspeedFabInset(theme.spacing(2));
          return {
            ':root': {
              [LIGHTSPEED_FAB_ANCHOR_VARS.insetBlockEnd]: inset,
              [LIGHTSPEED_FAB_ANCHOR_VARS.insetInlineEnd]: inset,
              [LIGHTSPEED_FAB_ANCHOR_VARS.height]: '56px',
            },
          };
        }}
      />
      <Box
        ref={fabRef}
        sx={theme => ({
          bottom: getLightspeedFabInset(theme.spacing(2)),
          right: getLightspeedFabInset(theme.spacing(2)),
          alignItems: 'end',
          zIndex: theme.zIndex.tooltip,
          display: 'flex',
          position: 'fixed',
          'body.docked-drawer-open &': {
            transition: 'margin-right 0.3s ease',
            marginRight: DOCKED_CONTENT_OFFSET,
          },
        })}
        id={LIGHTSPEED_FAB_ELEMENT_ID}
        data-testid="lightspeed-fab"
      >
        <Tooltip
          title={
            isChatbotActive ? t('tooltip.fab.close') : t('tooltip.fab.open')
          }
          placement="left"
        >
          <Fab
            color="inherit"
            variant="circular"
            size="large"
            onClick={toggleChatbot}
            aria-label={
              isChatbotActive ? t('tooltip.fab.close') : t('tooltip.fab.open')
            }
            sx={theme => ({
              backgroundColor: theme.palette.background.default,
              color: theme.palette.text.primary,
              border: `1px solid ${theme.palette.divider}`,
              '&:hover': {
                backgroundColor: theme.palette.background.paper,
              },
            })}
          >
            {isChatbotActive ? (
              <LightspeedFABOpenIcon />
            ) : (
              <LightspeedFABIcon />
            )}
          </Fab>
        </Tooltip>
      </Box>
    </>
  );
};
