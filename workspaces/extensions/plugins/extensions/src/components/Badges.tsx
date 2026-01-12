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
  ExtensionsAnnotation,
  ExtensionsPlugin,
  ExtensionsPackage,
  ExtensionsSupportLevel,
} from '@red-hat-developer-hub/backstage-plugin-extensions-common';
import { colors } from '../consts';

import { useTranslation } from '../hooks/useTranslation';
import { extensionsTranslationRef } from '../translations/ref';
import type { TranslationFunction } from '@backstage/core-plugin-api/alpha';

interface BadgeOptions {
  isBadge?: boolean;
  color?: string;
  label?: string;
  tooltip?: string;
  statusTooltip?: string;
}

const getBadgeOptions = (
  entity: ExtensionsPlugin | ExtensionsPackage,
  t: TranslationFunction<typeof extensionsTranslationRef.T>,
): BadgeOptions | null => {
  const supportLevel = entity.spec?.support?.level;
  const supportProvider = entity.spec?.support?.provider;

  if (entity.metadata.annotations?.[ExtensionsAnnotation.CERTIFIED_BY]) {
    return {
      isBadge: true,
      color: colors.certified,
      label: t('badges.certified'),
      tooltip: t('badges.certifiedBy' as any, {
        provider:
          entity.metadata.annotations[ExtensionsAnnotation.CERTIFIED_BY],
      }),
      statusTooltip: t('badges.stableAndSecured' as any, {
        provider:
          entity.metadata.annotations[ExtensionsAnnotation.CERTIFIED_BY],
      }),
    };
  }
  if (supportLevel === ExtensionsSupportLevel.GENERALLY_AVAILABLE) {
    return {
      isBadge: true,
      color: colors.generallyAvailable,
      label: t('badges.generallyAvailable'),
      tooltip: supportProvider
        ? t('badges.gaAndSupportedBy' as any, { provider: supportProvider })
        : t('badges.gaAndSupported'),
      statusTooltip: supportProvider
        ? t('badges.productionReadyBy' as any, { provider: supportProvider })
        : t('badges.productionReady'),
    };
  }
  if (supportLevel === ExtensionsSupportLevel.COMMUNITY) {
    return {
      isBadge: false,
      label: t('badges.communityPlugin'),
      statusTooltip: t('badges.openSourceNoSupport'),
    };
  }
  if (supportLevel === ExtensionsSupportLevel.TECH_PREVIEW) {
    return {
      isBadge: false,
      label: t('badges.techPreview'),
      statusTooltip: t('badges.pluginInDevelopment'),
    };
  }
  if (supportLevel === ExtensionsSupportLevel.DEV_PREVIEW) {
    return {
      isBadge: false,
      label: t('badges.devPreview'),
      statusTooltip: t('badges.earlyStageExperimental'),
    };
  }

  if (
    entity.metadata?.annotations?.[ExtensionsAnnotation.PRE_INSTALLED] !==
    'true'
  ) {
    return {
      isBadge: true,
      color: colors.custom,
      label: t('badges.customPlugin'),
      tooltip: t('badges.customPlugin'),
      statusTooltip: t('badges.addedByAdmin'),
    };
  }

  return null;
};

export const BadgeChip = ({ plugin }: { plugin: ExtensionsPlugin }) => {
  const { t } = useTranslation();

  if (!plugin) {
    return null;
  }
  const options = getBadgeOptions(plugin, t);
  if (!options) {
    return null;
  }
  return (
    <Tooltip title={options.statusTooltip} placement="right" arrow>
      <Chip
        avatar={
          options.isBadge ? (
            <TaskAltIcon style={{ color: options.color }} />
          ) : undefined
        }
        label={options.label}
        variant="outlined"
        size="small"
        title={options.tooltip}
        sx={{
          cursor: 'pointer',
        }}
      />
    </Tooltip>
  );
};

export const BadgeTriange = ({ plugin }: { plugin: ExtensionsPlugin }) => {
  const { t } = useTranslation();

  if (!plugin) {
    return null;
  }
  const options = getBadgeOptions(plugin, t);
  if (!options || !options.isBadge) {
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
