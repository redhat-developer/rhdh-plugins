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

import { AuthenticationError } from '@backstage/errors';
import { getUserEntityRef } from './utils';

describe('Service Utils', () => {
  describe('getUserEntityRef', () => {
    it('should return userEntityRef from credentials', async () => {
      const ref = await getUserEntityRef({
        principal: { userEntityRef: 'user:default/alice' },
      } as any);

      expect(ref).toBe('user:default/alice');
    });

    it('should throw AuthenticationError when userEntityRef is missing', async () => {
      await expect(getUserEntityRef({ principal: {} } as any)).rejects.toThrow(
        AuthenticationError,
      );
      await expect(getUserEntityRef({ principal: {} } as any)).rejects.toThrow(
        'User entity reference not found',
      );
    });

    it('should throw AuthenticationError when principal is undefined', async () => {
      await expect(getUserEntityRef({} as any)).rejects.toThrow(
        AuthenticationError,
      );
    });
  });
});
