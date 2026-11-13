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

import { Link } from '@backstage/core-components';
import MenuItem from '@mui/material/MenuItem';

import { MenuItemLinkContent } from './MenuItemLink/MenuItemLinkContent';
import { useTranslation } from '../hooks/useTranslation';
import { useIsSettingsAvailable } from '../hooks/useIsSettingsAvailable';

/**
 * Custom component for the "Settings" menu item in the profile dropdown.
 * Renders null when the user-settings plugin is disabled.
 *
 * @internal
 */
export const SettingsMenuItem = ({
  handleClose,
}: {
  handleClose?: () => void;
}) => {
  const isAvailable = useIsSettingsAvailable();
  const { t } = useTranslation();

  if (!isAvailable) {
    return null;
  }

  return (
    <MenuItem
      component={Link}
      to="/settings"
      onClick={handleClose}
      disableRipple
      disableTouchRipple
      sx={{
        py: 0.5,
        px: 0,
        width: '100%',
        boxSizing: 'border-box',
        display: 'flex',
        color: 'inherit',
        textDecoration: 'none',
      }}
    >
      <MenuItemLinkContent
        icon="manageAccounts"
        label={t('profile.settings')}
      />
    </MenuItem>
  );
};
