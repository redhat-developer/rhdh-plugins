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

import { useEffect, useState, memo, type FC } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';
import { useTheme, alpha } from '@mui/material/styles';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import StreamIcon from '@mui/icons-material/Stream';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { useApi } from '@backstage/core-plugin-api';
import { augmentApiRef } from '../../api';
import { useTranslation } from '../../hooks/useTranslation';
import { useStatus } from '../../hooks';
import type { KagentiAgentCard } from '@red-hat-developer-hub/backstage-plugin-augment-common';
import type { ChatAgentConfig } from '../../types';

interface ChatHeaderProps {
  selectedModel?: string;
  currentAgent?: string;
  onChangeAgent?: () => void;
  healthWarning?: string;
  agentConfig?: ChatAgentConfig;
}

function getAgentAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return `hsl(${Math.abs(hash) % 360}, 55%, 50%)`;
}

export const ChatHeader: FC<ChatHeaderProps> = memo(function ChatHeader({
  selectedModel,
  currentAgent,
  onChangeAgent,
  healthWarning,
  agentConfig,
}) {
  const { t } = useTranslation();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const api = useApi(augmentApiRef);
  const { status } = useStatus();
  const isKagenti = status?.providerId === 'kagenti';

  const [agentCard, setAgentCard] = useState<KagentiAgentCard | null>(null);

  useEffect(() => {
    if (!isKagenti || !selectedModel || !selectedModel.includes('/')) {
      setAgentCard(null);
      return undefined;
    }
    const [ns, name] = selectedModel.split('/');
    let cancelled = false;
    api
      .getKagentiAgent(ns, name)
      .then(detail => {
        if (!cancelled && detail.agentCard) setAgentCard(detail.agentCard);
      })
      .catch(() => {
        /* optional */
      });
    return () => {
      cancelled = true;
    };
  }, [api, isKagenti, selectedModel]);

  if (!selectedModel) return null;

  const rawName =
    currentAgent ||
    (selectedModel.includes('/')
      ? selectedModel.split('/').pop()
      : selectedModel) ||
    selectedModel;
  const displayName = agentConfig?.displayName || agentCard?.name || rawName;
  const description = agentConfig?.description || agentCard?.description;
  const namespace = selectedModel.includes('/')
    ? selectedModel.split('/')[0]
    : undefined;
  const avatarColor =
    agentConfig?.accentColor || getAgentAvatarColor(displayName);
  const avatarUrl = agentConfig?.avatarUrl;
  const hasWarning = !!healthWarning;

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
        minHeight: 52,
      }}
    >
      {/* Agent Avatar */}
      {avatarUrl ? (
        <Box
          component="img"
          src={avatarUrl}
          alt={displayName}
          sx={{
            width: 36,
            height: 36,
            borderRadius: 1.5,
            objectFit: 'cover',
            flexShrink: 0,
          }}
        />
      ) : (
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: 1.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: alpha(avatarColor, isDark ? 0.2 : 0.12),
            color: avatarColor,
            fontWeight: 700,
            fontSize: '1rem',
            flexShrink: 0,
          }}
        >
          {displayName.charAt(0).toUpperCase()}
        </Box>
      )}

      {/* Agent Info */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <Box
            sx={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              bgcolor: hasWarning
                ? theme.palette.warning.main
                : theme.palette.success.main,
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
          {/* Streaming badge */}
          {agentCard && (
            <Chip
              icon={<StreamIcon sx={{ fontSize: '12px !important' }} />}
              label={agentCard.streaming ? 'Streaming' : 'Non-streaming'}
              size="small"
              variant="outlined"
              sx={{
                height: 20,
                fontSize: '0.65rem',
                '& .MuiChip-label': { px: 0.5 },
              }}
            />
          )}
          {/* Protocol / framework chips */}
          {agentCard?.defaultInputModes &&
            agentCard.defaultInputModes.length > 0 && (
              <Chip
                label="A2A"
                size="small"
                variant="outlined"
                sx={{ height: 20, fontSize: '0.65rem' }}
              />
            )}
          {/* Health warning */}
          {hasWarning && (
            <Tooltip title={healthWarning}>
              <WarningAmberIcon
                sx={{ fontSize: 16, color: theme.palette.warning.main }}
              />
            </Tooltip>
          )}
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, ml: 2 }}>
          {namespace && (
            <Typography
              variant="caption"
              sx={{
                color: theme.palette.text.disabled,
                fontSize: '0.65rem',
              }}
            >
              {namespace}
            </Typography>
          )}
          {description && (
            <>
              {namespace && (
                <Typography
                  variant="caption"
                  sx={{
                    color: theme.palette.text.disabled,
                    fontSize: '0.65rem',
                  }}
                >
                  &middot;
                </Typography>
              )}
              <Typography
                variant="caption"
                noWrap
                sx={{
                  color: theme.palette.text.secondary,
                  fontSize: '0.65rem',
                  maxWidth: 300,
                }}
              >
                {description}
              </Typography>
            </>
          )}
        </Box>
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
});
