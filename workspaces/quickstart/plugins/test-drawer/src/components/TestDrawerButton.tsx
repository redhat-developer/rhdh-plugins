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
import MenuItem from '@mui/material/MenuItem';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import { useTestDrawerContext } from './TestDrawerContext';
import { useCallback } from 'react';

/**
 * Button component to toggle the Test Drawer
 *
 * Can be used in the global header help dropdown
 *
 * @public
 */
export const TestDrawerButton = ({
  onClick = () => {},
}: {
  onClick: () => void;
}) => {
  const { toggleDrawer } = useTestDrawerContext();
  const theme = useTheme();

  const handleClick = useCallback(() => {
    toggleDrawer();
    onClick();
  }, [toggleDrawer, onClick]);

  return (
    <MenuItem
      sx={{
        width: '100%',
        color: 'inherit',
      }}
      data-testid="test-drawer-button"
      onClick={handleClick}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          margin: '8px 0',
          color: 'inherit',
          width: '100%',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
            }}
          >
            <Typography variant="body2" color={theme.palette.text.primary}>
              Test Drawer
            </Typography>
          </Box>
        </Box>
      </Box>
    </MenuItem>
  );
};
