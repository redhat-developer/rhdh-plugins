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

import React, { useEffect, useMemo, useState } from 'react';
import HeaderDropdownComponent from './HeaderDropdownComponent';
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined';
import KeyboardArrowDownOutlinedIcon from '@mui/icons-material/KeyboardArrowDownOutlined';
import Typography from '@mui/material/Typography';
import {
  identityApiRef,
  useApi,
  ProfileInfo,
} from '@backstage/core-plugin-api';
import { useProfileDropdownMountPoints } from '../../hooks/useProfileDropdownMountPoints';
import { ComponentType } from '../../types';
import MenuSection from './MenuSection';

/**
 * @public
 * ProfileDropdown component properties
 */
export interface ProfileDropdownProps {
  handleMenu: (event: React.MouseEvent<HTMLElement>) => void;
  anchorEl: HTMLElement | null;
  setAnchorEl: React.Dispatch<React.SetStateAction<HTMLElement | null>>;
}

export const ProfileDropdown = ({
  handleMenu,
  anchorEl,
  setAnchorEl,
}: ProfileDropdownProps) => {
  const identityApi = useApi(identityApiRef);
  const [user, setUser] = useState<ProfileInfo>();
  const profileDropdownMountPoints = useProfileDropdownMountPoints();

  useEffect(() => {
    const fetchUser = async () => {
      const userProfile = await identityApi.getProfileInfo();
      setUser(userProfile);
    };

    fetchUser();
  }, [identityApi]);

  const menuItems = useMemo(() => {
    return (profileDropdownMountPoints ?? [])
      .map(mp => ({
        Component: mp.Component,
        type: mp.config?.type ?? ComponentType.LINK,
        icon: mp.config?.props?.icon ?? '',
        label: mp.config?.props?.title ?? '',
        link: mp.config?.props?.link ?? '',
        priority: mp.config?.priority ?? 0,
      }))
      .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
  }, [profileDropdownMountPoints]);

  return (
    <HeaderDropdownComponent
      buttonContent={
        <>
          <AccountCircleOutlinedIcon fontSize="small" sx={{ mx: 1 }} />
          <Typography variant="body2" sx={{ fontWeight: 500, mx: 1 }}>
            {user?.displayName ?? 'Guest'}
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
      buttonProps={{
        color: 'inherit',
        sx: {
          display: 'flex',
          alignItems: 'center',
        },
      }}
      buttonClick={handleMenu}
      anchorEl={anchorEl}
      setAnchorEl={setAnchorEl}
    >
      <MenuSection
        hideDivider
        items={menuItems}
        handleClose={() => setAnchorEl(null)}
      />
    </HeaderDropdownComponent>
  );
};

export default ProfileDropdown;
