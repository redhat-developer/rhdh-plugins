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
import Button from '@mui/material/Button';
import { useTheme, alpha } from '@mui/material/styles';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import { useTranslation } from '../../hooks/useTranslation';

interface ChatHeaderProps {
  selectedModel?: string;
  currentAgent?: string;
  onChangeAgent?: () => void;
}

function getAgentAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return `hsl(${Math.abs(hash) % 360}, 55%, 50%)`;
}

export const ChatHeader: React.FC<ChatHeaderProps> = React.memo(
  function ChatHeader({ selectedModel, currentAgent, onChangeAgent }) {
    const { t } = useTranslation();
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

    if (!selectedModel) return null;

    const displayName = currentAgent || (selectedModel.includes('/') ? selectedModel.split('/').pop() : selectedModel) || selectedModel;
    const namespace = selectedModel.includes('/') ? selectedModel.split('/')[0] : undefined;
    const avatarColor = getAgentAvatarColor(displayName);

    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          px: { xs: 2, sm: 3, md: 4 },
          py: 1,
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
          bgcolor: alpha(theme.palette.background.paper, isDark ? 0.6 : 0.8),
          flexShrink: 0,
          minHeight: 48,
        }}
      >
        {/* Agent Avatar */}
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: alpha(avatarColor, isDark ? 0.2 : 0.12),
            color: avatarColor,
            fontWeight: 700,
            fontSize: '0.9rem',
            flexShrink: 0,
          }}
        >
          {displayName.charAt(0).toUpperCase()}
        </Box>

        {/* Agent Info */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <Box
              sx={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                bgcolor: theme.palette.success.main,
                flexShrink: 0,
              }}
            />
            <Typography
              variant="body2"
              noWrap
              sx={{ fontWeight: 600, fontSize: '0.85rem' }}
            >
              {displayName}
            </Typography>
          </Box>
          {namespace && (
            <Typography
              variant="caption"
              sx={{
                color: theme.palette.text.disabled,
                fontSize: '0.65rem',
                ml: 2,
              }}
            >
              {namespace}
            </Typography>
          )}
        </Box>

        {/* Change Agent */}
        {onChangeAgent && (
          <Button
            size="small"
            startIcon={<SwapHorizIcon sx={{ fontSize: 14 }} />}
            onClick={onChangeAgent}
            sx={{
              textTransform: 'none',
              fontSize: '0.75rem',
              color: theme.palette.text.secondary,
              '&:hover': { color: theme.palette.primary.main },
            }}
          >
            {t('chatHeader.changeAgent')}
          </Button>
        )}
      </Box>
    );
  },
);
