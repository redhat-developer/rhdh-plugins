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
  PermissionCriteria,
  PermissionCondition,
  PermissionRuleParams,
  AuthorizeResult,
} from '@backstage/plugin-permission-common';
import { Request } from 'express';
import { NotAllowedError } from '@backstage/errors';
import { catalogEntityReadPermission } from '@backstage/plugin-catalog-common/alpha';
import type {
  BackstageCredentials,
  HttpAuthService,
  PermissionsService,
} from '@backstage/backend-plugin-api';
import { Metric } from '@red-hat-developer-hub/backstage-plugin-scorecard-common';
import {
  filterAuthorizedMetrics,
  matches,
  checkEntityAccess,
  getAuthorizedEntityRefs,
} from './permissionUtils';
import { mockServices } from '@backstage/backend-test-utils';
import { catalogServiceMock } from '@backstage/plugin-catalog-node/testUtils';

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

  describe('getAuthorizedEntityRefs', () => {
    let mockedCatalog: ReturnType<typeof catalogServiceMock.mock>;
    let mockCredentials: BackstageCredentials;

    beforeEach(() => {
      mockedCatalog = catalogServiceMock.mock();
      mockCredentials = {} as BackstageCredentials;

      mockedCatalog.queryEntities.mockResolvedValue({
        items: [
          {
            apiVersion: 'backstage.io/v1alpha1',
            kind: 'Component',
            metadata: { name: 'my-service', namespace: 'default' },
          },
        ],
        pageInfo: { nextCursor: undefined },
        totalItems: 1,
      });
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should return entity refs for entities the user is authorized to see', async () => {
      const result = await getAuthorizedEntityRefs({
        catalog: mockedCatalog,
        credentials: mockCredentials,
      });

      expect(result).toEqual(['component:default/my-service']);
    });

    it('should call queryEntities with user credentials', async () => {
      await getAuthorizedEntityRefs({
        catalog: mockedCatalog,
        credentials: mockCredentials,
      });

      expect(mockedCatalog.queryEntities).toHaveBeenCalledWith(
        expect.any(Object),
        { credentials: mockCredentials },
      );
    });

    it('should call queryEntities with correct fields and batch size limit', async () => {
      await getAuthorizedEntityRefs({
        catalog: mockedCatalog,
        credentials: mockCredentials,
      });

      expect(mockedCatalog.queryEntities).toHaveBeenCalledWith(
        {
          fields: ['kind', 'metadata.name', 'metadata.namespace'],
          limit: 50,
        },
        { credentials: mockCredentials },
      );
    });

    it('should return empty array when catalog has no entities', async () => {
      mockedCatalog.queryEntities.mockResolvedValue({
        items: [],
        pageInfo: { nextCursor: undefined },
        totalItems: 0,
      });

      const result = await getAuthorizedEntityRefs({
        catalog: mockedCatalog,
        credentials: mockCredentials,
      });

      expect(result).toEqual([]);
    });

    it('should handle cursor-based pagination across multiple pages', async () => {
      const entity1 = {
        apiVersion: 'backstage.io/v1alpha1',
        kind: 'Component',
        metadata: { name: 'service-1', namespace: 'default' },
      };
      const entity2 = {
        apiVersion: 'backstage.io/v1alpha1',
        kind: 'Component',
        metadata: { name: 'service-2', namespace: 'default' },
      };

      mockedCatalog.queryEntities
        .mockResolvedValueOnce({
          items: [entity1],
          pageInfo: { nextCursor: 'cursor1' },
          totalItems: 2,
        })
        .mockResolvedValueOnce({
          items: [entity2],
          pageInfo: { nextCursor: undefined },
          totalItems: 2,
        });

      const result = await getAuthorizedEntityRefs({
        catalog: mockedCatalog,
        credentials: mockCredentials,
      });

      expect(result).toEqual([
        'component:default/service-1',
        'component:default/service-2',
      ]);
      expect(mockedCatalog.queryEntities).toHaveBeenCalledTimes(2);
      expect(mockedCatalog.queryEntities).toHaveBeenNthCalledWith(
        2,
        {
          fields: ['kind', 'metadata.name', 'metadata.namespace'],
          limit: 50,
          cursor: 'cursor1',
        },
        { credentials: mockCredentials },
      );
    });

    it('should return entity refs for multiple entity kinds', async () => {
      mockedCatalog.queryEntities.mockResolvedValue({
        items: [
          {
            apiVersion: 'backstage.io/v1alpha1',
            kind: 'Component',
            metadata: { name: 'my-service', namespace: 'default' },
          },
          {
            apiVersion: 'backstage.io/v1alpha1',
            kind: 'API',
            metadata: { name: 'my-api', namespace: 'default' },
          },
        ],
        pageInfo: { nextCursor: undefined },
        totalItems: 2,
      });

      const result = await getAuthorizedEntityRefs({
        catalog: mockedCatalog,
        credentials: mockCredentials,
      });

      expect(result).toEqual([
        'component:default/my-service',
        'api:default/my-api',
      ]);
    });
  });
});
