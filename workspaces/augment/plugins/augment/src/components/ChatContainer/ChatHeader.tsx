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
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import { useTheme, alpha } from '@mui/material/styles';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import StreamIcon from '@mui/icons-material/Stream';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import CodeIcon from '@mui/icons-material/Code';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import { useApi } from '@backstage/core-plugin-api';
import { augmentApiRef } from '../../api';
import { useStatus, useChatViewMode } from '../../hooks';
import { typeScale, containerPadding } from '../../theme/tokens';
import type { KagentiAgentCard } from '@red-hat-developer-hub/backstage-plugin-augment-common';
import type { ChatAgentConfig } from '../../types';

interface ChatHeaderProps {
  selectedModel?: string;
  currentAgent?: string;
  onChangeAgent?: () => void;
  healthWarning?: string;
  agentConfig?: ChatAgentConfig;
  onExport?: () => void;
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
  onExport,
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const api = useApi(augmentApiRef);
  const { status } = useStatus();
  const hasAgentCards = status?.capabilities?.agentCards ?? (status?.providerId === 'kagenti');
  const { isDev, toggleMode } = useChatViewMode();

  const [agentCard, setAgentCard] = useState<KagentiAgentCard | null>(null);

  useEffect(() => {
    if (!hasAgentCards || !selectedModel || !selectedModel.includes('/')) {
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
  }, [api, hasAgentCards, selectedModel]);

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
        px: containerPadding,
        py: 1,
        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
        bgcolor: alpha(theme.palette.background.paper, isDark ? 0.6 : 0.8),
        flexShrink: 0,
        minHeight: 52,
      }}
    >
      {/* Marketplace back button */}
      {onChangeAgent && (
        <Tooltip title="Agent Marketplace" placement="bottom">
          <IconButton
            size="small"
            onClick={onChangeAgent}
            aria-label="Agent Marketplace"
            sx={{
              p: 0.75,
              borderRadius: 1.5,
              border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
              color: theme.palette.text.secondary,
              '&:hover': {
                color: theme.palette.primary.main,
                borderColor: alpha(theme.palette.primary.main, 0.4),
                bgcolor: alpha(theme.palette.primary.main, 0.06),
              },
            }}
          >
            <StorefrontOutlinedIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Tooltip>
      )}

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
            sx={{ fontWeight: 600, fontSize: typeScale.body.fontSize }}
          >
            {displayName}
          </Typography>
          {/* Streaming badge */}
          {agentCard && (
            <Chip
              icon={<StreamIcon sx={{ fontSize: 12 }} />}
              label={agentCard.streaming ? 'Streaming' : 'Non-streaming'}
              size="small"
              variant="outlined"
              sx={{
                height: 20,
                fontSize: typeScale.micro.fontSize,
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
                sx={{ height: 20, fontSize: typeScale.micro.fontSize }}
              />
            )}
          {/* Health warning */}
          {hasWarning && (
            <Tooltip title={healthWarning}>
              <WarningAmberIcon
                tabIndex={0}
                role="img"
                aria-label={`Warning: ${healthWarning}`}
                sx={{ fontSize: 16, color: theme.palette.warning.main, cursor: 'help' }}
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
                fontSize: typeScale.micro.fontSize,
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
                    fontSize: typeScale.micro.fontSize,
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
                  fontSize: typeScale.micro.fontSize,
                  maxWidth: 300,
                }}
              >
                {description}
              </Typography>
            </>
          )}
        </Box>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        {/* View mode toggle */}
        <Tooltip
          title={isDev ? 'Switch to User mode' : 'Switch to Dev mode'}
          placement="bottom"
        >
          <IconButton
            size="small"
            onClick={toggleMode}
            aria-label={isDev ? 'Switch to User mode' : 'Switch to Dev mode'}
            sx={{
              p: 0.5,
              borderRadius: 1.5,
              color: isDev
                ? theme.palette.warning.main
                : theme.palette.text.secondary,
              bgcolor: isDev
                ? alpha(theme.palette.warning.main, isDark ? 0.15 : 0.08)
                : 'transparent',
              '&:hover': {
                color: isDev
                  ? theme.palette.warning.dark
                  : theme.palette.primary.main,
                bgcolor: isDev
                  ? alpha(theme.palette.warning.main, 0.2)
                  : alpha(theme.palette.primary.main, 0.08),
              },
            }}
          >
            {isDev ? (
              <CodeIcon sx={{ fontSize: 16 }} />
            ) : (
              <PersonOutlineIcon sx={{ fontSize: 16 }} />
            )}
          </IconButton>
        </Tooltip>
        {/* Export */}
        {onExport && (
          <Tooltip title="Export conversation" placement="bottom">
            <IconButton
              size="small"
              onClick={onExport}
              aria-label="Export conversation"
              sx={{
                p: 0.5,
                color: 'text.secondary',
                '&:hover': { color: 'primary.main' },
              }}
            >
              <FileDownloadOutlinedIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
        )}
      </Box>
    </Box>
  );
});
