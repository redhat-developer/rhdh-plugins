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
  SupportLevel,
  SupportProvider,
} from '@red-hat-developer-hub/backstage-plugin-marketplace-common';

const colors = {
  certified: '#A18FFF',
  verified: '#6EC664',
  custom: '#EC7A08',
} as const;

interface BadgeOptions {
  isBadge?: boolean;
  color?: string;
  label?: string;
  tooltip?: string;
  statusTooltip?: string;
}

const getBadgeOptions = (
  entity: MarketplacePlugin | MarketplacePackage,
): BadgeOptions | null => {
  if (entity.metadata.annotations?.[MarketplaceAnnotation.CERTIFIED_BY]) {
    return {
      isBadge: true,
      color: colors.certified,
      label: 'Certified',
      tooltip: `Certified by ${entity.metadata.annotations[MarketplaceAnnotation.CERTIFIED_BY]}`,
      statusTooltip: `Stable and secured by ${entity.metadata.annotations[MarketplaceAnnotation.CERTIFIED_BY]}`,
    };
  }
  if (
    entity.spec?.support?.level === SupportLevel.PRODUCTION &&
    entity.spec?.support?.name === SupportProvider.RED_HAT
  ) {
    return {
      isBadge: true,
      color: colors.verified,
      label: 'Generally available (GA)',
      tooltip: 'Generally available (GA) and supported by Red Hat',
      statusTooltip: 'Production-ready and supported by Red Hat',
    };
  }

  if (
    entity.metadata.annotations?.[MarketplaceAnnotation.PRE_INSTALLED] ===
    'false'
  ) {
    return {
      isBadge: true,
      color: colors.custom,
      label: 'Custom plugin',
      tooltip: 'Custom plugin',
      statusTooltip: 'Plugins added by the administrator',
    };
  }
  if (entity.spec?.support?.name === SupportProvider.BACKSTAGE_COMMUNITY) {
    return {
      isBadge: false,
      label: 'Community plugin',
      statusTooltip: 'Open-source plugins, no official support',
    };
  }
  if (entity.spec?.support?.level === SupportLevel.TECH_PREVIEW) {
    return {
      isBadge: false,
      label: 'Tech preview (TP)',
      statusTooltip: 'Plugin still in development',
    };
  }
  if (entity.spec?.support?.level === SupportLevel.DEV_PREVIEW) {
    return {
      isBadge: false,
      label: 'Dev preview (DP)',
      statusTooltip: 'An early-stage, experimental plugin',
    };
  }

  return null;
};

export const BadgeChip = ({ plugin }: { plugin: MarketplacePlugin }) => {
  if (!plugin) {
    return null;
  }
  const options = getBadgeOptions(plugin);
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
        title={options.tooltip}
        sx={{
          cursor: 'pointer',
        }}
      />
    </Tooltip>
  );
};

export const BadgeTriange = ({ plugin }: { plugin: MarketplacePlugin }) => {
  if (!plugin) {
    return null;
  }
  const options = getBadgeOptions(plugin);
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
