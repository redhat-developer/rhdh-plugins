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

import { forwardRef } from 'react';
import type { Ref } from 'react';

import { useAppDrawer } from '@red-hat-developer-hub/backstage-plugin-app-react';
import { MenuItemLink } from '@red-hat-developer-hub/backstage-plugin-global-header';

import MenuItem from '@mui/material/MenuItem';

import { QUICKSTART_DRAWER_ID } from './const';

/**
 * Help-dropdown menu item that toggles the Quick start drawer.
 *
 * Uses `forwardRef` so MUI Menu focus management can attach a ref to the
 * underlying `MenuItem`. Avoids `GlobalHeaderMenuItem` without a `to` prop,
 * which (in global-header 1.21.0) rendered `MenuItem component={Fragment}` and
 * dropped click handlers / menuitem role.
 */
export const QuickstartHelpMenuItem = forwardRef(
  function QuickstartHelpMenuItem(
    {
      handleClose,
    }: {
      handleClose?: () => void;
    },
    ref: Ref<HTMLLIElement>,
  ) {
    const { toggleDrawer } = useAppDrawer();

    const handleClick = () => {
      toggleDrawer(QUICKSTART_DRAWER_ID);
      handleClose?.();
    };

    return (
      <MenuItem
        ref={ref}
        disableRipple
        disableTouchRipple
        onClick={handleClick}
        sx={{ py: 0.5, color: 'inherit', textDecoration: 'none' }}
      >
        <MenuItemLink to="" title="Quick start" icon="waving_hand" />
      </MenuItem>
    );
  },
);
