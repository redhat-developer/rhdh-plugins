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
    icon.startsWith('/')
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

  return (
    <MuiIcon
      fontSize={size}
      baseClassName="material-icons-outlined"
      sx={layout}
    >
      {icon}
    </MuiIcon>
  );
};
