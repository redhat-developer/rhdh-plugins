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

import { mockServices } from '@backstage/backend-test-utils';
import { AuthenticationError, NotAllowedError } from '@backstage/errors';
import {
  AuthorizeResult,
  BasicPermission,
} from '@backstage/plugin-permission-common';
import { scorecardMetricReadPermission } from '@red-hat-developer-hub/backstage-plugin-scorecard-common';
import { authorizeConditional, getUserEntityRef } from './utils';

describe('Service Utils', () => {
  describe('authorizeConditional', () => {
    const credentials = { principal: {} } as any;

    it('should throw NotAllowedError when resource permission is DENY', async () => {
      const permissions = mockServices.permissions.mock({
        authorizeConditional: jest
          .fn()
          .mockResolvedValue([{ result: AuthorizeResult.DENY }]),
      });

      await expect(
        authorizeConditional(
          credentials,
          permissions,
          scorecardMetricReadPermission,
        ),
      ).rejects.toThrow(NotAllowedError);
    });

    it('should return undefined conditions when resource permission is ALLOW', async () => {
      const permissions = mockServices.permissions.mock({
        authorizeConditional: jest
          .fn()
          .mockResolvedValue([{ result: AuthorizeResult.ALLOW }]),
      });

      const result = await authorizeConditional(
        credentials,
        permissions,
        scorecardMetricReadPermission,
      );

      expect(result.conditions).toBeUndefined();
    });

    it('should return conditions when resource permission is CONDITIONAL', async () => {
      const conditions = {
        anyOf: [
          {
            rule: 'HAS_METRIC_ID',
            resourceType: 'scorecard-metric',
            params: { metricIds: ['github.open_prs'] },
          },
        ],
      };
      const permissions = mockServices.permissions.mock({
        authorizeConditional: jest.fn().mockResolvedValue([
          {
            result: AuthorizeResult.CONDITIONAL,
            conditions,
          },
        ]),
      });

      const result = await authorizeConditional(
        credentials,
        permissions,
        scorecardMetricReadPermission,
      );

      expect(result.conditions).toEqual(conditions);
    });

    it('should call authorize (not authorizeConditional) for basic permission', async () => {
      const authorize = jest
        .fn()
        .mockResolvedValue([{ result: AuthorizeResult.ALLOW }]);
      const authorizeConditionalFn = jest.fn();
      const permissions = mockServices.permissions.mock({
        authorize,
        authorizeConditional: authorizeConditionalFn,
      });

      const basicPermission = {
        type: 'basic',
        name: 'catalog.entity.read',
        attributes: {},
      } as BasicPermission;

      await authorizeConditional(credentials, permissions, basicPermission);

      expect(authorize).toHaveBeenCalledWith(
        [{ permission: basicPermission }],
        { credentials },
      );
      expect(authorizeConditionalFn).not.toHaveBeenCalled();
    });

    it('should throw NotAllowedError when basic permission is DENY', async () => {
      const permissions = mockServices.permissions.mock({
        authorize: jest
          .fn()
          .mockResolvedValue([{ result: AuthorizeResult.DENY }]),
      });

      const basicPermission = {
        type: 'basic',
        name: 'catalog.entity.read',
        attributes: {},
      } as BasicPermission;

      await expect(
        authorizeConditional(credentials, permissions, basicPermission),
      ).rejects.toThrow(NotAllowedError);
    });
  });

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
