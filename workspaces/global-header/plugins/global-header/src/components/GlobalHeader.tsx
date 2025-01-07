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

import React from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import { SearchComponent } from './SearchComponent/SearchComponent';
import { HeaderIconButton } from './HeaderIconButton/HeaderIconButton';
import CreateDropdown from './HeaderDropdownComponent/CreateDropdown';
import ProfileDropdown from './HeaderDropdownComponent/ProfileDropdown';
import Divider from '@mui/material/Divider';
import HelpOutlineOutlinedIcon from '@mui/icons-material/HelpOutlineRounded';
import NotificationsOutlinedIcon from '@mui/icons-material/NotificationsOutlined';
import { useDropdownManager } from '../hooks';

const iconButtons = [
  {
    key: 'help',
    Icon: HelpOutlineOutlinedIcon,
    onClick: () => {},
  },
  {
    key: 'notification',
    Icon: NotificationsOutlinedIcon,
    onClick: () => {},
  },
];

export const GlobalHeader = () => {
  const { menuStates, handleOpen, handleClose } = useDropdownManager();
  const dropdownConfigs = [
    {
      key: 'create',
      component: CreateDropdown,
      buttonProps: {
        handleMenu: handleOpen('create'),
        anchorEl: menuStates.create,
        setAnchorEl: handleClose('create'),
      },
    },
    {
      key: 'profile',
      component: ProfileDropdown,
      buttonProps: {
        handleMenu: handleOpen('profile'),
        anchorEl: menuStates.profile,
        setAnchorEl: handleClose('profile'),
      },
    },
  ];

  return (
    <AppBar
      position="sticky"
      component="nav"
      sx={{ backgroundColor: '#212427' }}
    >
      <Toolbar>
        <SearchComponent />
        <CreateDropdown
          key={dropdownConfigs[0].key}
          {...dropdownConfigs[0].buttonProps}
        />
        {iconButtons.map(({ key, Icon, onClick }) => (
          <HeaderIconButton
            key={`header-icon-button-${key}`}
            Icon={Icon}
            onClick={onClick}
          />
        ))}
        <Divider
          orientation="vertical"
          flexItem
          sx={{ borderColor: '#373A40' }}
        />
        <ProfileDropdown
          key={dropdownConfigs[1].key}
          {...dropdownConfigs[1].buttonProps}
        />
      </Toolbar>
    </AppBar>
  );
};
