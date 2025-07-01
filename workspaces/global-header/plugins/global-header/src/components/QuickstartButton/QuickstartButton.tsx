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
import { MenuItemLink } from '../MenuItemLink/MenuItemLink';
import { QUICKSTART_DRAWER_OPEN_KEY } from './const';
import { useQuickstartButtonPermission } from './useQuickstartButtonPermission';

/**
 * @public
 */
export interface QuickstartButtonProps {
  icon?: string;
  title?: string;
  tooltip?: string;
  style?: CSSProperties;
}

/**
 * @public
 */
export const QuickstartButton = ({
  icon = 'quickstart',
  title = 'Quick start',
  tooltip,
  style,
}: QuickstartButtonProps) => {
  const isAllowed = useQuickstartButtonPermission();
  const toggleDrawer = useCallback(() => {
    const isDrawerOpen =
      localStorage.getItem(QUICKSTART_DRAWER_OPEN_KEY) === 'true';
    localStorage.setItem(
      QUICKSTART_DRAWER_OPEN_KEY,
      (!isDrawerOpen).toString(),
    );
  }, []);

  return isAllowed ? (
    <MenuItem
      sx={{ width: '100%', color: 'inherit', ...style }}
      data-testid="quickstart-button"
      onClick={toggleDrawer}
    >
      <MenuItemLink to="" title={title} icon={icon} tooltip={tooltip} />
    </MenuItem>
  ) : null;
};
