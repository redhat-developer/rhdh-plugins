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
import LinearProgress from '@mui/material/LinearProgress';

import {
  LIGHTSPEED_OVERLAY_BOTTOM,
  LIGHTSPEED_OVERLAY_MAX_WIDTH,
  LIGHTSPEED_OVERLAY_RIGHT,
} from '../const';

type Props = {
  variant?: 'default' | 'overlay';
};

/** Immediate loading feedback while chat chunks / PF CSS load (MUI, no PF). */
export const ChatLoadingFallback = ({ variant = 'default' }: Props) => {
  const isOverlay = variant === 'overlay';

  return (
    <Box
      role="status"
      aria-busy="true"
      aria-label="Loading chat"
      data-testid="chat-loading-fallback"
      sx={
        isOverlay
          ? {
              position: 'fixed',
              zIndex: 300,
              bottom: LIGHTSPEED_OVERLAY_BOTTOM,
              right: LIGHTSPEED_OVERLAY_RIGHT,
              width: LIGHTSPEED_OVERLAY_MAX_WIDTH,
              maxWidth: '100vw',
              p: 1.5,
              borderRadius: 1,
              bgcolor: 'background.paper',
              boxShadow: 3,
            }
          : {
              width: '100%',
              p: 2,
              boxSizing: 'border-box',
            }
      }
    >
      <LinearProgress />
    </Box>
  );
};
