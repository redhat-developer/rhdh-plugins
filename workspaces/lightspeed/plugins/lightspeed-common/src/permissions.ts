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
import { createPermission } from '@backstage/plugin-permission-common';

/** This permission is used to access the lightspeed read conversations endpoint
 * @public
 */
export const lightspeedConversationsReadPermission = createPermission({
  name: 'lightspeed.conversations.read',
  attributes: {
    action: 'read',
  },
});

/** This permission is used to access the lightspeed create conversations endpoint
 * @public
 */
export const lightspeedConversationsCreatePermission = createPermission({
  name: 'lightspeed.conversations.create',
  attributes: {
    action: 'create',
  },
});

/** This permission is used to access the lightspeed delete endpoint
 * @public
 */
export const lightspeedConversationsDeletePermission = createPermission({
  name: 'lightspeed.conversations.delete',
  attributes: {
    action: 'delete',
  },
});
/**
 * List of all permissions on permission polices.
 *
 * @public
 */
export const lightspeedPermissions = [
  lightspeedConversationsReadPermission,
  lightspeedConversationsCreatePermission,
  lightspeedConversationsDeletePermission,
];
