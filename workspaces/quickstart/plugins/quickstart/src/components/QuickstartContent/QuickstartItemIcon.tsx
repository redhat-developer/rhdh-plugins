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

import MuiIcon from '@mui/material/Icon';
import AdminPanelSettingsOutlinedIcon from '@mui/icons-material/AdminPanelSettingsOutlined';
import VpnKeyOutlinedIcon from '@mui/icons-material/VpnKeyOutlined';
import FileCopyOutlinedIcon from '@mui/icons-material/FileCopyOutlined';
import PowerOutlinedIcon from '@mui/icons-material/PowerOutlined';
import LoginIcon from '@mui/icons-material/Login';
import CategoryOutlinedIcon from '@mui/icons-material/CategoryOutlined';
import ControlPointOutlinedIcon from '@mui/icons-material/ControlPointOutlined';
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined';
import { SxProps, Theme } from '@mui/material/styles';
import { useApp } from '@backstage/core-plugin-api';
import Box from '@mui/material/Box';

export interface QuickstartItemIconProps {
  icon?: string;
  sx?: SxProps<Theme>;
}

const commonIcons: {
  [k: string]: React.ReactNode;
} = {
  Admin: <AdminPanelSettingsOutlinedIcon />,
  Rbac: <VpnKeyOutlinedIcon />,
  Git: <FileCopyOutlinedIcon />,
  Plugins: <PowerOutlinedIcon />,
  Import: <LoginIcon />,
  Catalog: <CategoryOutlinedIcon />,
  SelfService: <ControlPointOutlinedIcon />,
  Learning: <SchoolOutlinedIcon />,
};

export const QuickstartItemIcon = ({ icon, sx }: QuickstartItemIconProps) => {
  const app = useApp();
  if (!icon) {
    return null;
  }

  const SystemIcon = app.getSystemIcon(icon);
  if (SystemIcon) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', ...sx }}>
        <SystemIcon fontSize="medium" />
      </Box>
    );
  }

  if (icon.startsWith('<svg')) {
    const svgDataUri = `data:image/svg+xml;base64,${btoa(icon)}`;
    return (
      <MuiIcon fontSize="medium" sx={sx}>
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
        fontSize="medium"
        baseClassName="material-icons-outlined"
        sx={sx}
      >
        <img src={icon} alt="" height="100%" width="100%" />
      </MuiIcon>
    );
  }

  return (
    <MuiIcon fontSize="medium" baseClassName="material-icons-outlined" sx={sx}>
      {commonIcons[icon] || icon}
    </MuiIcon>
  );
};
