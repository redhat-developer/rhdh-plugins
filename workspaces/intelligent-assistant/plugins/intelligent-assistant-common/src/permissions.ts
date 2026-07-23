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

import { createPermission } from '@backstage/plugin-permission-common';

/** This permission is used to access the lightspeed read conversations endpoint
 * @public
 */
export const iaChatAccessPermission = createPermission({
  name: 'intelligent-assistant.chat.access',
  attributes: {},
});

/** This permission is used to access the lightspeed create conversations endpoint
 * @public
 */
export const iaChatUsePermission = createPermission({
  name: 'intelligent-assistant.chat.use',
  attributes: {},
});

/** This permission is used to access the lightspeed delete endpoint
 * @public
 */
export const iaChatManagePermission = createPermission({
  name: 'intelligent-assistant.chat.manage',
  attributes: {},
});

/** This permission is used to list configured MCP servers
 * @public
 */
export const lightspeedMcpReadPermission = createPermission({
  name: 'intelligent-assistant.mcp.read',
  attributes: {
    action: 'read',
  },
});

/** This permission is used to add, update, delete, and validate MCP servers
 * @public
 */
export const iaMcpManagePermission = createPermission({
  name: 'intelligent-assistant.mcp.manage',
  attributes: {
    action: 'update',
  },
});

/** This permission is used to access AI Notebooks features
 * @public
 */
export const iaNotebooksUsePermission = createPermission({
  name: 'intelligent-assistant.notebooks.use',
  attributes: {
    action: 'update',
  },
});

/**
 * List of all permissions on permission polices.
 *
 * @public
 */
export const iaPermissions = [
  iaChatAccessPermission,
  iaChatManagePermission,
  iaChatUsePermission,
  iaMcpReadPermission,
  iaMcpManagePermission,
  iaNotebooksUsePermission,
];
