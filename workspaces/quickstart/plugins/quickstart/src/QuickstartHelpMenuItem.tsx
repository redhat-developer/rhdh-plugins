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

import { useAppDrawer } from '@red-hat-developer-hub/backstage-plugin-app-react';
import Box from '@mui/material/Box';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';

import { QuickstartIcon } from './components/QuickstartContent/QuickstartIcon';
import { QUICKSTART_DRAWER_ID } from './const';
import { useTranslation } from './hooks/useTranslation';

/**
 * Help-dropdown menu item that toggles the Quick start drawer.
 *
 * Uses a local MUI `MenuItem` styled like global-header dropdown entries so
 * this module does not bundle `global-header/components` (and its
 * `@backstage/core-components` transitive deps) into the quickstart MF graph.
 * The help menu blueprint `loader` still defers fetching until the dropdown
 * opens.
 */
export const QuickstartHelpMenuItem = ({
  handleClose,
}: {
  handleClose?: () => void;
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const { toggleDrawer } = useAppDrawer();

  const handleClick = () => {
    toggleDrawer(QUICKSTART_DRAWER_ID);
    handleClose?.();
  };

  return (
    <MenuItem
      disableRipple
      disableTouchRipple
      onClick={handleClick}
      sx={{
        py: 0.5,
        px: 0,
        width: '100%',
        boxSizing: 'border-box',
        display: 'flex',
        color: 'inherit',
        textDecoration: 'none',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          my: 1,
          px: 2,
          boxSizing: 'border-box',
          color: 'inherit',
          width: '100%',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <QuickstartIcon
            icon="waving_hand"
            size="small"
            sx={{
              marginRight: 1,
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              color:
                theme.palette.mode === 'dark'
                  ? theme.palette.text.primary
                  : theme.palette.text.disabled,
            }}
          />
          <Typography variant="body2" color={theme.palette.text.primary}>
            {t('button.quickstart')}
          </Typography>
        </Box>
      </Box>
    </MenuItem>
  );
};
