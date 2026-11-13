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
import { useTranslationRef } from '@backstage/frontend-plugin-api';
import AccessTimeOutlined from '@mui/icons-material/AccessTimeOutlined';
import CheckIcon from '@mui/icons-material/Check';
import ContentCopyOutlined from '@mui/icons-material/ContentCopyOutlined';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Fade from '@mui/material/Fade';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import { appReactTranslationRef } from '../../translations';
import {
  partitionTimeSaved,
  readTimeSavedMinutes,
  TIME_SAVED_ANNOTATION_SNIPPET,
} from './timeSaved';

type TemplateWithAnnotations = {
  metadata?: {
    annotations?: Record<string, string>;
  };
};

const tooltipProps = {
  placement: 'top' as const,
  arrow: true,
  // Grow scales width and height at different rates, which makes the short
  // estimate tooltip jump. Fade keeps it in its final position.
  TransitionComponent: Fade,
  componentsProps: {
    tooltip: {
      sx: {
        maxWidth: 280,
        bgcolor: 'background.paper',
        color: 'text.primary',
        boxShadow: 3,
      },
    },
    arrow: {
      sx: { color: 'background.paper' },
    },
  },
};

const AddTimeSavedTooltip = () => {
  const { t } = useTranslationRef(appReactTranslationRef);
  const [copied, setCopied] = useState(false);

  const copyAnnotation = async () => {
    await window.navigator.clipboard.writeText(TIME_SAVED_ANNOTATION_SNIPPET);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Box>
      <Typography variant="body2">
        {t('templateCard.timeSaved.addTooltip')}
      </Typography>
      <Box
        sx={theme => ({
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          mt: 1,
          px: 1,
          py: 0.5,
          borderRadius: 1,
          bgcolor:
            theme.palette.mode === 'dark' ? '#36373A' : theme.palette.grey[200],
          color: theme.palette.text.primary,
        })}
      >
        <Typography variant="body2" component="code" sx={{ flex: 1 }}>
          {TIME_SAVED_ANNOTATION_SNIPPET}
        </Typography>
        <IconButton
          size="small"
          aria-label={
            copied
              ? t('templateCard.timeSaved.copied')
              : t('templateCard.timeSaved.copy')
          }
          onClick={copyAnnotation}
          sx={{ color: 'inherit' }}
        >
          {copied ? (
            <CheckIcon fontSize="inherit" />
          ) : (
            <ContentCopyOutlined fontSize="inherit" />
          )}
        </IconButton>
      </Box>
    </Box>
  );
};

/**
 * Default template-card chip for estimated time saved.
 * Shows the owner estimate when `backstage.io/time-saved` is set, and a
 * copyable "add annotation" hint when it is not.
 */
export const TimeSavedChip = (props: { template: TemplateWithAnnotations }) => {
  const { template } = props;
  const { t } = useTranslationRef(appReactTranslationRef);
  const minutes = readTimeSavedMinutes(template);

  if (minutes === undefined) {
    return (
      <Tooltip title={<AddTimeSavedTooltip />} describeChild {...tooltipProps}>
        <Chip
          size="small"
          variant="outlined"
          icon={<AccessTimeOutlined />}
          label={t('templateCard.timeSaved.add')}
          sx={{ margin: 0 }}
          data-testid="time-saved-add"
        />
      </Tooltip>
    );
  }

  const duration = partitionTimeSaved(minutes);
  const durationParts: string[] = [];
  if (duration.days > 0) {
    durationParts.push(
      t('templateCard.timeSaved.day', { count: duration.days }),
    );
  }
  if (duration.hours > 0) {
    durationParts.push(
      t('templateCard.timeSaved.hour', { count: duration.hours }),
    );
  }
  if (duration.minutes > 0) {
    durationParts.push(
      t('templateCard.timeSaved.minute', { count: duration.minutes }),
    );
  }
  const durationLabel =
    durationParts.length > 0
      ? durationParts.join(' ')
      : t('templateCard.timeSaved.minute', { count: 0 });

  return (
    <Tooltip
      title={
        <Typography variant="body2">
          {t('templateCard.timeSaved.estimateTooltip')}
        </Typography>
      }
      {...tooltipProps}
    >
      <Chip
        size="small"
        icon={<AccessTimeOutlined />}
        label={t('templateCard.timeSaved.estimate', {
          duration: durationLabel,
        })}
        sx={{ margin: 0 }}
        data-testid="time-saved-estimate"
      />
    </Tooltip>
  );
};
