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

type ProfileDropdownProps = {
  user: { firstName: string; lastName: string };
};

const ProfileDropdown: React.FC<ProfileDropdownProps> = ({ user }) => {
  const errorApi = useApi(errorApiRef);
  const identityApi = useApi(identityApiRef);
  const handleLogout = () => {
    identityApi.signOut().catch(error => errorApi.post(error));
  };
  const menuSections = [
    {
      items: [
        {
          key: 'settings',
          icon: ManageAccountsOutlinedIcon,
          label: 'Settings',
          link: '/settings',
        },
        {
          key: 'logout',
          icon: LogoutOutlinedIcon,
          label: 'Log out',
          onClick: handleLogout,
        },
      ],
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
            {`${user.firstName} ${user.lastName}`}
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
    />
  );
};

export default ProfileDropdown;
