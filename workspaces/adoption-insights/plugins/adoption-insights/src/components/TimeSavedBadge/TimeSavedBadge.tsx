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

import { useState } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import AccessTimeOutlined from '@mui/icons-material/AccessTimeOutlined';
import ContentCopyOutlined from '@mui/icons-material/ContentCopyOutlined';

import { useTranslation } from '../../hooks/useTranslation';
import { parseTimeSavedMinutes } from '../../utils/formatTimeSaved';

const TIME_SAVED_ANNOTATION = 'rhdh.redhat.com/time-saved';

type TimeSavedBadgeProps = {
  annotations?: Record<string, string>;
};

export const TimeSavedBadge = ({ annotations }: TimeSavedBadgeProps) => {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const timeSavedValue = annotations?.[TIME_SAVED_ANNOTATION]?.trim();
  const parsed = parseTimeSavedMinutes(timeSavedValue);

  const handleCopy = async () => {
    await window.navigator.clipboard.writeText(
      t('timeSavedBadge.annotationSnippet'),
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (parsed) {
    const tp = t as (key: string, opts?: Record<string, unknown>) => string;
    const parts: string[] = [];
    if (parsed.days > 0) parts.push(tp('units.days', { value: parsed.days }));
    if (parsed.hours > 0)
      parts.push(tp('units.hours', { value: parsed.hours }));
    if (parsed.minutes > 0 && parsed.days === 0)
      parts.push(tp('units.minutes', { value: parsed.minutes }));
    const duration = parts.join(' ');

    return (
      <Tooltip
        title={t('timeSavedBadge.presentTooltip')}
        arrow
        componentsProps={{
          tooltip: { sx: { fontSize: '0.875rem', p: 1.5 } },
        }}
      >
        <Chip
          size="small"
          icon={<AccessTimeOutlined fontSize="small" />}
          label={tp('timeSavedBadge.estTimeSaved', { duration })}
        />
      </Tooltip>
    );
  }

  return (
    <Tooltip
      arrow
      componentsProps={{
        tooltip: { sx: { maxWidth: 360, p: 1.5 } },
      }}
      title={
        <Box>
          <Typography sx={{ mb: 1, fontSize: '0.875rem' }}>
            {t('timeSavedBadge.absentTooltipInstruction')}
          </Typography>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              bgcolor: 'rgba(255, 255, 255, 0.12)',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              borderRadius: 1,
              px: 1.5,
              py: 1,
            }}
          >
            <Typography
              variant="caption"
              component="code"
              sx={{
                fontFamily: 'monospace',
                flex: 1,
                color: '#fff',
                fontSize: '0.8rem',
                wordBreak: 'break-all',
              }}
            >
              {t('timeSavedBadge.annotationSnippet')}
            </Typography>
            <IconButton
              size="small"
              onClick={handleCopy}
              aria-label={t('timeSavedBadge.copyAnnotation')}
              sx={{ color: '#fff', ml: 1 }}
            >
              <ContentCopyOutlined fontSize="small" />
            </IconButton>
          </Box>
          {copied && (
            <Typography variant="caption" sx={{ mt: 0.5, display: 'block' }}>
              {t('timeSavedBadge.copied')}
            </Typography>
          )}
        </Box>
      }
    >
      <Chip
        size="small"
        icon={<AccessTimeOutlined fontSize="small" />}
        label={t('timeSavedBadge.addEstTimeSaved')}
        variant="outlined"
        sx={{
          borderStyle: 'dashed',
          cursor: 'pointer',
        }}
      />
    </Tooltip>
  );
};
