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

/** This permission is used to access intelligent-assistant chats
 * @public
 */
export const iaChatAccessPermission = createPermission({
  name: 'intelligent-assistant.chat.access',
  attributes: {},
});

/** This permission is used to create intelligent-assistant chats
 * @public
 */
export const iaChatUsePermission = createPermission({
  name: 'intelligent-assistant.chat.use',
  attributes: {},
});

/** This permission is used to update and delete intelligent-assistant chats
 * @public
 */
export const iaChatManagePermission = createPermission({
  name: 'intelligent-assistant.chat.manage',
  attributes: {},
});

/** This permission is used to use MCP tooling
 * @public
 */
export const iaMcpUsePermission = createPermission({
  name: 'mcp.tools.use',
  attributes: {},
});

/** This permission is used to manage MCP tooling
 * @public
 */
export const iaMcpManagePermission = createPermission({
  name: 'mcp.tools.manage',
  attributes: {},
});

/** This permission is used to access, create, and query intelligent-assistant notebooks
 * @public
 */
export const iaNotebooksUsePermission = createPermission({
  name: 'intelligent-assistant.notebooks.use',
  attributes: {},
});

/** This permission is used to update and delete intelligent-assistant notebooks
 * @public
 */
export const iaNotebooksManagePermission = createPermission({
  name: 'intelligent-assistant.notebooks.manage',
  attributes: {},
});

/** This permission is used to view the list of configured skills
 * @public
 */
export const iaSkillsAccessPermission = createPermission({
  name: 'intelligent-assistant.skills.access',
  attributes: {},
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
  iaMcpUsePermission,
  iaMcpManagePermission,
  iaNotebooksManagePermission,
  iaNotebooksUsePermission,
  iaSkillsAccessPermission,
];
