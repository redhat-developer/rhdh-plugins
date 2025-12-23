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
import Fab from '@mui/material/Fab';
import Tooltip from '@mui/material/Tooltip';
import { makeStyles } from '@mui/styles';
import { ChatbotDisplayMode } from '@patternfly/chatbot';

import { useLightspeedDrawerContext } from '../hooks/useLightspeedDrawerContext';
import { LightspeedFABIcon } from './LightspeedIcon';

const useStyles = makeStyles(theme => ({
  'fab-button': {
    bottom: `calc(${theme?.spacing?.(2) ?? '16px'} + 1.5em)`,
    right: `calc(${theme?.spacing?.(2) ?? '16px'} + 1.5em)`,
    alignItems: 'end',
    zIndex: 200,
    display: 'flex',
    position: 'fixed',

    // When drawer is docked, adjust margin
    '.docked-drawer-open &': {
      transition: 'margin-right 0.3s ease',
      marginRight: 'var(--docked-drawer-width, 500px) ',
    },
  },
}));

/**
 * @public
 * Lightspeed Floating action button to open/close the lightspeed chatbot
 */

export const LightspeedFAB = () => {
  const { isChatbotActive, toggleChatbot, displayMode } =
    useLightspeedDrawerContext();
  const fabButton = useStyles();

  if (displayMode === ChatbotDisplayMode.embedded) {
    return null;
  }

  return (
    <div
      className={fabButton['fab-button']}
      id="lightspeed-fab"
      data-testid="lightspeed-fab"
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
          aria-label={isChatbotActive ? 'lightspeed-open' : 'lightspeed-close'}
          sx={{ borderRadius: '100% !important' }}
        >
          {isChatbotActive ? <Close fontSize="small" /> : <LightspeedFABIcon />}
        </Fab>
      </Tooltip>
    </div>
  );
};
