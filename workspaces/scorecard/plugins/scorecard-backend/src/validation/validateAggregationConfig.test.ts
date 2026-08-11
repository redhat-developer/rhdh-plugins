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

import type { Config } from '@backstage/config';
import { InputError } from '@backstage/errors';
import { aggregationTypes } from '@red-hat-developer-hub/backstage-plugin-scorecard-common';
import { validateAggregationConfig } from './validateAggregationConfig';
import { MetricProvidersRegistry } from '../providers/MetricProvidersRegistry';
import { ThresholdResolver } from '../threshold/ThresholdResolver';
import {
  MockBooleanProvider,
  MockNumberProvider,
} from '../../__fixtures__/mockProviders';
import { AGGREGATION_KPIS_CONFIG_PATH } from '../constants';
import {
  buildMockMetricProvidersRegistry,
  mockMetricProvidersRegistry,
} from '../../__fixtures__/mockMetricProvidersRegistry';
import { mockServices } from '@backstage/backend-test-utils';

function validateConfig(
  rootConfig: Config,
  registry: MetricProvidersRegistry,
): void {
  const thresholdResolver = new ThresholdResolver(
    rootConfig,
    registry.listProviders(),
  );
  validateAggregationConfig({ rootConfig, registry, thresholdResolver });
}

describe('validateAggregationConfig', () => {
  it('should not throw error when scorecard.aggregationKPIs is absent', () => {
    const rootConfig = mockServices.rootConfig({});
    const registry = buildMockMetricProvidersRegistry({});

    expect(() => validateConfig(rootConfig, registry)).not.toThrow();
  });

  it('should not throw when all KPI entries are valid and metrics are registered', () => {
    const registry = buildMockMetricProvidersRegistry({
      provider: new MockNumberProvider('github.openPRs', 'github'),
    });

    const rootConfig = mockServices.rootConfig({
      data: {
        scorecard: {
          aggregationKPIs: {
            openPrsKpi: {
              title: 'GitHub PRs',
              description: 'Open pull requests',
              type: aggregationTypes.statusGrouped,
              metricId: 'github.openPRs',
            },
          },
        },
      },
    });

    expect(() => validateConfig(rootConfig, registry)).not.toThrow();
  });

  it('should throw InputError when a KPI entry fails schema validation', () => {
    const registry = buildMockMetricProvidersRegistry({
      provider: new MockNumberProvider('github.openPRs', 'github'),
    });
    const tooLong = 'a'.repeat(256);

    const rootConfig = mockServices.rootConfig({
      data: {
        scorecard: {
          aggregationKPIs: {
            badKpi: {
              title: tooLong,
              description: 'Valid description',
              type: aggregationTypes.statusGrouped,
              metricId: 'github.openPRs',
            },
          },
        },
      },
    });

    expect(() => validateConfig(rootConfig, registry)).toThrow(InputError);
  });

  it('should throw InputError when aggregation type is invalid', () => {
    const registry = buildMockMetricProvidersRegistry({
      provider: new MockNumberProvider('github.openPRs', 'github'),
    });

    const rootConfig = mockServices.rootConfig({
      data: {
        scorecard: {
          aggregationKPIs: {
            badKpi: {
              title: 'Valid title',
              description: 'Valid description',
              type: 'notARealAggregationType',
              metricId: 'github.openPRs',
            },
          },
        },
      },
    });

    expect(() => validateConfig(rootConfig, registry)).toThrow(InputError);
  });

  it('should throw when metric provider for metricId is not registered', () => {
    const rootConfig = mockServices.rootConfig({
      data: {
        scorecard: {
          aggregationKPIs: {
            openPrsKpi: {
              title: 'GitHub PRs',
              description: 'Open pull requests',
              type: aggregationTypes.statusGrouped,
              metricId: 'github.openPRs',
            },
          },
        },
      },
    });

    expect(() =>
      validateConfig(rootConfig, mockMetricProvidersRegistry),
    ).toThrow(
      new Error(
        `Metric provider with ID 'github.openPRs' is not registered (${AGGREGATION_KPIS_CONFIG_PATH}.openPrsKpi).`,
      ),
    );
  });

  it('should not throw when weightedStatusScore KPI has options.statusScores (app-config shape)', () => {
    const registry = buildMockMetricProvidersRegistry({
      provider: new MockNumberProvider('github.openPRs', 'github'),
    });

    const rootConfig = mockServices.rootConfig({
      data: {
        scorecard: {
          aggregationKPIs: {
            openPrsWeightedKpi: {
              title: 'GitHub Open PRs (weighted health)',
              type: aggregationTypes.weightedStatusScore,
              description: 'Weighted health score for open PRs.',
              metricId: 'github.openPRs',
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
      },
    });

    expect(() => validateConfig(rootConfig, registry)).not.toThrow();
  });

  it('should throw when type is weightedStatusScore but required options block is missing', () => {
    const registry = buildMockMetricProvidersRegistry({
      provider: new MockNumberProvider('github.openPRs', 'github'),
    });

    const rootConfig = mockServices.rootConfig({
      data: {
        scorecard: {
          aggregationKPIs: {
            weightedKpi: {
              title: 'Avg KPI',
              type: aggregationTypes.weightedStatusScore,
              description: 'Weighted health score',
              metricId: 'github.openPRs',
            },
          },
        },
      },
    });

    expect(() => validateConfig(rootConfig, registry)).toThrow(
      /options.statusScores must contain at least one weight value for attribute \"options.statusScores\"/,
    );
  });

  it('should throw InputError when type is weightedStatusScore but options.statusScores is empty', () => {
    const registry = buildMockMetricProvidersRegistry({
      provider: new MockNumberProvider('github.openPRs', 'github'),
    });

    const rootConfig = mockServices.rootConfig({
      data: {
        scorecard: {
          aggregationKPIs: {
            weightedKpi: {
              title: 'Avg KPI',
              type: aggregationTypes.weightedStatusScore,
              description: 'Weighted health score',
              metricId: 'github.openPRs',
              options: { statusScores: {} },
            },
          },
        },
      },
    });

    expect(() => validateConfig(rootConfig, registry)).toThrow(InputError);
  });

  it('should not throw when weightedStatusScore KPI includes optional thresholds', () => {
    const registry = buildMockMetricProvidersRegistry({
      provider: new MockNumberProvider('github.openPRs', 'github'),
    });

    const rootConfig = mockServices.rootConfig({
      data: {
        scorecard: {
          aggregationKPIs: {
            weightedKpi: {
              title: 'Avg KPI',
              type: aggregationTypes.weightedStatusScore,
              description: 'Weighted health score',
              metricId: 'github.openPRs',
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
                      expression: '10-75',
                      color: 'warning.main',
                    },
                    { key: 'error', expression: '<10', color: 'error.main' },
                  ],
                },
              },
            },
          },
        },
      },
    });

    expect(() => validateConfig(rootConfig, registry)).not.toThrow();
  });

  it('should throw when thresholds has an invalid expression', () => {
    const registry = buildMockMetricProvidersRegistry({
      provider: new MockNumberProvider('github.openPRs', 'github'),
    });

    const rootConfig = mockServices.rootConfig({
      data: {
        scorecard: {
          aggregationKPIs: {
            weightedKpi: {
              title: 'Avg KPI',
              type: aggregationTypes.weightedStatusScore,
              description: 'Weighted health score',
              metricId: 'github.openPRs',
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
      },
    });

    expect(() => validateConfig(rootConfig, registry)).toThrow(
      /Invalid thresholds configuration|Invalid threshold expression/,
    );
  });

  it('should throw when weightedStatusScore KPI thresholds leave a gap on the number line', () => {
    const registry = buildMockMetricProvidersRegistry({
      provider: new MockNumberProvider('github.openPRs', 'github'),
    });

    const rootConfig = mockServices.rootConfig({
      data: {
        scorecard: {
          aggregationKPIs: {
            weightedKpi: {
              title: 'Avg KPI',
              type: aggregationTypes.weightedStatusScore,
              description: 'Weighted health score',
              metricId: 'github.openPRs',
              options: {
                statusScores: { success: 100, warning: 50, error: 0 },
                thresholds: {
                  rules: [
                    {
                      key: 'success',
                      expression: '<10',
                      color: 'success.main',
                    },
                    {
                      key: 'warning',
                      expression: '11-20',
                      color: 'warning.main',
                    },
                    {
                      key: 'error',
                      expression: '>20',
                      color: 'error.main',
                    },
                  ],
                },
              },
            },
          },
        },
      },
    });

    expect(() => validateConfig(rootConfig, registry)).toThrow(
      /do not cover the entire real line/,
    );
  });

  it('should not throw when scalar sum KPI is valid for a number metric', () => {
    const registry = buildMockMetricProvidersRegistry({
      provider: new MockNumberProvider('github.openPRs', 'github'),
    });

    const rootConfig = mockServices.rootConfig({
      data: {
        scorecard: {
          aggregationKPIs: {
            totalOpenPrs: {
              title: 'Total Open PRs',
              description: 'Sum of open PRs',
              type: aggregationTypes.sum,
              metricId: 'github.openPRs',
            },
          },
        },
      },
    });

    expect(() => validateConfig(rootConfig, registry)).not.toThrow();
  });

  it('should throw InputError when sum KPI targets a boolean metric', () => {
    const registry = buildMockMetricProvidersRegistry({
      provider: new MockBooleanProvider('jira.license', 'jira'),
    });

    const rootConfig = mockServices.rootConfig({
      data: {
        scorecard: {
          aggregationKPIs: {
            badSumKpi: {
              title: 'Bad sum',
              description: 'Sum on boolean metric',
              type: aggregationTypes.sum,
              metricId: 'jira.license',
            },
          },
        },
      },
    });

    expect(() => validateConfig(rootConfig, registry)).toThrow(InputError);
    expect(() => validateConfig(rootConfig, registry)).toThrow(
      /requires a number metric/,
    );
  });

  it('should not throw when count KPI targets a boolean metric', () => {
    const registry = buildMockMetricProvidersRegistry({
      provider: new MockBooleanProvider('jira.license', 'jira'),
    });

    const rootConfig = mockServices.rootConfig({
      data: {
        scorecard: {
          aggregationKPIs: {
            licenseCount: {
              title: 'License count',
              description: 'Count entities with license metric',
              type: aggregationTypes.count,
              metricId: 'jira.license',
            },
          },
        },
      },
    });

    expect(() => validateConfig(rootConfig, registry)).not.toThrow();
  });

  it.each([
    aggregationTypes.average,
    aggregationTypes.max,
    aggregationTypes.min,
    aggregationTypes.count,
  ])(
    'should not throw when scalar %s KPI is valid for a number metric',
    type => {
      const registry = buildMockMetricProvidersRegistry({
        provider: new MockNumberProvider('github.openPRs', 'github'),
      });

      const rootConfig = mockServices.rootConfig({
        data: {
          scorecard: {
            aggregationKPIs: {
              scalarKpi: {
                title: 'Scalar KPI',
                description: 'Scalar aggregation',
                type,
                metricId: 'github.openPRs',
              },
            },
          },
        },
      });

      expect(() => validateConfig(rootConfig, registry)).not.toThrow();
    },
  );

  it('should throw when scalar KPI thresholds leave a gap on the real line', () => {
    const registry = buildMockMetricProvidersRegistry({
      provider: new MockNumberProvider('github.openPRs', 'github'),
    });

    const rootConfig = mockServices.rootConfig({
      data: {
        scorecard: {
          aggregationKPIs: {
            badScalarKpi: {
              title: 'Bad scalar',
              description: 'Scalar with gap thresholds',
              type: aggregationTypes.sum,
              metricId: 'github.openPRs',
              options: {
                thresholds: {
                  rules: [
                    {
                      key: 'success',
                      expression: '<10',
                      color: 'success.main',
                    },
                    {
                      key: 'error',
                      expression: '>20',
                      color: 'error.main',
                    },
                  ],
                },
              },
            },
          },
        },
      },
    });

    expect(() => validateConfig(rootConfig, registry)).toThrow(
      /do not cover the entire real line/,
    );
  });

  it('should accept scalar KPI with filter.status', () => {
    const registry = buildMockMetricProvidersRegistry({
      provider: new MockNumberProvider('jira.openIssues', 'jira'),
    });

    const rootConfig = mockServices.rootConfig({
      data: {
        scorecard: {
          aggregationKPIs: {
            totalCriticalBugs: {
              title: 'Total Critical Bugs',
              description: 'Sum for entities in error status',
              type: aggregationTypes.sum,
              metricId: 'jira.openIssues',
              filter: {
                status: 'error',
              },
            },
          },
        },
      },
    });

    expect(() => validateConfig(rootConfig, registry)).not.toThrow();
  });

  it('should reject scalar KPI with filter.status not in metric threshold keys', () => {
    const registry = buildMockMetricProvidersRegistry({
      provider: new MockNumberProvider('jira.openIssues', 'jira'),
    });

    const rootConfig = mockServices.rootConfig({
      data: {
        scorecard: {
          aggregationKPIs: {
            badFilterStatusKpi: {
              title: 'Bad filter status',
              description: 'Unknown threshold key',
              type: aggregationTypes.sum,
              metricId: 'jira.openIssues',
              filter: {
                status: 'critical',
              },
            },
          },
        },
      },
    });

    expect(() => validateConfig(rootConfig, registry)).toThrow(InputError);
    expect(() => validateConfig(rootConfig, registry)).toThrow(
      /filter\.status "critical" is not a threshold rule key.*Valid keys: error, warning, success/,
    );
  });

  it('should accept scalar KPI filter.status matching app-config threshold override keys', () => {
    const registry = buildMockMetricProvidersRegistry({
      provider: new MockNumberProvider('jira.openIssues', 'jira'),
    });

    const rootConfig = mockServices.rootConfig({
      data: {
        scorecard: {
          metricProviders: {
            jira: {
              openIssues: {
                thresholds: {
                  rules: [
                    {
                      key: 'high',
                      expression: '>100',
                      color: 'error.main',
                      icon: 'scorecardErrorStatusIcon',
                    },
                    {
                      key: 'low',
                      expression: '<=100',
                      color: 'success.main',
                      icon: 'scorecardSuccessStatusIcon',
                    },
                  ],
                },
              },
            },
          },
          aggregationKPIs: {
            highIssuesKpi: {
              title: 'High issues',
              description: 'Sum for high threshold bucket',
              type: aggregationTypes.sum,
              metricId: 'jira.openIssues',
              filter: {
                status: 'high',
              },
            },
          },
        },
      },
    });

    expect(() => validateConfig(rootConfig, registry)).not.toThrow();
  });

  it('should reject scalar KPI filter.status when app-config thresholds omit the key', () => {
    const registry = buildMockMetricProvidersRegistry({
      provider: new MockNumberProvider('jira.openIssues', 'jira'),
    });

    const rootConfig = mockServices.rootConfig({
      data: {
        scorecard: {
          metricProviders: {
            jira: {
              openIssues: {
                thresholds: {
                  rules: [
                    {
                      key: 'high',
                      expression: '>100',
                      color: 'error.main',
                      icon: 'scorecardErrorStatusIcon',
                    },
                    {
                      key: 'low',
                      expression: '<=100',
                      color: 'success.main',
                      icon: 'scorecardSuccessStatusIcon',
                    },
                  ],
                },
              },
            },
          },
          aggregationKPIs: {
            badFilterKpi: {
              title: 'Error filter on custom thresholds',
              description: 'Default error key not in override',
              type: aggregationTypes.sum,
              metricId: 'jira.openIssues',
              filter: {
                status: 'error',
              },
            },
          },
        },
      },
    });

    expect(() => validateConfig(rootConfig, registry)).toThrow(InputError);
    expect(() => validateConfig(rootConfig, registry)).toThrow(
      /filter\.status "error" is not a threshold rule key.*Valid keys: high, low/,
    );
  });

  it('should accept scalar KPI with empty filter object when status is omitted', () => {
    const registry = buildMockMetricProvidersRegistry({
      provider: new MockNumberProvider('jira.openIssues', 'jira'),
    });

    const rootConfig = mockServices.rootConfig({
      data: {
        scorecard: {
          aggregationKPIs: {
            badFilterKpi: {
              title: 'Bad filter KPI',
              description: 'Missing filter.status',
              type: aggregationTypes.sum,
              metricId: 'jira.openIssues',
              filter: {},
            },
          },
        },
      },
    });

    expect(() => validateConfig(rootConfig, registry)).not.toThrow();
  });

  it('should reject scalar KPI with filter.status longer than 64 characters', () => {
    const registry = buildMockMetricProvidersRegistry({
      provider: new MockNumberProvider('jira.openIssues', 'jira'),
    });

    const rootConfig = mockServices.rootConfig({
      data: {
        scorecard: {
          aggregationKPIs: {
            longFilterKpi: {
              title: 'Long filter status',
              description: 'Filter status exceeds max length',
              type: aggregationTypes.sum,
              metricId: 'jira.openIssues',
              filter: {
                status: 'a'.repeat(65),
              },
            },
          },
        },
      },
    });

    expect(() => validateConfig(rootConfig, registry)).toThrow(InputError);
    expect(() => validateConfig(rootConfig, registry)).toThrow(
      /at most 64 character/,
    );
  });

  it('should ignore filter on statusGrouped KPIs', () => {
    const registry = buildMockMetricProvidersRegistry({
      provider: new MockNumberProvider('github.openPRs', 'github'),
    });

    const rootConfig = mockServices.rootConfig({
      data: {
        scorecard: {
          aggregationKPIs: {
            statusKpi: {
              title: 'Status breakdown',
              description: 'Counts by status',
              type: aggregationTypes.statusGrouped,
              metricId: 'github.openPRs',
              filter: {
                status: 'error',
              },
            },
          },
        },
      },
    });

    expect(() => validateConfig(rootConfig, registry)).not.toThrow();
  });

  it('should ignore filter on weightedStatusScore KPIs', () => {
    const registry = buildMockMetricProvidersRegistry({
      provider: new MockNumberProvider('github.openPRs', 'github'),
    });

    const rootConfig = mockServices.rootConfig({
      data: {
        scorecard: {
          aggregationKPIs: {
            weightedKpi: {
              title: 'Weighted health',
              description: 'Weighted health score across statuses',
              type: aggregationTypes.weightedStatusScore,
              metricId: 'github.openPRs',
              filter: {
                status: 'error',
              },
              options: {
                statusScores: {
                  error: 0,
                  warning: 50,
                  success: 100,
                },
              },
            },
          },
        },
      },
    });

    expect(() => validateConfig(rootConfig, registry)).not.toThrow();
  });

  it('should accept scalar KPI with filter.status and valid options.thresholds', () => {
    const registry = buildMockMetricProvidersRegistry({
      provider: new MockNumberProvider('jira.openIssues', 'jira'),
    });

    const rootConfig = mockServices.rootConfig({
      data: {
        scorecard: {
          aggregationKPIs: {
            filteredThresholdKpi: {
              title: 'Filtered with thresholds',
              description: 'Scalar KPI with filter and custom thresholds',
              type: aggregationTypes.sum,
              metricId: 'jira.openIssues',
              filter: {
                status: 'error',
              },
              options: {
                thresholds: {
                  rules: [
                    {
                      key: 'success',
                      expression: '>=75',
                      color: 'success.main',
                    },
                    {
                      key: 'warning',
                      expression: '10-75',
                      color: 'warning.main',
                    },
                    { key: 'error', expression: '<10', color: 'error.main' },
                  ],
                },
              },
            },
          },
        },
      },
    });

    expect(() => validateConfig(rootConfig, registry)).not.toThrow();
  });
});
