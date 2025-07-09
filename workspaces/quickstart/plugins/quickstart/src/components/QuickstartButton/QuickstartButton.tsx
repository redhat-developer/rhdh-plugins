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

import { CSSProperties, useCallback } from 'react';
import MenuItem from '@mui/material/MenuItem';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import WavingHandIcon from '@mui/icons-material/WavingHandOutlined';
import { useQuickstartPermission } from '../../hooks/useQuickstartPermission';
import { useQuickstartDrawerContext } from '../../hooks/useQuickstartDrawerContext';

/**
 * Props for the QuickstartButton component
 * @public
 */
export interface QuickstartButtonProps {
  /**
   * The title text to display in the button
   * @defaultValue 'Quick start'
   */
  title?: string;
  /**
   * Custom CSS styles to apply to the button
   */
  style?: CSSProperties;
  /**
   * Optional callback function to execute when the button is clicked
   */
  onClick?: () => void;
}

/**
 * @public
 */
export const QuickstartButton = ({
  title = 'Quick start',
  style,
  onClick = () => {},
}: QuickstartButtonProps) => {
  const isAllowed = useQuickstartPermission();
  const { toggleDrawer } = useQuickstartDrawerContext();
  const theme = useTheme();

  const handleClick = useCallback(() => {
    toggleDrawer();
    onClick();
  }, [toggleDrawer, onClick]);

  return isAllowed ? (
    <MenuItem
      sx={{
        width: '100%',
        color: 'inherit',
        ...style,
      }}
      data-testid="quickstart-button"
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
          <WavingHandIcon
            sx={{
              fontSize: 20,
              marginRight: '0.5rem',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              color:
                theme.palette.mode === 'dark'
                  ? theme.palette.text.primary
                  : theme.palette.text.disabled,
            }}
          />
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
            }}
          >
            <Typography variant="body2" color={theme.palette.text.primary}>
              {title}
            </Typography>
          </Box>
        </Box>
      </Box>
    </MenuItem>
  ) : null;
};
