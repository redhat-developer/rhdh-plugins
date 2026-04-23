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
import { useApp } from '@backstage/core-plugin-api';
import Box from '@mui/material/Box';
import MuiIcon from '@mui/material/Icon';
import type { SvgIconComponent } from '@mui/icons-material';
import type { SxProps, Theme } from '@mui/material/styles';
import {
  ScorecardSuccessStatusIcon,
  ScorecardWarningStatusIcon,
  ScorecardErrorStatusIcon,
} from '../..';

const builtInIcons: Record<string, SvgIconComponent> = {
  scorecardSuccessStatusIcon: ScorecardSuccessStatusIcon,
  scorecardWarningStatusIcon: ScorecardWarningStatusIcon,
  scorecardErrorStatusIcon: ScorecardErrorStatusIcon,
};

/**
 * @public
 */
export interface ScorecardIconProps {
  icon: string;
  size?: 'small' | 'medium' | 'large';
  sx?: SxProps<Theme>;
}

/**
 * @public
 */
export const ScorecardIcon = ({
  icon,
  size = 'small',
  sx,
}: ScorecardIconProps) => {
  const app = useApp();
  if (!icon) {
    return null;
  }

  const SystemIcon = app.getSystemIcon(icon) ?? builtInIcons[icon];
  if (SystemIcon) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', ...sx }}>
        <SystemIcon fontSize={size} />
      </Box>
    );
  }

  if (icon.startsWith('<svg')) {
    const svgDataUri = `data:image/svg+xml;base64,${btoa(icon)}`;
    return (
      <MuiIcon fontSize={size} sx={sx}>
        <img src={svgDataUri} alt="" />
      </MuiIcon>
    );
  }

  if (
    icon.startsWith('data:') ||
    icon.startsWith('https://') ||
    icon.startsWith('http://') ||
    icon.startsWith('/')
  ) {
    return (
      <MuiIcon fontSize={size} baseClassName="material-icons-outlined" sx={sx}>
        <img src={icon} alt="" height="100%" width="100%" />
      </MuiIcon>
    );
  }

  return (
    <MuiIcon fontSize={size} baseClassName="material-icons-outlined" sx={sx}>
      {icon}
    </MuiIcon>
  );
};
