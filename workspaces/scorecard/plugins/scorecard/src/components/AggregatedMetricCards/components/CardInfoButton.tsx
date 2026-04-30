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
import { useTheme } from '@mui/material/styles';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

import { getLastUpdatedLabel } from '../../../utils';
import { useTranslation } from '../../../hooks/useTranslation';
import { useLanguage } from '../../../hooks/useLanguage';

export const CardInfoButton = ({ timestamp }: { timestamp: string }) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const locale = useLanguage();

  const lastUpdatedLabel = getLastUpdatedLabel(timestamp, locale);

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', height: '100%', mr: 2 }}>
      <Tooltip
        title={
          <Box sx={{ textAlign: 'center' }}>
            {lastUpdatedLabel !== '--'
              ? t('metric.lastUpdated' as any, { timestamp: lastUpdatedLabel })
              : t('metric.lastUpdatedNotAvailable')}
          </Box>
        }
        placement="top"
        arrow
        componentsProps={{
          tooltip: {
            sx: {
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              color: 'white',
              fontSize: '0.875rem',
              p: 1.5,
            },
          },
        }}
      >
        <IconButton data-testid="scorecard-homepage-card-info">
          <InfoOutlinedIcon
            sx={{ color: theme.palette.text.secondary, fontSize: '1.75rem' }}
          />
        </IconButton>
      </Tooltip>
    </Box>
  );
};
