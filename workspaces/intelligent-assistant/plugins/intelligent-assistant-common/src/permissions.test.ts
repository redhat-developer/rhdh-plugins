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

import {
  iaChatPermission,
  iaMcpToolsPermission,
  iaNotebooksPermission,
  iaPermissions,
  iaSkillsPermission,
} from './permissions';

describe('intelligent assistant permissions', () => {
  it('keeps stable permission names for RBAC policies', () => {
    expect(iaChatPermission.name).toBe('intelligent-assistant.chat');
    expect(iaNotebooksPermission.name).toBe('intelligent-assistant.notebooks');
    expect(iaMcpToolsPermission.name).toBe('intelligent-assistant.mcp.tools');
    expect(iaSkillsPermission.name).toBe('intelligent-assistant.skills');
    expect(iaPermissions).toEqual([
      iaChatPermission,
      iaNotebooksPermission,
      iaMcpToolsPermission,
      iaSkillsPermission,
    ]);
    for (const permission of iaPermissions) {
      expect(permission.attributes).toEqual({});
    }
  });
});
