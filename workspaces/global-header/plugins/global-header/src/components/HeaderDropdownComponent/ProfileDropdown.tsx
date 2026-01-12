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
import { parseEntityRef, UserEntity } from '@backstage/catalog-model';
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined';
import KeyboardArrowDownOutlinedIcon from '@mui/icons-material/KeyboardArrowDownOutlined';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';
import { lighten } from '@mui/material/styles';
import Box from '@mui/material/Box';

import { MenuItemConfig, MenuSection } from './MenuSection';
import { HeaderDropdownComponent } from './HeaderDropdownComponent';
import { useProfileDropdownMountPoints } from '../../hooks/useProfileDropdownMountPoints';
import { useDropdownManager } from '../../hooks';
import { useTranslation } from '../../hooks/useTranslation';
import { translateWithFallback } from '../../utils/translationUtils';

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
  const [profileLink, setProfileLink] = useState<string | null>();
  const { t } = useTranslation();
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
      let profileUrl: string | null = null;

      try {
        if (backstageIdentity?.userEntityRef) {
          const { namespace = 'default', name } = parseEntityRef(
            backstageIdentity.userEntityRef,
          );
          profileUrl = `/catalog/${namespace}/user/${name}`;

          userProfile = (await catalogApi.getEntityByRef(
            backstageIdentity.userEntityRef,
          )) as unknown as UserEntity;
          setUser(
            userProfile?.spec?.profile?.displayName ??
              userProfile?.metadata?.title,
          );
          setProfileLink(profileUrl);
        } else {
          setUser(null);
          setProfileLink(null);
        }
      } catch (err) {
        // User entity doesn't exist in catalog (e.g., guest user)
        setUser(null);
        setProfileLink(null);
      }
    };

    fetchUserEntity();
  }, [backstageIdentity, catalogApi]);

  const menuItems = useMemo(() => {
    // Check if user is a guest (guest user has userEntityRef like "user:development/guest" or "user:default/guest")
    const isGuestUser =
      backstageIdentity?.userEntityRef?.includes('/guest') ||
      profileLink === null;

    return (profileDropdownMountPoints ?? [])
      .map(mp => {
        const {
          title = '',
          titleKey = '',
          icon = '',
          link: staticLink = '',
          type = '',
        } = mp.config?.props ?? {};
        // The title fallbacks are to be backward compatibility with older versions
        // of the global-header configuration if a customer has customized it.
        const isMyProfile =
          type === 'myProfile' ||
          title === 'profile.myProfile' ||
          title === 'My profile';
        const link = isMyProfile ? profileLink ?? '' : staticLink;

        // Hide "My Profile" for guest users or when user doesn't exist in catalog
        if (isMyProfile && isGuestUser) {
          return null;
        }

        // Hide items without links (but allow "My Profile" to pass through for authenticated users)
        if (!link && title && !isMyProfile) {
          return null;
        }

        const translatedTitle = translateWithFallback(t, titleKey, title);

        return {
          Component: mp.Component,
          label: translatedTitle,
          link,
          priority: mp.config?.priority ?? 0,
          ...(icon && { icon }),
        };
      })
      .filter((item: MenuItemConfig) => item !== null)
      .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
  }, [profileDropdownMountPoints, profileLink, backstageIdentity, t]);

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
                  alt={t('profile.picture')}
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
