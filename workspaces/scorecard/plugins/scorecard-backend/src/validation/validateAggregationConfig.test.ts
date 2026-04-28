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

import { ConfigReader } from '@backstage/config';
import { InputError } from '@backstage/errors';
import { aggregationTypes } from '@red-hat-developer-hub/backstage-plugin-scorecard-common';
import { validateAggregationConfig } from './validateAggregationConfig';
import { MetricProvidersRegistry } from '../providers/MetricProvidersRegistry';
import { MockNumberProvider } from '../../__fixtures__/mockProviders';
import { AGGREGATION_KPIS_CONFIG_PATH } from '../constants';

describe('validateAggregationConfig', () => {
  it('should not throw error when scorecard.aggregationKPIs is absent', () => {
    const rootConfig = new ConfigReader({});
    const registry = new MetricProvidersRegistry();

    expect(() =>
      validateAggregationConfig({ rootConfig, registry }),
    ).not.toThrow();
  });

  it('should not throw when all KPI entries are valid and metrics are registered', () => {
    const registry = new MetricProvidersRegistry();
    registry.register(new MockNumberProvider('github.open_prs', 'github'));

    const rootConfig = new ConfigReader({
      scorecard: {
        aggregationKPIs: {
          openPrsKpi: {
            title: 'GitHub PRs',
            description: 'Open pull requests',
            type: aggregationTypes.statusGrouped,
            metricId: 'github.open_prs',
          },
        },
      },
    });

    expect(() =>
      validateAggregationConfig({ rootConfig, registry }),
    ).not.toThrow();
  });

  it('should throw InputError when a KPI entry fails schema validation', () => {
    const registry = new MetricProvidersRegistry();
    registry.register(new MockNumberProvider('github.open_prs', 'github'));
    const tooLong = 'a'.repeat(256);

    const rootConfig = new ConfigReader({
      scorecard: {
        aggregationKPIs: {
          badKpi: {
            title: tooLong,
            description: 'Valid description',
            type: aggregationTypes.statusGrouped,
            metricId: 'github.open_prs',
          },
        },
      },
    });

    expect(() => validateAggregationConfig({ rootConfig, registry })).toThrow(
      InputError,
    );
  });

  it('should throw InputError when aggregation type is invalid', () => {
    const registry = new MetricProvidersRegistry();
    registry.register(new MockNumberProvider('github.open_prs', 'github'));

    const rootConfig = new ConfigReader({
      scorecard: {
        aggregationKPIs: {
          badKpi: {
            title: 'Valid title',
            description: 'Valid description',
            type: 'notARealAggregationType',
            metricId: 'github.open_prs',
          },
        },
      },
    });

    expect(() => validateAggregationConfig({ rootConfig, registry })).toThrow(
      InputError,
    );
  });

  it('should throw when metric provider for metricId is not registered', () => {
    const registry = new MetricProvidersRegistry();

    const rootConfig = new ConfigReader({
      scorecard: {
        aggregationKPIs: {
          openPrsKpi: {
            title: 'GitHub PRs',
            description: 'Open pull requests',
            type: aggregationTypes.statusGrouped,
            metricId: 'github.open_prs',
          },
        },
      },
    });

    expect(() => validateAggregationConfig({ rootConfig, registry })).toThrow(
      new Error(
        `Metric provider with ID 'github.open_prs' is not registered (${AGGREGATION_KPIS_CONFIG_PATH}.openPrsKpi).`,
      ),
    );
  });

  it('should not throw when average KPI has options.statusScores (app-config shape)', () => {
    const registry = new MetricProvidersRegistry();
    registry.register(new MockNumberProvider('github.open_prs', 'github'));

    const rootConfig = new ConfigReader({
      scorecard: {
        aggregationKPIs: {
          openPrsWeightedKpi: {
            title: 'GitHub Open PRs (weighted health)',
            type: aggregationTypes.average,
            description: 'Weighted health average for open PRs.',
            metricId: 'github.open_prs',
            options: {
              statusScores: {
                success: 100,
                warning: 50,
                error: 0,
              },
            },
          },
        },
      },
    });

    expect(() =>
      validateAggregationConfig({ rootConfig, registry }),
    ).not.toThrow();
  });

  it('should throw when type is average but required options block is missing', () => {
    const registry = new MetricProvidersRegistry();
    registry.register(new MockNumberProvider('github.open_prs', 'github'));

    const rootConfig = new ConfigReader({
      scorecard: {
        aggregationKPIs: {
          avgKpi: {
            title: 'Avg KPI',
            type: aggregationTypes.average,
            description: 'Weighted health',
            metricId: 'github.open_prs',
          },
        },
      },
    });

    expect(() => validateAggregationConfig({ rootConfig, registry })).toThrow(
      /Missing required config value at .*\.options/,
    );
  });

  it('should throw InputError when type is average but options.statusScores is empty', () => {
    const registry = new MetricProvidersRegistry();
    registry.register(new MockNumberProvider('github.open_prs', 'github'));

    const rootConfig = new ConfigReader({
      scorecard: {
        aggregationKPIs: {
          avgKpi: {
            title: 'Avg KPI',
            type: aggregationTypes.average,
            description: 'Weighted health',
            metricId: 'github.open_prs',
            options: { statusScores: {} },
          },
        },
      },
    });

    expect(() => validateAggregationConfig({ rootConfig, registry })).toThrow(
      InputError,
    );
  });

  it('should not throw when average KPI includes optional thresholds', () => {
    const registry = new MetricProvidersRegistry();
    registry.register(new MockNumberProvider('github.open_prs', 'github'));

    const rootConfig = new ConfigReader({
      scorecard: {
        aggregationKPIs: {
          avgKpi: {
            title: 'Avg KPI',
            type: aggregationTypes.average,
            description: 'Weighted health',
            metricId: 'github.open_prs',
            options: {
              statusScores: { success: 100, warning: 50, error: 0 },
              thresholds: {
                rules: [
                  {
                    key: 'success',
                    expression: '>=75',
                    color: 'success.main',
                  },
                  {
                    key: 'warning',
                    expression: '10-74',
                    color: 'warning.main',
                  },
                  { key: 'error', expression: '<10', color: 'error.main' },
                ],
              },
            },
          },
        },
      },
    });

    expect(() =>
      validateAggregationConfig({ rootConfig, registry }),
    ).not.toThrow();
  });

  it('should throw when thresholds has an invalid expression', () => {
    const registry = new MetricProvidersRegistry();
    registry.register(new MockNumberProvider('github.open_prs', 'github'));

    const rootConfig = new ConfigReader({
      scorecard: {
        aggregationKPIs: {
          avgKpi: {
            title: 'Avg KPI',
            type: aggregationTypes.average,
            description: 'Weighted health',
            metricId: 'github.open_prs',
            options: {
              statusScores: { success: 100, warning: 50, error: 0 },
              thresholds: {
                rules: [
                  {
                    key: 'success',
                    expression: '%%%invalid%%%',
                    color: 'success.main',
                  },
                ],
              },
            },
          },
        },
      },
    });

    expect(() => validateAggregationConfig({ rootConfig, registry })).toThrow(
      /Invalid thresholds configuration|Invalid threshold expression/,
    );
  });
});
