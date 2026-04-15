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
import { parseEntityRef } from '@backstage/catalog-model';
import { Link } from '@backstage/core-components';

import MenuItem from '@mui/material/MenuItem';

import { MenuItemLinkContent } from '../../components/MenuItemLink/MenuItemLinkContent';
import { useTranslation } from '../../hooks/useTranslation';

/**
 * Custom component for the "My Profile" menu item.
 * Dynamically resolves the catalog URL from the user's identity and
 * returns `null` for guest users, matching legacy ProfileDropdown behavior.
 *
 * @internal
 */
export const MyProfileMenuItem = ({
  handleClose,
}: {
  handleClose?: () => void;
}) => {
  const { backstageIdentity } = useUserProfile();
  const { t } = useTranslation();
  const [profileLink, setProfileLink] = useState<string | null>(null);
  const [isGuest, setIsGuest] = useState(true);

  useEffect(() => {
    if (!backstageIdentity?.userEntityRef) {
      setIsGuest(true);
      return;
    }
    if (backstageIdentity.userEntityRef.includes('/guest')) {
      setIsGuest(true);
      return;
    }
    try {
      const { namespace = 'default', name } = parseEntityRef(
        backstageIdentity.userEntityRef,
      );
      setProfileLink(`/catalog/${namespace}/user/${name}`);
      setIsGuest(false);
    } catch {
      setIsGuest(true);
    }
  }, [backstageIdentity]);

  if (isGuest || !profileLink) return null;

  return (
    <MenuItem
      component={Link}
      to={profileLink}
      onClick={handleClose}
      disableRipple
      disableTouchRipple
      sx={{ py: 0.5, color: 'inherit', textDecoration: 'none' }}
    >
      <MenuItemLinkContent
        icon="account_circle"
        label={t('profile.myProfile')}
      />
    </MenuItem>
  );
};
