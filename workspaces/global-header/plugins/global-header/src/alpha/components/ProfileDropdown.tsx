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

import { useEffect, useState } from 'react';

import { useUserProfile } from '@backstage/plugin-user-settings';
import { useApi } from '@backstage/core-plugin-api';
import { catalogApiRef } from '@backstage/plugin-catalog-react';
import type { UserEntity } from '@backstage/catalog-model';

import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined';
import KeyboardArrowDownOutlinedIcon from '@mui/icons-material/KeyboardArrowDownOutlined';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import { useTheme } from '@mui/material/styles';

import { useTranslation } from '../../hooks/useTranslation';
import { GlobalHeaderDropdown } from './GlobalHeaderDropdown';

/**
 * Trigger button content that displays the user's avatar and display name.
 */
const ProfileButtonContent = () => {
  const [user, setUser] = useState<string | null>();
  const { t } = useTranslation();
  const {
    displayName,
    backstageIdentity,
    profile,
    loading: profileLoading,
  } = useUserProfile();
  const catalogApi = useApi(catalogApiRef);
  const theme = useTheme();

  useEffect(() => {
    const fetchUserEntity = async () => {
      try {
        if (backstageIdentity?.userEntityRef) {
          const userProfile = (await catalogApi.getEntityByRef(
            backstageIdentity.userEntityRef,
          )) as unknown as UserEntity;
          setUser(
            userProfile?.spec?.profile?.displayName ??
              userProfile?.metadata?.title,
          );
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      }
    };
    fetchUserEntity();
  }, [backstageIdentity, catalogApi]);

  const profileDisplayName = () => {
    const name = user ?? displayName;
    // Entity ref format (e.g. "user:default/jdoe") -- extract and capitalize the name after the slash
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
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
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
        sx={{ bgcolor: theme.palette.action.hover, borderRadius: '25%' }}
      />
    </Box>
  );
};

/**
 * Profile dropdown. Collects menu items from the `'profile'` target
 * via GlobalHeaderContext.
 *
 * @internal
 */
export const ProfileDropdown = () => (
  <GlobalHeaderDropdown
    target="profile"
    buttonContent={<ProfileButtonContent />}
    buttonProps={{
      color: 'inherit',
      sx: { display: 'flex', alignItems: 'center' },
    }}
  />
);
