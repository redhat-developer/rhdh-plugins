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
  BasicPermission,
  PermissionCriteria,
  PermissionCondition,
  PermissionRuleParams,
  AuthorizeResult,
} from '@backstage/plugin-permission-common';
import { Request } from 'express';
import { AuthenticationError, NotAllowedError } from '@backstage/errors';
import { catalogEntityReadPermission } from '@backstage/plugin-catalog-common/alpha';
import type {
  HttpAuthService,
  PermissionsService,
} from '@backstage/backend-plugin-api';
import {
  Metric,
  scorecardMetricReadPermission,
} from '@red-hat-developer-hub/backstage-plugin-scorecard-common';
import {
  authorizeConditional,
  filterAuthorizedMetrics,
  matches,
  checkEntityAccess,
  getUserEntityRef,
} from './permissionUtils';
import { mockServices } from '@backstage/backend-test-utils';

const createMockMetric = (
  id: string,
  title: string = `${id} metric`,
): Metric => ({
  id,
  title,
  description: `Description for ${title}`,
  type: 'number',
  history: false,
});

describe('permissionUtils', () => {
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

  const mockMetricIdPermissionCondition = {
    rule: 'HAS_METRIC_ID',
    resourceType: 'scorecard-metric',
    params: { metricIds: ['github.open_prs'] },
  };

  describe('matches', () => {
    const anyOfFilter: PermissionCriteria<
      PermissionCondition<string, PermissionRuleParams>
    > = {
      anyOf: [mockMetricIdPermissionCondition],
    };

    const allOfFilter: PermissionCriteria<
      PermissionCondition<string, PermissionRuleParams>
    > = {
      allOf: [mockMetricIdPermissionCondition],
    };

    const notFilter: PermissionCriteria<
      PermissionCondition<string, PermissionRuleParams>
    > = {
      not: mockMetricIdPermissionCondition,
    };

    const matchedMetric = createMockMetric(
      'github.open_prs',
      'GitHub Open PRs',
    );
    const nonMatchedMetric = createMockMetric(
      'jira.open_issues',
      'Jira Open Issues',
    );

    it('should return true when a filter is not supplied', () => {
      expect(matches(matchedMetric)).toBeTruthy();
    });

    it('should return true with anyOf filter where metricId matches filter metricId', () => {
      expect(matches(matchedMetric, anyOfFilter)).toBeTruthy();
    });

    it('shoule return false with anyOf filter where metricId does not match filter metricId', () => {
      expect(matches(nonMatchedMetric, anyOfFilter)).toBeFalsy();
    });

    it('should return true with allOf filter where metricId matches filter metricId', () => {
      expect(matches(matchedMetric, allOfFilter)).toBeTruthy();
    });

    it('shoule return false with allOf filter where metricId does not match filter metricId', () => {
      expect(matches(nonMatchedMetric, allOfFilter)).toBeFalsy();
    });

    it('should return false with not filter where metricId matches filter metricId', () => {
      expect(matches(matchedMetric, notFilter)).toBeFalsy();
    });

    it('should return true with not filter where metricId does not match filter metricId', () => {
      expect(matches(nonMatchedMetric, notFilter)).toBeTruthy();
    });
  });

  describe('filterAuthorizedMetrics', () => {
    const metrics = [
      createMockMetric('github.open_prs', 'GitHub Open PRs'),
      createMockMetric('jira.open_issues', 'Jira Open Issues'),
    ];

    it('should return all metrics when no filter is provided', () => {
      const result = filterAuthorizedMetrics(metrics);
      expect(result).toEqual(metrics);
      expect(result).toHaveLength(2);
    });

    it('should filter metrics based on filter criteria', () => {
      const result = filterAuthorizedMetrics(metrics, {
        anyOf: [mockMetricIdPermissionCondition],
      });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('github.open_prs');
    });
  });

  describe('checkEntityAccess', () => {
    let mockPermissionsService: jest.Mocked<PermissionsService>;
    let mockHttpAuthService: jest.Mocked<HttpAuthService>;
    let mockRequest: Request;

    beforeEach(() => {
      mockPermissionsService = mockServices.permissions.mock({
        authorize: jest.fn(),
      });

      mockHttpAuthService = mockServices.httpAuth.mock({
        credentials: jest.fn(),
      });

      mockRequest = {} as Request;
    });

    it('should succeed when user has catalog entity read permission', async () => {
      mockHttpAuthService.credentials.mockResolvedValue(undefined as any);
      mockPermissionsService.authorize.mockResolvedValue([
        { result: AuthorizeResult.ALLOW },
      ]);

      await expect(
        checkEntityAccess(
          'component:default/my-service',
          mockRequest,
          mockPermissionsService,
          mockHttpAuthService,
        ),
      ).resolves.toBeUndefined();

      expect(mockPermissionsService.authorize).toHaveBeenCalledWith(
        [
          {
            permission: catalogEntityReadPermission,
            resourceRef: 'component:default/my-service',
          },
        ],
        { credentials: undefined },
      );
    });

    it('should throw NotAllowedError when user does not have catalog entity read permission', async () => {
      mockHttpAuthService.credentials.mockResolvedValue(undefined as any);
      mockPermissionsService.authorize.mockResolvedValue([
        { result: AuthorizeResult.DENY },
      ]);

      await expect(
        checkEntityAccess(
          'component:default/my-service',
          mockRequest,
          mockPermissionsService,
          mockHttpAuthService,
        ),
      ).rejects.toThrow(
        new NotAllowedError(
          'Access to "component:default/my-service" entity metrics denied',
        ),
      );

      expect(mockPermissionsService.authorize).toHaveBeenCalledWith(
        [
          {
            permission: catalogEntityReadPermission,
            resourceRef: 'component:default/my-service',
          },
        ],
        { credentials: undefined },
      );
    });

    it('should format entity reference correctly for different entity types', async () => {
      mockHttpAuthService.credentials.mockResolvedValue(undefined as any);
      mockPermissionsService.authorize.mockResolvedValue([
        { result: AuthorizeResult.ALLOW },
      ]);

      await checkEntityAccess(
        'api:production/payment-service',
        mockRequest,
        mockPermissionsService,
        mockHttpAuthService,
      );

      expect(mockPermissionsService.authorize).toHaveBeenCalledWith(
        [
          {
            permission: catalogEntityReadPermission,
            resourceRef: 'api:production/payment-service',
          },
        ],
        { credentials: undefined },
      );
    });
  });
});
