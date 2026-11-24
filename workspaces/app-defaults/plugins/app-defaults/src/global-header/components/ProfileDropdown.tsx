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

import { useTranslation } from '../hooks/useTranslation';
import { GlobalHeaderDropdown } from './GlobalHeaderDropdown';

/**
 * Normalize entity-ref display names (e.g. `user:default/jdoe` → `Jdoe`).
 */
function formatProfileDisplayName(name: string): string {
  const regex = /^[^:/]+:[^/]+\/[^/]+$/;
  if (regex.test(name)) {
    return name
      .charAt(name.indexOf('/') + 1)
      .toLocaleUpperCase('en-US')
      .concat(name.substring(name.indexOf('/') + 2));
  }
  return name;
}

/**
 * Trigger button content that displays the user's avatar and display name.
 */
const ProfileButtonContent = ({
  displayName,
  picture,
  pictureAlt,
  loading,
}: {
  displayName?: string;
  picture?: string;
  pictureAlt: string;
  loading: boolean;
}) => {
  const theme = useTheme();

  return (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      {!loading && (
        <>
          {picture ? (
            <Avatar
              src={picture}
              sx={{ mr: 2, height: '32px', width: '32px' }}
              alt={pictureAlt}
            />
          ) : (
            <AccountCircleOutlinedIcon fontSize="small" sx={{ mr: 1 }} />
          )}
          {displayName ? (
            <Typography
              variant="body2"
              sx={{
                display: { xs: 'none', md: 'block' },
                fontWeight: 500,
                mr: '1rem',
              }}
            >
              {displayName}
            </Typography>
          ) : null}
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
 * Accessible name is `{displayName}, {Settings}` so visible text stays part
 * of the name (WCAG 2.5.3) while e2e can still match "Settings".
 *
 * @internal
 */
export const ProfileDropdown = () => {
  const [catalogDisplayName, setCatalogDisplayName] = useState<
    string | null | undefined
  >();
  const { t } = useTranslation();
  const {
    displayName,
    backstageIdentity,
    profile,
    loading: profileLoading,
  } = useUserProfile();
  const catalogApi = useApi(catalogApiRef);

  useEffect(() => {
    const fetchUserEntity = async () => {
      try {
        if (backstageIdentity?.userEntityRef) {
          const userProfile = (await catalogApi.getEntityByRef(
            backstageIdentity.userEntityRef,
          )) as unknown as UserEntity;
          setCatalogDisplayName(
            userProfile?.spec?.profile?.displayName ??
              userProfile?.metadata?.title,
          );
        } else {
          setCatalogDisplayName(null);
        }
      } catch {
        setCatalogDisplayName(null);
      }
    };
    fetchUserEntity();
  }, [backstageIdentity, catalogApi]);

  const resolvedName = catalogDisplayName ?? displayName;
  const profileDisplayName = resolvedName
    ? formatProfileDisplayName(resolvedName)
    : undefined;
  const settingsLabel = t('profile.settings');
  // Include visible display name in the accessible name (WCAG 2.5.3).
  const ariaLabel = profileDisplayName
    ? `${profileDisplayName}, ${settingsLabel}`
    : settingsLabel;

  return (
    <GlobalHeaderDropdown
      target="profile"
      buttonContent={
        <ProfileButtonContent
          displayName={profileDisplayName}
          picture={profile.picture}
          pictureAlt={t('profile.picture')}
          loading={profileLoading}
        />
      }
      tooltip={settingsLabel}
      buttonProps={{
        color: 'inherit',
        sx: { display: 'flex', alignItems: 'center' },
        'aria-label': ariaLabel,
      }}
    />
  );
};
