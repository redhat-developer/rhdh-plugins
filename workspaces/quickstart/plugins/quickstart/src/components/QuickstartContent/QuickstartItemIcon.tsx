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

import type { ComponentType } from 'react';
import AdminPanelSettingsOutlinedIcon from '@mui/icons-material/AdminPanelSettingsOutlined';
import CategoryOutlinedIcon from '@mui/icons-material/CategoryOutlined';
import ControlPointOutlinedIcon from '@mui/icons-material/ControlPointOutlined';
import FileCopyOutlinedIcon from '@mui/icons-material/FileCopyOutlined';
import LoginIcon from '@mui/icons-material/Login';
import PowerOutlinedIcon from '@mui/icons-material/PowerOutlined';
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined';
import VpnKeyOutlinedIcon from '@mui/icons-material/VpnKeyOutlined';
import Box from '@mui/material/Box';
import { SxProps, Theme } from '@mui/material/styles';
import { SvgIconProps } from '@mui/material/SvgIcon';

import { QuickstartIcon } from './QuickstartIcon';
import { LightspeedIcon } from './LightspeedIcon';

export interface QuickstartItemIconProps {
  icon?: string;
  sx?: SxProps<Theme>;
}

/**
 * Legacy PascalCase step-type ids → MUI outlined components for the drawer.
 *
 * Checked before `QuickstartIcon` so step rows keep the historical OFS glyphs.
 * These are intentionally separate from `quickstartLegacyIconAliases`, which
 * maps the same keys to system / Material ligature ids for the generic
 * `QuickstartIcon` path (help menu, CTAs, etc.). Updating one map does not
 * update the other — keep both in sync when adding a new legacy id.
 */
const commonIcons: Record<
  string,
  ComponentType<SvgIconProps<'svg', object>>
> = {
  Admin: AdminPanelSettingsOutlinedIcon,
  Rbac: VpnKeyOutlinedIcon,
  Git: FileCopyOutlinedIcon,
  Plugins: PowerOutlinedIcon,
  Import: LoginIcon,
  Catalog: CategoryOutlinedIcon,
  SelfService: ControlPointOutlinedIcon,
  Learning: SchoolOutlinedIcon,
};

export const QuickstartItemIcon = ({ icon, sx }: QuickstartItemIconProps) => {
  if (!icon) {
    return null;
  }

  if (icon === 'Lightspeed') {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', ...sx }}>
        <LightspeedIcon />
      </Box>
    );
  }

  // Prefer commonIcons over system icons so legacy step ids keep OFS MUI glyphs.
  const CommonIcon = commonIcons[icon];
  if (CommonIcon) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', ...sx }}>
        <CommonIcon fontSize="medium" />
      </Box>
    );
  }

  return <QuickstartIcon icon={icon} size="medium" sx={sx} />;
};
