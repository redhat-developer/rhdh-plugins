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

import Close from '@mui/icons-material/Close';
import Box from '@mui/material/Box';
import Fab from '@mui/material/Fab';
import Tooltip from '@mui/material/Tooltip';
import { ChatbotDisplayMode } from '@patternfly/chatbot';

import { DOCKED_CONTENT_OFFSET } from '../const';
import { useLightspeedDrawerContext } from '../hooks/useLightspeedDrawerContext';
import { LightspeedFABIcon } from './LightspeedIcon';

/**
 * @public
 * Lightspeed Floating action button to open/close the lightspeed chatbot
 */

export const LightspeedFAB = () => {
  const { isChatbotActive, toggleChatbot, displayMode } =
    useLightspeedDrawerContext();

  if (displayMode === ChatbotDisplayMode.embedded) {
    return null;
  }

  return (
    <Box
      id="lightspeed-fab"
      data-testid="lightspeed-fab"
      sx={theme => ({
        bottom: `calc(${theme?.spacing?.(2) ?? '16px'} + 1.5em)`,
        right: `calc(${theme?.spacing?.(2) ?? '16px'} + 1.5em)`,
        alignItems: 'end',
        zIndex: 200,
        display: 'flex',
        position: 'fixed',
        'body.docked-drawer-open &': {
          transition: 'margin-right 0.3s ease',
          marginRight: DOCKED_CONTENT_OFFSET,
        },
      })}
    >
      <Tooltip
        title={isChatbotActive ? 'Close Lightspeed' : 'Open Lightspeed'}
        placement="left"
      >
        <Fab
          color="primary"
          variant="circular"
          size="small"
          onClick={toggleChatbot}
          aria-label={isChatbotActive ? 'lightspeed-close' : 'lightspeed-open'}
          sx={theme => ({
            opacity: 1,
            backgroundColor: theme?.palette?.primary?.main ?? '#1976d2',
            color: theme?.palette?.primary?.contrastText ?? '#fff',
            boxShadow:
              theme?.shadows?.[6] ??
              '0px 3px 5px -1px rgba(0,0,0,0.2), 0px 6px 10px 0px rgba(0,0,0,0.14), 0px 1px 18px 0px rgba(0,0,0,0.12)',
            borderRadius: '100%',
            '&:hover': {
              backgroundColor: theme?.palette?.primary?.dark ?? '#1565c0',
            },
          })}
        >
          {isChatbotActive ? <Close fontSize="small" /> : <LightspeedFABIcon />}
        </Fab>
      </Tooltip>
    </Box>
  );
};
