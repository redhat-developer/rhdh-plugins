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
import HeaderDropdownComponent from './HeaderDropdownComponent';
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined';
import ManageAccountsOutlinedIcon from '@mui/icons-material/ManageAccountsOutlined';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import KeyboardArrowDownOutlinedIcon from '@mui/icons-material/KeyboardArrowDownOutlined';
import Typography from '@mui/material/Typography';
import SmallIconWrapper from '../HeaderIconButton/SmallIconWrapper';
import {
  identityApiRef,
  errorApiRef,
  useApi,
} from '@backstage/core-plugin-api';

interface ProfileDropdownProps {
  handleMenu: (event: React.MouseEvent<HTMLElement>) => void;
  anchorEl: HTMLElement | null;
  setAnchorEl: React.Dispatch<React.SetStateAction<HTMLElement | null>>;
}

const ProfileDropdown: React.FC<ProfileDropdownProps> = ({
  handleMenu,
  anchorEl,
  setAnchorEl,
}) => {
  const errorApi = useApi(errorApiRef);
  const identityApi = useApi(identityApiRef);
  const user = 'Guest User';

  const handleLogout = () => {
    identityApi.signOut().catch(error => errorApi.post(error));
  };
  const menuSections = [
    {
      sectionKey: 'profile',
      items: [
        {
          itemKey: 'settings',
          icon: ManageAccountsOutlinedIcon,
          label: 'Settings',
          link: '/settings',
        },
        {
          itemKey: 'logout',
          icon: LogoutOutlinedIcon,
          label: 'Log out',
          onClick: handleLogout,
        },
      ],
      handleClose: () => setAnchorEl(null),
    },
  ];
  return (
    <HeaderDropdownComponent
      buttonContent={
        <>
          <SmallIconWrapper
            IconComponent={AccountCircleOutlinedIcon}
            sx={{ mx: 1 }}
          />
          <Typography variant="body2" sx={{ fontWeight: 500, mx: 1 }}>
            {user ?? 'Guest User'}
          </Typography>
          <KeyboardArrowDownOutlinedIcon
            sx={{
              marginLeft: '1rem',
              bgcolor: '#383838',
              borderRadius: '25%',
            }}
          />
        </>
      }
      menuSections={menuSections}
      buttonProps={{
        color: 'inherit',
        sx: {
          display: 'flex',
          alignItems: 'center',
          ml: 1,
        },
      }}
      buttonClick={handleMenu}
      anchorEl={anchorEl}
      setAnchorEl={setAnchorEl}
    />
  );
};

export default ProfileDropdown;
