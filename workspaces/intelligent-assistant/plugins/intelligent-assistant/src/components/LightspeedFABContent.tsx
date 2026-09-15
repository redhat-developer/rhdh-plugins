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
import { useTheme } from '@mui/material/styles';
import Tooltip from '@mui/material/Tooltip';
import { ChatbotDisplayMode } from '@patternfly/chatbot';

import { DOCKED_CONTENT_OFFSET, LIGHTSPEED_FAB_ELEMENT_ID } from '../const';
import { useIaChatPermission } from '../hooks/useIaChatPermission';
import { useIaNotebooksPermission } from '../hooks/useIaNotebooksPermission';
import { useLightspeedDrawerContext } from '../hooks/useLightspeedDrawerContext';
import { useTranslation } from '../hooks/useTranslation';
import {
  clearLightspeedFabAnchorVars,
  getLightspeedFabEdgeInset,
  publishLightspeedFabAnchorVars,
} from '../utils/fab-anchor-utils';
import { LightspeedFABIcon, LightspeedFABOpenIcon } from './LightspeedIcon';

export const LightspeedFABContent = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const { isChatbotActive, toggleChatbot, displayMode } =
    useLightspeedDrawerContext();
  const { allowed: hasChatAccess, loading: chatPermissionLoading } =
    useIaChatPermission();
  const { allowed: hasNotebooksAccess, loading: notebooksPermissionLoading } =
    useIaNotebooksPermission();

  const permissionsLoading =
    chatPermissionLoading || notebooksPermissionLoading;
  const hasPluginAccess = hasChatAccess || hasNotebooksAccess;
  const fabRef = useRef<HTMLDivElement>(null);
  const fabEdgeInset = getLightspeedFabEdgeInset(theme);

  useLayoutEffect(() => {
    const fab = fabRef.current;
    if (!fab) {
      return undefined;
    }

    const syncAnchor = () =>
      publishLightspeedFabAnchorVars({ fabElement: fab, theme });
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
      clearLightspeedFabAnchorVars();
    };
  }, [displayMode, theme]);

  if (displayMode === ChatbotDisplayMode.embedded) {
    return null;
  }

  if (permissionsLoading || !hasPluginAccess) {
    return null;
  }

  return (
    <Box
      ref={fabRef}
      sx={{
        bottom: fabEdgeInset,
        right: fabEdgeInset,
        alignItems: 'end',
        zIndex: theme.zIndex.tooltip,
        display: 'flex',
        position: 'fixed',
        'body.docked-drawer-open &': {
          transition: 'margin-right 0.3s ease',
          marginRight: DOCKED_CONTENT_OFFSET,
        },
      }}
      id={LIGHTSPEED_FAB_ELEMENT_ID}
      data-testid="lightspeed-fab"
    >
      <Tooltip
        title={isChatbotActive ? t('tooltip.fab.close') : t('tooltip.fab.open')}
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
          sx={{
            backgroundColor: theme.palette.background.default,
            color: theme.palette.text.primary,
            border: `1px solid ${theme.palette.divider}`,
            '&:hover': {
              backgroundColor: theme.palette.background.paper,
            },
          }}
        >
          {isChatbotActive ? <LightspeedFABOpenIcon /> : <LightspeedFABIcon />}
        </Fab>
      </Tooltip>
    </Box>
  );
};
