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

import { useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { useUserProfile } from '@backstage/plugin-user-settings';
import { useApi } from '@backstage/core-plugin-api';
import { catalogApiRef } from '@backstage/plugin-catalog-react';
import { UserEntity } from '@backstage/catalog-model';
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined';
import KeyboardArrowDownOutlinedIcon from '@mui/icons-material/KeyboardArrowDownOutlined';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';
import { lighten } from '@mui/material/styles';
import Box from '@mui/material/Box';

import { MenuSection } from './MenuSection';
import { HeaderDropdownComponent } from './HeaderDropdownComponent';
import { useProfileDropdownMountPoints } from '../../hooks/useProfileDropdownMountPoints';
import { useDropdownManager } from '../../hooks';

/**
 * @public
 * Props for Profile Dropdown
 */
export interface ProfileDropdownProps {
  layout?: CSSProperties;
}

export const ProfileDropdown = ({ layout }: ProfileDropdownProps) => {
  const { anchorEl, handleOpen, handleClose } = useDropdownManager();
  const [user, setUser] = useState<string | null>();
  const {
    displayName,
    backstageIdentity,
    profile,
    loading: profileLoading,
  } = useUserProfile();
  const catalogApi = useApi(catalogApiRef);

  const profileDropdownMountPoints = useProfileDropdownMountPoints();

  const headerRef = useRef<HTMLElement | null>(null);
  const [bgColor, setBgColor] = useState('#3C3F42');

  useEffect(() => {
    if (headerRef.current) {
      const computedStyle = window.getComputedStyle(headerRef.current);
      const baseColor = computedStyle.backgroundColor;
      setBgColor(lighten(baseColor, 0.2));
    }
  }, []);

  useEffect(() => {
    const container = document.getElementById('global-header');
    if (container) {
      const computedStyle = window.getComputedStyle(container);
      const baseColor = computedStyle.backgroundColor;
      setBgColor(lighten(baseColor, 0.2));
    }
  }, []);

  useEffect(() => {
    const fetchUserEntity = async () => {
      let userProfile;
      try {
        if (backstageIdentity?.userEntityRef) {
          userProfile = (await catalogApi.getEntityByRef(
            backstageIdentity.userEntityRef,
          )) as unknown as UserEntity;
        }
        setUser(
          userProfile?.spec?.profile?.displayName ??
            userProfile?.metadata?.title,
        );
      } catch (_err) {
        setUser(null);
      }
    };

    fetchUserEntity();
  }, [backstageIdentity, catalogApi]);

  const menuItems = useMemo(() => {
    return (profileDropdownMountPoints ?? [])
      .map(mp => ({
        Component: mp.Component,
        icon: mp.config?.props?.icon ?? '',
        label: mp.config?.props?.title ?? '',
        link: mp.config?.props?.link ?? '',
        priority: mp.config?.priority ?? 0,
      }))
      .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
  }, [profileDropdownMountPoints]);

  if (menuItems.length === 0) {
    return null;
  }

  const profileDisplayName = () => {
    const name = user ?? displayName;
    const regex = /^[^:/]+:[^/]+\/[^/]+$/;
    if (regex.test(name)) {
      return name
        .charAt(name.indexOf('/') + 1)
        .toLocaleUpperCase('en-US')
        .concat(name.substring(name.indexOf('/') + 2));
    }
    return name;
  };

  return (
    <HeaderDropdownComponent
      buttonContent={
        <Box sx={{ display: 'flex', alignItems: 'center', ...layout }}>
          {!profileLoading && (
            <>
              {profile.picture ? (
                <Avatar
                  src={profile.picture}
                  sx={{ mr: 2, height: '32px', width: '32px' }}
                  alt="Profile picture"
                />
              ) : (
                <AccountCircleOutlinedIcon fontSize="small" sx={{ mr: 1 }} />
              )}
              <Typography
                variant="body2"
                sx={{
                  display: { xs: 'none', md: 'block' },
                  fontWeight: 500,
                  mr: '1rem',
                }}
              >
                {profileDisplayName()}
              </Typography>
            </>
          )}
          <KeyboardArrowDownOutlinedIcon
            sx={{
              bgcolor: bgColor,
              borderRadius: '25%',
            }}
          />
        </Box>
      }
      buttonProps={{
        color: 'inherit',
        sx: {
          display: 'flex',
          alignItems: 'center',
        },
      }}
      onOpen={handleOpen}
      onClose={handleClose}
      anchorEl={anchorEl}
    >
      <MenuSection hideDivider items={menuItems} handleClose={handleClose} />
    </HeaderDropdownComponent>
  );
};
