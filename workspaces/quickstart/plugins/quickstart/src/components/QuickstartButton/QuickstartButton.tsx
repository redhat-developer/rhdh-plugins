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
import { useQuickstartDrawerContext } from '../../hooks/useQuickstartDrawerContext';
import { useTranslation } from '../../hooks/useTranslation';
import { configApiRef, useApiHolder } from '@backstage/core-plugin-api';
import { QuickstartItemData } from '../../types';
import { filterQuickstartItemsByRole } from '../../utils';
// Role is now provided through context

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
 * Quickstart button component for the global header help dropdown
 * @public
 */
export const QuickstartButton = ({
  title,
  style,
  onClick = () => {},
}: QuickstartButtonProps) => {
  // All hooks must be called at the top level, before any early returns
  const { t } = useTranslation();
  const { toggleDrawer, userRole, roleLoading } = useQuickstartDrawerContext();
  const theme = useTheme();

  // Check if there are any quickstart items available for the current user
  const apiHolder = useApiHolder();
  const config = apiHolder.get(configApiRef);
  const quickstartItems: QuickstartItemData[] = config?.has('app.quickstart')
    ? config.get('app.quickstart')
    : [];

  const filteredItems =
    !roleLoading && userRole
      ? filterQuickstartItemsByRole(quickstartItems, userRole)
      : [];

  const defaultTitle = t('button.quickstart');

  const handleClick = useCallback(() => {
    toggleDrawer();
    onClick();
  }, [toggleDrawer, onClick]);

  // Hide the button if there are no quickstart items for the user
  if (!roleLoading && filteredItems.length === 0) {
    return null;
  }

  return (
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
              {title || defaultTitle}
            </Typography>
          </Box>
        </Box>
      </Box>
    </MenuItem>
  );
};
