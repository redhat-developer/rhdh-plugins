/*
 * Copyright 2024 The Backstage Authors
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

export const GlobalHeader = () => {
  const iconButtons = [
    {
      Icon: HelpOutlineOutlinedIcon,
      onClick: () => {},
    },
    {
      Icon: NotificationsOutlinedIcon,
      onClick: () => {},
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
        <CreateDropdown />
        {iconButtons.map(({ Icon, onClick }) => (
          <HeaderIconButton
            key={`header-icon-button-${Icon.toString}`}
            Icon={Icon}
            onClick={onClick}
          />
        ))}
        <Divider
          orientation="vertical"
          flexItem
          sx={{ borderColor: '#373A40' }}
        />
        <ProfileDropdown />
      </Toolbar>
    </AppBar>
  );
};
