/*
 * Copyright The Backstage Authors
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

import Chip from '@mui/material/Chip';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import Tooltip from '@mui/material/Tooltip';

import {
  MarketplaceAnnotation,
  MarketplacePlugin,
  MarketplacePackage,
} from '@red-hat-developer-hub/backstage-plugin-marketplace-common';

import { useTranslation } from '../hooks/useTranslation';
import { marketplaceTranslationRef } from '../translations/ref';
import type { TranslationFunction } from '@backstage/core-plugin-api/alpha';

const colors = {
  certified: '#A18FFF',
  verified: '#6EC664',
  custom: '#EC7A08',
} as const;

interface BadgeOptions {
  color?: string;
  label: string;
  tooltip: string;
}

const getBadgeOptions = (
  entity: MarketplacePlugin | MarketplacePackage,
  t: TranslationFunction<typeof marketplaceTranslationRef.T>,
): BadgeOptions | null => {
  if (entity.metadata.annotations?.[MarketplaceAnnotation.CERTIFIED_BY]) {
    return {
      color: colors.certified,
      label: t('badges.certified'),
      tooltip: t('badges.certifiedBy' as any, {
        provider:
          entity.metadata.annotations[MarketplaceAnnotation.CERTIFIED_BY],
      }),
    };
  }

  if (entity.metadata.annotations?.[MarketplaceAnnotation.VERIFIED_BY]) {
    return {
      color: colors.verified,
      label: t('badges.verified'),
      tooltip: t('badges.verifiedBy' as any, {
        provider:
          entity.metadata.annotations[MarketplaceAnnotation.VERIFIED_BY],
      }),
    };
  }

  if (
    entity.metadata.annotations?.[MarketplaceAnnotation.PRE_INSTALLED] ===
    'false'
  ) {
    return {
      color: colors.custom,
      label: t('badges.customPlugin'),
      tooltip: t('badges.customPlugin'),
    };
  }

  return null;
};

export const BadgeChip = ({ plugin }: { plugin: MarketplacePlugin }) => {
  const { t } = useTranslation();

  if (!plugin) {
    return null;
  }
  const options = getBadgeOptions(plugin, t);
  if (!options) {
    return null;
  }
  return (
    <Chip
      avatar={<TaskAltIcon style={{ color: options.color }} />}
      label={options.label}
      variant="outlined"
      size="small"
    />
  );
};

export const BadgeTriange = ({ plugin }: { plugin: MarketplacePlugin }) => {
  const { t } = useTranslation();

  if (!plugin) {
    return null;
  }
  const options = getBadgeOptions(plugin, t);
  if (!options) {
    return null;
  }
  // We can't extract as a prop because the icon size depends on it.
  const size = 40;

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ position: 'absolute' }}>
        <Tooltip title={options.tooltip} placement="top" arrow>
          <div style={{ width: size, height: size }}>
            <div
              style={{
                position: 'absolute',
                width: size,
                height: size,
                backgroundColor: options.color,
                clipPath: 'polygon(0 0, 100% 0, 0 100%)',
              }}
            />
            <TaskAltIcon
              style={{
                position: 'absolute',
                top: 4,
                left: 4,
                width: 16,
                height: 16,
                color: 'white',
              }}
            />
          </div>
        </Tooltip>
      </div>
    </div>
  );
};
