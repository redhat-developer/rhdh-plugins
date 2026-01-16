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
import Drawer from '@mui/material/Drawer';

import { ThemeConfig } from '@red-hat-developer-hub/backstage-plugin-theme';

export type CustomDrawerProps = {
  children: React.ReactNode;
  minWidth?: number;
  maxWidth?: number;
  initialWidth?: number;
  isDrawerOpen: boolean;
  drawerWidth?: number;
  onWidthChange?: (width: number) => void;
  [key: string]: any;
};

export const CustomDrawer = (props: CustomDrawerProps) => {
  const {
    children,
    minWidth = 400,
    maxWidth = 800,
    initialWidth = 400,
    isDrawerOpen,
    drawerWidth,
    onWidthChange,
    ...drawerProps
  } = props;

  // Ensure anchor is always 'right' and not overridden by drawerProps
  const { anchor: _, ...restDrawerProps } = drawerProps;

  return (
    <Drawer
      {...restDrawerProps}
      anchor="right"
      sx={{
        '& .v5-MuiDrawer-paper': {
          width: drawerWidth || initialWidth,
          boxSizing: 'border-box',
          backgroundColor: theme => {
            const themeConfig = theme as ThemeConfig;
            return (
              themeConfig.palette?.rhdh?.general?.sidebarBackgroundColor ||
              theme.palette.background.paper
            );
          },
          justifyContent: 'space-between',
        },
        // Only apply header offset when global header exists
        'body:has(#global-header) &': {
          '& .v5-MuiDrawer-paper': {
            top: '64px !important',
            height: 'calc(100vh - 64px) !important',
          },
        },
      }}
      variant="persistent"
      open={isDrawerOpen}
    >
      <Box sx={{ height: '100%', position: 'relative' }}>{children}</Box>
    </Drawer>
  );
};
