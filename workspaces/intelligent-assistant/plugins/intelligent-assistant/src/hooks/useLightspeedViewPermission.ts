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

import { usePermission } from '@backstage/plugin-permission-react';

import {
  iaChatAccessPermission,
  iaChatUsePermission,
} from '@red-hat-developer-hub/backstage-plugin-intelligent-assistant-common';

export const useLightspeedViewPermission = () => {
  const canReadChats = usePermission({
    permission: iaChatAccessPermission,
  });

  const canCreateChats = usePermission({
    permission: iaChatUsePermission,
  });

  return {
    loading: canReadChats.loading || canCreateChats.loading,
    allowed: canReadChats.allowed && canCreateChats.allowed,
    lightspeedConversationsAccessPermissionName: iaChatAccessPermission.name,
    lightspeedChatUsePermissionName: iaChatUsePermission.name,
  };
};
