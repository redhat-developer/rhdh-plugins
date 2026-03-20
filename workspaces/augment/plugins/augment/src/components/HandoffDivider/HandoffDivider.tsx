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
import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import { useTheme, alpha } from '@mui/material/styles';
import { useTranslation } from '../../hooks/useTranslation';

interface HandoffDividerProps {
  agentName: string;
  reason?: string;
}

export const HandoffDivider: React.FC<HandoffDividerProps> = React.memo(
  function HandoffDivider({ agentName, reason }) {
    const theme = useTheme();
    const { t } = useTranslation();

    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          my: 1.5,
          px: 1,
        }}
      >
        <Divider sx={{ flex: 1 }} />
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 0.25,
            px: 1.5,
            py: 0.25,
            borderRadius: 3,
            bgcolor: alpha(
              theme.palette.text.primary,
              theme.palette.mode === 'dark' ? 0.06 : 0.04,
            ),
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <SwapHorizIcon
              sx={{ fontSize: 14, color: theme.palette.text.disabled }}
            />
            <Typography
              variant="caption"
              sx={{
                color: theme.palette.text.secondary,
                fontSize: '0.7rem',
                fontWeight: 500,
                whiteSpace: 'nowrap',
              }}
            >
              {t('streaming.connectingWith', { agentName })}
            </Typography>
          </Box>
          {reason && (
            <Typography
              variant="caption"
              sx={{
                color: theme.palette.text.disabled,
                fontSize: '0.625rem',
                fontStyle: 'italic',
                maxWidth: 300,
                textAlign: 'center',
                lineHeight: 1.3,
              }}
            >
              {reason}
            </Typography>
          )}
        </Box>
        <Divider sx={{ flex: 1 }} />
      </Box>
    );
  },
);
