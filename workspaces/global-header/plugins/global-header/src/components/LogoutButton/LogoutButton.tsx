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

import {
  errorApiRef,
  identityApiRef,
  useApi,
} from '@backstage/core-plugin-api';

import Box from '@mui/material/Box';

import { MenuItemLinkContent } from '../MenuItemLink/MenuItemLinkContent';

export const LogoutButton = () => {
  const errorApi = useApi(errorApiRef);
  const identityApi = useApi(identityApiRef);

  const handleLogout = () => {
    identityApi.signOut().catch(error => errorApi.post(error));
  };

  // TODO switch to Button
  return (
    <Box
      onClick={handleLogout}
      sx={{ cursor: 'pointer', width: '100%', color: 'inherit' }}
    >
      <MenuItemLinkContent icon="logout" label="Logout" />
    </Box>
  );
};
