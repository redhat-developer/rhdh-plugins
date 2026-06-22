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
import { createGetEntityMetricsAction } from './getEntityMetrics';
import { actionsRegistryServiceMock } from '@backstage/backend-test-utils/alpha';
import { mockServices } from '@backstage/backend-test-utils';
import { NotFoundError, NotAllowedError } from '@backstage/errors';
import { AuthorizeResult } from '@backstage/plugin-permission-common';
import { CatalogMetricService } from '../service/CatalogMetricService';

describe('createGetEntityMetricsAction', () => {
  const mockCatalogMetricService = {
    getLatestEntityMetrics: jest.fn(),
  } as unknown as CatalogMetricService;

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('should return metrics for an entity with metrics', async () => {
    const mockActionsRegistry = actionsRegistryServiceMock();
    const mockPermissions = mockServices.permissions.mock();
    mockPermissions.authorize.mockResolvedValue([
      { result: AuthorizeResult.ALLOW },
    ]);
    mockPermissions.authorizeConditional.mockResolvedValue([
      { result: AuthorizeResult.ALLOW },
    ]);

    const mockMetrics = [
      {
        id: 'github.openPrs',
        status: 'success',
        metadata: {
          title: 'Open PRs',
          description: 'Number of open pull requests',
          type: 'number',
        },
        result: {
          value: 5,
          timestamp: '2026-01-01T00:00:00.000Z',
          thresholdResult: {
            status: 'success',
            evaluation: 'pass',
          },
        },
      },
    ];
    (
      mockCatalogMetricService.getLatestEntityMetrics as jest.Mock
    ).mockResolvedValue(mockMetrics);

    createGetEntityMetricsAction({
      actionsRegistry: mockActionsRegistry,
      permissions: mockPermissions,
      catalogMetricService: mockCatalogMetricService,
    });

    const result = await mockActionsRegistry.invoke({
      id: 'test:get-entity-metrics',
      input: { entityRef: 'component:default/my-service' },
    });

    expect(result.output).toEqual({ metrics: mockMetrics });
    expect(
      mockCatalogMetricService.getLatestEntityMetrics,
    ).toHaveBeenCalledWith(
      'component:default/my-service',
      undefined,
      undefined,
    );
  });

  it('should return NotFoundError for a non-existent entity', async () => {
    const mockActionsRegistry = actionsRegistryServiceMock();
    const mockPermissions = mockServices.permissions.mock();
    mockPermissions.authorize.mockResolvedValue([
      { result: AuthorizeResult.ALLOW },
    ]);
    mockPermissions.authorizeConditional.mockResolvedValue([
      { result: AuthorizeResult.ALLOW },
    ]);

    (
      mockCatalogMetricService.getLatestEntityMetrics as jest.Mock
    ).mockRejectedValue(
      new NotFoundError('Entity not found: component:default/nonexistent'),
    );

    createGetEntityMetricsAction({
      actionsRegistry: mockActionsRegistry,
      permissions: mockPermissions,
      catalogMetricService: mockCatalogMetricService,
    });

    await expect(
      mockActionsRegistry.invoke({
        id: 'test:get-entity-metrics',
        input: { entityRef: 'component:default/nonexistent' },
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it('should return empty metrics for an entity with no metrics', async () => {
    const mockActionsRegistry = actionsRegistryServiceMock();
    const mockPermissions = mockServices.permissions.mock();
    mockPermissions.authorize.mockResolvedValue([
      { result: AuthorizeResult.ALLOW },
    ]);
    mockPermissions.authorizeConditional.mockResolvedValue([
      { result: AuthorizeResult.ALLOW },
    ]);

    (
      mockCatalogMetricService.getLatestEntityMetrics as jest.Mock
    ).mockResolvedValue([]);

    createGetEntityMetricsAction({
      actionsRegistry: mockActionsRegistry,
      permissions: mockPermissions,
      catalogMetricService: mockCatalogMetricService,
    });

    const result = await mockActionsRegistry.invoke({
      id: 'test:get-entity-metrics',
      input: { entityRef: 'component:default/empty-entity' },
    });

    expect(result.output).toEqual({ metrics: [] });
  });

  it('should throw NotAllowedError when catalog entity access is denied', async () => {
    const mockActionsRegistry = actionsRegistryServiceMock();
    const mockPermissions = mockServices.permissions.mock();
    mockPermissions.authorize.mockResolvedValue([
      { result: AuthorizeResult.DENY },
    ]);

    createGetEntityMetricsAction({
      actionsRegistry: mockActionsRegistry,
      permissions: mockPermissions,
      catalogMetricService: mockCatalogMetricService,
    });

    await expect(
      mockActionsRegistry.invoke({
        id: 'test:get-entity-metrics',
        input: { entityRef: 'component:default/my-service' },
      }),
    ).rejects.toThrow(NotAllowedError);

    expect(
      mockCatalogMetricService.getLatestEntityMetrics,
    ).not.toHaveBeenCalled();
  });

  it('should throw NotAllowedError when scorecard metric permission is denied', async () => {
    const mockActionsRegistry = actionsRegistryServiceMock();
    const mockPermissions = mockServices.permissions.mock();
    mockPermissions.authorize.mockResolvedValue([
      { result: AuthorizeResult.ALLOW },
    ]);
    mockPermissions.authorizeConditional.mockResolvedValue([
      { result: AuthorizeResult.DENY },
    ]);

    createGetEntityMetricsAction({
      actionsRegistry: mockActionsRegistry,
      permissions: mockPermissions,
      catalogMetricService: mockCatalogMetricService,
    });

    await expect(
      mockActionsRegistry.invoke({
        id: 'test:get-entity-metrics',
        input: { entityRef: 'component:default/my-service' },
      }),
    ).rejects.toThrow(NotAllowedError);
  });

  it('should pass conditions to getLatestEntityMetrics when permission is conditional', async () => {
    const mockActionsRegistry = actionsRegistryServiceMock();
    const mockPermissions = mockServices.permissions.mock();
    mockPermissions.authorize.mockResolvedValue([
      { result: AuthorizeResult.ALLOW },
    ]);

    const conditions = {
      rule: 'HAS_METRIC_ID',
      resourceType: 'scorecard-metric',
      params: { metricIds: ['github.openPrs'] },
    };
    mockPermissions.authorizeConditional.mockResolvedValue([
      {
        result: AuthorizeResult.CONDITIONAL,
        pluginId: 'scorecard',
        resourceType: 'scorecard-metric',
        conditions,
      },
    ]);

    const filteredMetrics = [
      {
        id: 'github.openPrs',
        status: 'success',
        metadata: {
          title: 'Open PRs',
          description: 'Number of open pull requests',
          type: 'number',
        },
        result: {
          value: 3,
          timestamp: '2026-01-01T00:00:00.000Z',
          thresholdResult: {
            status: 'success',
            evaluation: 'pass',
          },
        },
      },
    ];
    (
      mockCatalogMetricService.getLatestEntityMetrics as jest.Mock
    ).mockResolvedValue(filteredMetrics);

    createGetEntityMetricsAction({
      actionsRegistry: mockActionsRegistry,
      permissions: mockPermissions,
      catalogMetricService: mockCatalogMetricService,
    });

    const result = await mockActionsRegistry.invoke({
      id: 'test:get-entity-metrics',
      input: { entityRef: 'component:default/my-service' },
    });

    expect(result.output).toEqual({ metrics: filteredMetrics });
    expect(
      mockCatalogMetricService.getLatestEntityMetrics,
    ).toHaveBeenCalledWith(
      'component:default/my-service',
      undefined,
      conditions,
    );
  });
});
