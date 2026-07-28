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
import { createListMetricsAction } from './listMetrics';
import { actionsRegistryServiceMock } from '@backstage/backend-test-utils/alpha';
import { mockServices } from '@backstage/backend-test-utils';
import { NotAllowedError } from '@backstage/errors';
import { AuthorizeResult } from '@backstage/plugin-permission-common';
import { MetricProvidersRegistry } from '../providers/MetricProvidersRegistry';

describe('createListMetricsAction', () => {
  const mockRegistry = {
    listMetrics: jest.fn(),
  } as unknown as MetricProvidersRegistry;

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('should return all available metrics', async () => {
    const mockActionsRegistry = actionsRegistryServiceMock();
    const mockPermissions = mockServices.permissions.mock();
    mockPermissions.authorizeConditional.mockResolvedValue([
      { result: AuthorizeResult.ALLOW },
    ]);

    const metrics = [
      {
        id: 'github.openPRs',
        title: 'Open PRs',
        description: 'Number of open pull requests',
        type: 'number' as const,
      },
      {
        id: 'sonarqube.coverage',
        title: 'Code Coverage',
        description: 'Test coverage percentage',
        type: 'number' as const,
      },
    ];
    (mockRegistry.listMetrics as jest.Mock).mockReturnValue(metrics);

    createListMetricsAction({
      actionsRegistry: mockActionsRegistry,
      permissions: mockPermissions,
      metricProvidersRegistry: mockRegistry,
    });

    const result = await mockActionsRegistry.invoke({
      id: 'test:list-metrics',
      input: {},
    });

    expect(result.output).toEqual({ metrics });
    expect(mockRegistry.listMetrics).toHaveBeenCalledWith();
  });

  it('should throw NotAllowedError when permission is denied', async () => {
    const mockActionsRegistry = actionsRegistryServiceMock();
    const mockPermissions = mockServices.permissions.mock();
    mockPermissions.authorizeConditional.mockResolvedValue([
      { result: AuthorizeResult.DENY },
    ]);

    createListMetricsAction({
      actionsRegistry: mockActionsRegistry,
      permissions: mockPermissions,
      metricProvidersRegistry: mockRegistry,
    });

    await expect(
      mockActionsRegistry.invoke({
        id: 'test:list-metrics',
        input: {},
      }),
    ).rejects.toThrow(NotAllowedError);
  });

  it('should filter metrics when permission is conditional', async () => {
    const mockActionsRegistry = actionsRegistryServiceMock();
    const mockPermissions = mockServices.permissions.mock();

    const conditions = {
      rule: 'HAS_METRIC_ID',
      resourceType: 'scorecard-metric',
      params: { metricIds: ['github.openPRs'] },
    };
    mockPermissions.authorizeConditional.mockResolvedValue([
      {
        result: AuthorizeResult.CONDITIONAL,
        pluginId: 'scorecard',
        resourceType: 'scorecard-metric',
        conditions,
      },
    ]);

    const allMetrics = [
      {
        id: 'github.openPRs',
        title: 'Open PRs',
        description: 'Number of open pull requests',
        type: 'number' as const,
      },
      {
        id: 'sonarqube.coverage',
        title: 'Code Coverage',
        description: 'Test coverage percentage',
        type: 'number' as const,
      },
    ];
    (mockRegistry.listMetrics as jest.Mock).mockReturnValue(allMetrics);

    createListMetricsAction({
      actionsRegistry: mockActionsRegistry,
      permissions: mockPermissions,
      metricProvidersRegistry: mockRegistry,
    });

    const result = await mockActionsRegistry.invoke({
      id: 'test:list-metrics',
      input: {},
    });

    expect(result.output).toEqual({
      metrics: [allMetrics[0]],
    });
  });
});
