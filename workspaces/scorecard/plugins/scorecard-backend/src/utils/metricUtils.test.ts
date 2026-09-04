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
import { ConfigReader, type JsonObject } from '@backstage/config';
import { MockEntityBuilder } from '../../__fixtures__/mockEntityBuilder';
import { isMetricIdDisabled, isMetricEnabledByDefault } from './metricUtils';
import type { Metric } from '@red-hat-developer-hub/backstage-plugin-scorecard-common';
import type { MetricProvider } from '@red-hat-developer-hub/backstage-plugin-scorecard-node';

describe('isMetricIdDisabled', () => {
  const metricId = 'openssf.maintained';
  let mockLogger: ReturnType<typeof mockServices.logger.mock>;

  function createConfig(
    scorecardOverrides: {
      disabledMetrics?: string[];
      entityAnnotations?: {
        enabled?: boolean;
        disabledMetrics?: { enabled?: boolean; except?: string[] };
      };
    } = {},
  ) {
    return mockServices.rootConfig({
      data: {
        scorecard: {
          ...scorecardOverrides,
        },
      },
    });
  }

  function createEntity(annotationValue?: string) {
    return new MockEntityBuilder()
      .withMetadata({
        name: 'test-entity',
        namespace: 'default',
        ...(annotationValue !== undefined && {
          annotations: {
            'scorecard.io/disabled-metrics': annotationValue,
          },
        }),
      })
      .build();
  }

  beforeEach(() => {
    mockLogger = mockServices.logger.mock();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns true when metric is in app-config disabledMetrics', () => {
    const config = createConfig({ disabledMetrics: [metricId] });
    const entity = createEntity();

    const result = isMetricIdDisabled(config, metricId, entity, mockLogger);

    expect(result).toBe(true);
  });

  it('returns true when disabled by annotation (no except list)', () => {
    const config = createConfig();
    const entity = createEntity(metricId);

    const result = isMetricIdDisabled(config, metricId, entity, mockLogger);

    expect(result).toBe(true);
  });

  it('returns false when not disabled by app-config or annotation', () => {
    const config = createConfig();
    const entity = createEntity();

    const result = isMetricIdDisabled(config, metricId, entity, mockLogger);

    expect(result).toBe(false);
  });

  it('returns false when no config and no annotation', () => {
    const config = createConfig();
    const entity = createEntity();

    const result = isMetricIdDisabled(config, metricId, entity, mockLogger);

    expect(result).toBe(false);
  });

  it('When entityOverride.disabledMetrics.enabled=false, users can NO override by annotations.', () => {
    const config = createConfig({
      entityAnnotations: {
        disabledMetrics: {
          enabled: false,
          except: [metricId],
        },
      },
    });

    const entity = createEntity(metricId);
    const result = isMetricIdDisabled(config, metricId, entity, mockLogger);

    expect(result).toBe(false);
  });

  it('returns false when entityAnnotations.enabled is false even if annotation lists the metric', () => {
    const config = createConfig({
      entityAnnotations: {
        enabled: false,
        disabledMetrics: {
          enabled: true,
        },
      },
    });

    const entity = createEntity(metricId);
    const result = isMetricIdDisabled(config, metricId, entity, mockLogger);

    expect(result).toBe(false);
  });

  it('returns false when entityAnnotations.disabledMetrics.enabled is false, even if metric is not in except list', () => {
    const config = createConfig({
      entityAnnotations: {
        disabledMetrics: {
          enabled: false,
          except: ['other-metric-id'],
        },
      },
    });

    const entity = createEntity(metricId);
    const result = isMetricIdDisabled(config, metricId, entity, mockLogger);

    expect(result).toBe(false);
  });

  it('returns false when disabled by annotation but metric is in entityAnnotations.disabledMetrics.except but entityAnnotations.disabledMetrics.enabled is true', () => {
    const config = createConfig({
      entityAnnotations: {
        disabledMetrics: {
          enabled: true,
          except: [metricId],
        },
      },
    });

    const entity = createEntity(metricId);
    const result = isMetricIdDisabled(config, metricId, entity, mockLogger);

    expect(result).toBe(false);
  });

  it('returns true when disabled by annotation but metric is NOT in entityAnnotations.disabledMetrics.except but entityAnnotations.disabledMetrics.enabled is true', () => {
    const config = createConfig({
      entityAnnotations: {
        disabledMetrics: {
          enabled: true,
          except: [],
        },
      },
    });

    const entity = createEntity(metricId);
    const result = isMetricIdDisabled(config, metricId, entity, mockLogger);

    expect(result).toBe(true);
  });

  it('returns false when entityAnnotations.enabled is true but disabledMetrics.enabled is false', () => {
    const config = createConfig({
      entityAnnotations: {
        enabled: true,
        disabledMetrics: {
          enabled: false,
        },
      },
    });

    const entity = createEntity(metricId);
    const result = isMetricIdDisabled(config, metricId, entity, mockLogger);

    expect(result).toBe(false);
  });

  it('returns true when disabled by app-config even if also disabled by annotation', () => {
    const config = createConfig({
      disabledMetrics: [metricId],
      entityAnnotations: {
        disabledMetrics: {
          enabled: true,
        },
      },
    });

    const entity = createEntity(metricId);
    const result = isMetricIdDisabled(config, metricId, entity, mockLogger);

    expect(result).toBe(true);
  });
});

describe('isMetricEnabledByDefault', () => {
  function createMetric(overrides: Partial<Metric> = {}): Metric {
    return {
      id: 'github.openPRs',
      title: 'Open PRs',
      description: 'Number of open PRs',
      type: 'number',
      thresholds: {
        rules: [
          { key: 'error', expression: '>40' },
          { key: 'success', expression: '<=40' },
        ],
      },
      ...overrides,
    };
  }

  function createProvider(
    overrides: {
      providerId?: string;
      datasourceId?: string;
      isEnabled?: () => boolean;
    } = {},
  ): MetricProvider {
    return {
      getProviderId: () => overrides.providerId ?? 'github.openPRs',
      getProviderDatasourceId: () => overrides.datasourceId ?? 'github',
      getMetrics: () => [],
      calculateMetrics: jest.fn(),
      getCatalogFilter: () => ({}),
      ...(overrides.isEnabled !== undefined && {
        isEnabled: overrides.isEnabled,
      }),
    };
  }

  function createEnabledConfig(
    providerEnabled?: boolean,
    metricEnabled?: boolean,
  ) {
    const data: JsonObject = {};
    const providerConfig: JsonObject = {};

    if (providerEnabled !== undefined) {
      providerConfig.enabled = providerEnabled;
    }

    if (metricEnabled !== undefined) {
      providerConfig.metrics = {
        openPRs: { enabled: metricEnabled },
      };
    }

    if (Object.keys(providerConfig).length > 0) {
      data.metricProviders = { github: { openPRs: providerConfig } };
    }

    return new ConfigReader({ scorecard: data });
  }

  it('returns true when no enabled flag is set anywhere (backward compatible)', () => {
    const config = createEnabledConfig();
    const metric = createMetric();
    const provider = createProvider();

    expect(isMetricEnabledByDefault(config, metric, provider)).toBe(true);
  });

  it('returns false when metric code-level enabled is false', () => {
    const config = createEnabledConfig();
    const metric = createMetric({ enabled: false });
    const provider = createProvider();

    expect(isMetricEnabledByDefault(config, metric, provider)).toBe(false);
  });

  it('returns true when metric code-level enabled is true', () => {
    const config = createEnabledConfig();
    const metric = createMetric({ enabled: true });
    const provider = createProvider();

    expect(isMetricEnabledByDefault(config, metric, provider)).toBe(true);
  });

  it('returns false when provider isEnabled returns false', () => {
    const config = createEnabledConfig();
    const metric = createMetric();
    const provider = createProvider({ isEnabled: () => false });

    expect(isMetricEnabledByDefault(config, metric, provider)).toBe(false);
  });

  it('config metric enabled:true overrides code metric enabled:false', () => {
    const config = createEnabledConfig(undefined, true);
    const metric = createMetric({ enabled: false });
    const provider = createProvider();

    expect(isMetricEnabledByDefault(config, metric, provider)).toBe(true);
  });

  it('config metric enabled:false overrides code metric enabled:true', () => {
    const config = createEnabledConfig(undefined, false);
    const metric = createMetric({ enabled: true });
    const provider = createProvider();

    expect(isMetricEnabledByDefault(config, metric, provider)).toBe(false);
  });

  it('config provider enabled:true overrides provider isEnabled:false', () => {
    const config = createEnabledConfig(true);
    const metric = createMetric();
    const provider = createProvider({ isEnabled: () => false });

    expect(isMetricEnabledByDefault(config, metric, provider)).toBe(true);
  });

  it('config provider enabled:false disables an otherwise-enabled provider', () => {
    const config = createEnabledConfig(false);
    const metric = createMetric();
    const provider = createProvider();

    expect(isMetricEnabledByDefault(config, metric, provider)).toBe(false);
  });

  it('code metric enabled:true overrides provider isEnabled:false', () => {
    const config = createEnabledConfig();
    const metric = createMetric({ enabled: true });
    const provider = createProvider({ isEnabled: () => false });

    expect(isMetricEnabledByDefault(config, metric, provider)).toBe(true);
  });

  it('config metric enabled:true overrides config provider enabled:false', () => {
    const config = createEnabledConfig(false, true);
    const metric = createMetric();
    const provider = createProvider();

    expect(isMetricEnabledByDefault(config, metric, provider)).toBe(true);
  });

  it('config metric enabled:false takes precedence over config provider enabled:true', () => {
    const config = createEnabledConfig(true, false);
    const metric = createMetric();
    const provider = createProvider();

    expect(isMetricEnabledByDefault(config, metric, provider)).toBe(false);
  });

  it('metric without enabled inherits provider isEnabled:false', () => {
    const config = createEnabledConfig();
    const metric = createMetric();
    const provider = createProvider({ isEnabled: () => false });

    expect(isMetricEnabledByDefault(config, metric, provider)).toBe(false);
  });

  it('metric without enabled and provider without isEnabled defaults to true', () => {
    const config = createEnabledConfig();
    const metric = createMetric();
    const provider = createProvider();

    expect(isMetricEnabledByDefault(config, metric, provider)).toBe(true);
  });
});
