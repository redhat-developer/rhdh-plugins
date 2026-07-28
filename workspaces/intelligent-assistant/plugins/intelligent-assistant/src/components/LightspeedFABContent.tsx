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

import Box from '@mui/material/Box';
import Fab from '@mui/material/Fab';
import Tooltip from '@mui/material/Tooltip';
import { ChatbotDisplayMode } from '@patternfly/chatbot';

import { DOCKED_CONTENT_OFFSET } from '../const';
import { useLightspeedDrawerContext } from '../hooks/useLightspeedDrawerContext';
import { useTranslation } from '../hooks/useTranslation';
import { LightspeedFABIcon, LightspeedFABOpenIcon } from './LightspeedIcon';

export const LightspeedFABContent = () => {
  const { t } = useTranslation();
  const { isChatbotActive, toggleChatbot, displayMode } =
    useLightspeedDrawerContext();

  if (displayMode === ChatbotDisplayMode.embedded) {
    return null;
  }

  return (
    <Box
      sx={theme => ({
        bottom: `calc(${theme.spacing(2)} + 1.5em)`,
        right: `calc(${theme.spacing(2)} + 1.5em)`,
        alignItems: 'end',
        zIndex: 200,
        display: 'flex',
        position: 'fixed',
        'body.docked-drawer-open &': {
          transition: 'margin-right 0.3s ease',
          marginRight: DOCKED_CONTENT_OFFSET,
        },
      })}
      id="lightspeed-fab"
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
          sx={theme => ({
            backgroundColor: theme.palette.background.default,
            color: theme.palette.text.primary,
            border: `1px solid ${theme.palette.divider}`,
            '&:hover': {
              backgroundColor: theme.palette.background.paper,
            },
          })}
        >
          {isChatbotActive ? <LightspeedFABOpenIcon /> : <LightspeedFABIcon />}
        </Fab>
      </Tooltip>
    </Box>
  );
};
