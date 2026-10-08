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

/** Full permissions to use the intelligent-assistant chat feature
 * @public
 */
export const iaChatPermission = createPermission({
  name: 'intelligent-assistant.chat',
  attributes: {},
});

/** Full permissions to use the intelligent-assistant notebooks feature
 * @public
 */
export const iaNotebooksPermission = createPermission({
  name: 'intelligent-assistant.notebooks',
  attributes: {},
});

/** Full permissions to use the intelligent-assistant MCP actions tooling
 * @public
 */
export const iaMcpToolsPermission = createPermission({
  name: 'intelligent-assistant.mcp.tools',
  attributes: {},
});

/** Full permissions to use the intelligent-assistant skills feature
 * @public
 */
export const iaSkillsPermission = createPermission({
  name: 'intelligent-assistant.skills',
  attributes: {},
});

/**
 * List of all permissions on permission polices.
 *
 * @public
 */
export const iaPermissions = [
  iaChatPermission,
  iaNotebooksPermission,
  iaMcpToolsPermission,
  iaSkillsPermission,
];
