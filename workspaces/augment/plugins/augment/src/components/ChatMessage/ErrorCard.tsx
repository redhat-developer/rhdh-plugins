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
import React, { useCallback, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import { useTheme, alpha } from '@mui/material/styles';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import WifiOffIcon from '@mui/icons-material/WifiOff';
import RefreshIcon from '@mui/icons-material/Refresh';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { useTranslation } from '../../hooks/useTranslation';

interface ErrorCardProps {
  message: string;
  code?: string;
  onRetry?: () => void;
}

function getErrorConfig(code?: string) {
  switch (code) {
    case 'safety_violation':
      return {
        icon: WarningAmberIcon,
        titleKey: 'errors.contentFiltered',
        palette: 'warning' as const,
        hintKey: 'errors.safetyHint',
        showRetry: false,
      };
    case 'network':
      return {
        icon: WifiOffIcon,
        titleKey: 'errors.connectionError',
        palette: 'info' as const,
        hintKey: 'errors.networkHint',
        showRetry: true,
      };
    case 'stream_error':
    default:
      return {
        icon: ErrorOutlineIcon,
        titleKey: 'errors.error',
        palette: 'error' as const,
        hintKey: undefined,
        showRetry: true,
      };
  }
}

export const ErrorCard = React.memo(function ErrorCard({
  message,
  code,
  onRetry,
}: ErrorCardProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const config = getErrorConfig(code);
  const Icon = config.icon;
  const color = theme.palette[config.palette].main;
  const title = t(config.titleKey);

  const errorBody = message.replace(/^Error:\s*/i, '');

  const handleCopyError = useCallback(async () => {
    const text = `${title}: ${errorBody}${code ? ` (code: ${code})` : ''}`;
    await window.navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [title, errorBody, code]);

  return (
    <Box
      role="alert"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        p: 2,
        borderRadius: 2,
        border: `1px solid ${alpha(color, 0.4)}`,
        backgroundColor: alpha(color, 0.06),
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Icon sx={{ fontSize: 20, color }} />
        <Typography
          variant="subtitle2"
          sx={{ fontWeight: 600, color, flex: 1 }}
        >
          {title}
        </Typography>
        <Tooltip
          title={copied ? t('errors.copied') : t('errors.copyErrorDetails')}
        >
          <IconButton
            size="small"
            onClick={handleCopyError}
            aria-label={t('errors.copyErrorDetails')}
            sx={{
              color: theme.palette.text.secondary,
              '&:hover': { color: theme.palette.text.primary },
            }}
          >
            <ContentCopyIcon sx={{ fontSize: 14 }} />
          </IconButton>
        </Tooltip>
      </Box>

      <Typography variant="body2" sx={{ color: theme.palette.text.primary }}>
        {errorBody}
      </Typography>

      {config.hintKey && (
        <Typography
          variant="caption"
          sx={{ color: theme.palette.text.secondary }}
        >
          {t(config.hintKey)}
        </Typography>
      )}

      {config.showRetry && onRetry && (
        <Box sx={{ mt: 0.5 }}>
          <Button
            size="small"
            variant="outlined"
            startIcon={<RefreshIcon sx={{ fontSize: 16 }} />}
            onClick={onRetry}
            sx={{
              textTransform: 'none',
              borderColor: alpha(color, 0.5),
              color,
              '&:hover': {
                borderColor: color,
                backgroundColor: alpha(color, 0.08),
              },
            }}
          >
            {t('errors.tryAgain')}
          </Button>
        </Box>
      )}
    </Box>
  );
});
