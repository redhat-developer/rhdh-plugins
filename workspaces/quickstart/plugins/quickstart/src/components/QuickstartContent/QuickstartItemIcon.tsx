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

import type { ComponentType, CSSProperties } from 'react';
import { Box } from '@backstage/ui';
import {
  RiAddCircleLine,
  RiAdminLine,
  RiKey2Line,
  RiLoginBoxLine,
  RiPlugLine,
  RiPriceTag3Line,
  RiFileCopyLine,
  RiGraduationCapLine,
} from '@remixicon/react';

import { QuickstartIcon } from './QuickstartIcon';
import { LightspeedIcon } from './LightspeedIcon';

export interface QuickstartItemIconProps {
  icon?: string;
  className?: string;
  style?: CSSProperties;
}

/**
 * Legacy PascalCase step-type ids → Remix outlined icons for the drawer.
 *
 * Checked before `QuickstartIcon` so step rows keep dedicated glyphs.
 * These are intentionally separate from `quickstartLegacyIconAliases`, which
 * maps the same keys to system / Material ligature ids for the generic
 * `QuickstartIcon` path (help menu, CTAs, etc.). Updating one map does not
 * update the other — keep both in sync when adding a new legacy id.
 */
const commonIcons: Record<string, ComponentType<{ size?: number | string }>> = {
  Admin: RiAdminLine,
  Rbac: RiKey2Line,
  Git: RiFileCopyLine,
  Plugins: RiPlugLine,
  Import: RiLoginBoxLine,
  Catalog: RiPriceTag3Line,
  SelfService: RiAddCircleLine,
  Learning: RiGraduationCapLine,
};

const commonIconTestIds: Record<string, string> = {
  Admin: 'AdminIcon',
  Rbac: 'RbacIcon',
  Git: 'GitIcon',
  Plugins: 'PluginsIcon',
  Import: 'ImportIcon',
  Catalog: 'CatalogIcon',
  SelfService: 'SelfServiceIcon',
  Learning: 'LearningIcon',
};

export const QuickstartItemIcon = ({
  icon,
  className,
  style,
}: QuickstartItemIconProps) => {
  if (!icon) {
    return null;
  }

  if (icon === 'Lightspeed') {
    return (
      <Box className={className} style={style}>
        <LightspeedIcon />
      </Box>
    );
  }

  // Prefer commonIcons over system icons so legacy step ids keep dedicated glyphs.
  const CommonIcon = commonIcons[icon];
  if (CommonIcon) {
    return (
      <Box
        className={className}
        style={style}
        data-testid={commonIconTestIds[icon]}
      >
        <CommonIcon size={24} />
      </Box>
    );
  }

  return (
    <QuickstartIcon
      icon={icon}
      size="medium"
      className={className}
      style={style}
    />
  );
};
