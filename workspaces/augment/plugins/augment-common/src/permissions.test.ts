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
  augmentAccessPermission,
  augmentAdminPermission,
  augmentPermissions,
} from './permissions';

describe('permissions', () => {
  describe('augmentAccessPermission', () => {
    it('has the correct name', () => {
      expect(augmentAccessPermission.name).toBe('augment.access');
    });

    it('has read action attribute', () => {
      expect(augmentAccessPermission.attributes).toEqual({
        action: 'read',
      });
    });
  });

  describe('augmentAdminPermission', () => {
    it('has the correct name', () => {
      expect(augmentAdminPermission.name).toBe('augment.admin');
    });

    it('has update action attribute', () => {
      expect(augmentAdminPermission.attributes).toEqual({
        action: 'update',
      });
    });
  });

  describe('augmentPermissions', () => {
    it('exports both permissions in the array', () => {
      expect(augmentPermissions).toHaveLength(2);
      expect(augmentPermissions).toContain(augmentAccessPermission);
      expect(augmentPermissions).toContain(augmentAdminPermission);
    });
  });
});
