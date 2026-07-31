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

// Self-load the outlined icon font on this lazy UI path so ligature fallbacks
// work in hosts (e.g. RHDH) that do not import material-icons CSS themselves.
import 'material-icons/iconfont/outlined.css';

import type { CSSProperties } from 'react';
import { useApp } from '@backstage/core-plugin-api';
import MuiIcon from '@mui/material/Icon';
import Box from '@mui/material/Box';

/**
 * @public
 */
export interface HeaderIconProps {
  icon: string;
  size?: 'small' | 'medium' | 'large';
  layout?: CSSProperties;
}

/**
 * Converts camelCase icon names to snake_case for Material Icons ligatures.
 * e.g. `manageAccounts` -> `manage_accounts`, `accountCircle` -> `account_circle`
 */
function toMaterialIconLigature(name: string): string {
  return name.replace(/[A-Z]/g, m => `_${m.toLowerCase()}`);
}

/**
 * Same resolution order as Quickstart's `QuickstartItemIcon`: system icon,
 * inline SVG, image URL, then Material Icons outlined ligature. The font CSS
 * is imported above so the ligature path works without host setup.
 *
 * @public
 */
export const HeaderIcon = ({
  icon,
  size = 'small',
  layout,
}: HeaderIconProps) => {
  const app = useApp();
  if (!icon) {
    return null;
  }

  const SystemIcon = app.getSystemIcon(icon);
  if (SystemIcon) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', ...layout }}>
        <SystemIcon fontSize={size} />
      </Box>
    );
  }

  if (icon.startsWith('<svg')) {
    const svgDataUri = `data:image/svg+xml;base64,${btoa(icon)}`;
    return (
      <MuiIcon fontSize={size} sx={layout}>
        <img src={svgDataUri} alt="" />
      </MuiIcon>
    );
  }

  if (
    icon.startsWith('https://') ||
    icon.startsWith('http://') ||
    icon.startsWith('/') ||
    icon.startsWith('data:image/')
  ) {
    return (
      <MuiIcon
        fontSize={size}
        baseClassName="material-icons-outlined"
        sx={layout}
      >
        <img src={icon} alt="" height="100%" width="100%" />
      </MuiIcon>
    );
  }

  const ligature = toMaterialIconLigature(icon);
  return (
    <MuiIcon
      fontSize={size}
      baseClassName="material-icons-outlined"
      sx={layout}
    >
      {ligature}
    </MuiIcon>
  );
};
