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
import { InputError } from '@backstage/errors';
import {
  aggregationTypes,
  scalarAggregationTypes,
  ScorecardThresholdRuleColors,
} from '@red-hat-developer-hub/backstage-plugin-scorecard-common';
import { validateAggregationConfig } from './validateAggregationConfig';
import {
  MockBooleanProvider,
  MockNumberProvider,
} from '../../__fixtures__/mockProviders';
import { AGGREGATION_KPIS_CONFIG_PATH } from '../constants';
import {
  buildMockMetricProvidersRegistry,
  mockMetricProvidersRegistry,
} from '../../__fixtures__/mockMetricProvidersRegistry';

const validWeightedThresholds = {
  rules: [
    {
      key: 'success',
      expression: '>=75',
      color: ScorecardThresholdRuleColors.SUCCESS,
    },
    {
      key: 'warning',
      expression: '10-75',
      color: ScorecardThresholdRuleColors.WARNING,
    },
    {
      key: 'error',
      expression: '<10',
      color: ScorecardThresholdRuleColors.ERROR,
    },
  ],
};

const gapThresholds = {
  rules: [
    {
      key: 'success',
      expression: '<10',
      color: ScorecardThresholdRuleColors.SUCCESS,
    },
    {
      key: 'error',
      expression: '>20',
      color: ScorecardThresholdRuleColors.ERROR,
    },
  ],
};

describe('validateAggregationConfig', () => {
  const numberRegistry = buildMockMetricProvidersRegistry({
    provider: new MockNumberProvider('github.open_prs', 'github'),
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should not throw error when scorecard.aggregationKPIs is absent', () => {
    expect(() =>
      validateAggregationConfig({
        rootConfig: mockServices.rootConfig({ data: {} }),
        registry: mockMetricProvidersRegistry,
      }),
    ).not.toThrow();
  });

  it('should not throw when all KPI entries are valid and metrics are registered', () => {
    const rootConfig = mockServices.rootConfig({
      data: {
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
      },
    });

    expect(() =>
      validateAggregationConfig({ rootConfig, registry: numberRegistry }),
    ).not.toThrow();
  });

  it('should throw InputError when a KPI entry fails schema validation', () => {
    const tooLong = 'a'.repeat(256);
    const rootConfig = mockServices.rootConfig({
      data: {
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
      },
    });

    expect(() =>
      validateAggregationConfig({ rootConfig, registry: numberRegistry }),
    ).toThrow(InputError);
  });

  it('should throw InputError when aggregation type is invalid', () => {
    const rootConfig = mockServices.rootConfig({
      data: {
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
      },
    });

    expect(() =>
      validateAggregationConfig({ rootConfig, registry: numberRegistry }),
    ).toThrow(InputError);
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
              metricId: 'github.open_prs',
            },
          },
        },
      },
    });

    expect(() =>
      validateAggregationConfig({
        rootConfig,
        registry: mockMetricProvidersRegistry,
      }),
    ).toThrow(
      new Error(
        `Metric provider with ID 'github.open_prs' is not registered (${AGGREGATION_KPIS_CONFIG_PATH}.openPrsKpi).`,
      ),
    );
  });

  it('should not throw when weightedStatusScore KPI has options.statusScores', () => {
    const rootConfig = mockServices.rootConfig({
      data: {
        scorecard: {
          aggregationKPIs: {
            openPrsWeightedKpi: {
              title: 'GitHub Open PRs (weighted health)',
              type: aggregationTypes.weightedStatusScore,
              description: 'Weighted health score for open PRs.',
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
      },
    });

    expect(() =>
      validateAggregationConfig({ rootConfig, registry: numberRegistry }),
    ).not.toThrow();
  });

  it('should throw InputError when type is weightedStatusScore but required options block is missing', () => {
    const rootConfig = mockServices.rootConfig({
      data: {
        scorecard: {
          aggregationKPIs: {
            weightedKpi: {
              title: 'Weighted status score KPI',
              type: aggregationTypes.weightedStatusScore,
              description: 'Weighted health score',
              metricId: 'github.open_prs',
            },
          },
        },
      },
    });

    expect(() =>
      validateAggregationConfig({ rootConfig, registry: numberRegistry }),
    ).toThrow(/options\.statusScores must contain at least one weight value/);
  });

  it('should throw InputError when type is weightedStatusScore but options.statusScores is empty', () => {
    const rootConfig = mockServices.rootConfig({
      data: {
        scorecard: {
          aggregationKPIs: {
            weightedKpi: {
              title: 'Weighted status score KPI',
              type: aggregationTypes.weightedStatusScore,
              description: 'Weighted health score',
              metricId: 'github.open_prs',
              options: { statusScores: {} },
            },
          },
        },
      },
    });

    expect(() =>
      validateAggregationConfig({ rootConfig, registry: numberRegistry }),
    ).toThrow(InputError);
  });

  it('should not throw when weightedStatusScore KPI includes optional thresholds', () => {
    const rootConfig = mockServices.rootConfig({
      data: {
        scorecard: {
          aggregationKPIs: {
            weightedKpi: {
              title: 'Weighted status score KPI',
              type: aggregationTypes.weightedStatusScore,
              description: 'Weighted health score',
              metricId: 'github.open_prs',
              options: {
                statusScores: { success: 100, warning: 50, error: 0 },
                thresholds: validWeightedThresholds,
              },
            },
          },
        },
      },
    });

    expect(() =>
      validateAggregationConfig({ rootConfig, registry: numberRegistry }),
    ).not.toThrow();
  });

  it('should throw when thresholds has an invalid expression', () => {
    const rootConfig = mockServices.rootConfig({
      data: {
        scorecard: {
          aggregationKPIs: {
            weightedKpi: {
              title: 'Weighted status score KPI',
              type: aggregationTypes.weightedStatusScore,
              description: 'Weighted health score',
              metricId: 'github.open_prs',
              options: {
                statusScores: { success: 100, warning: 50, error: 0 },
                thresholds: {
                  rules: [
                    {
                      key: 'success',
                      expression: '%%%invalid%%%',
                      color: ScorecardThresholdRuleColors.SUCCESS,
                    },
                  ],
                },
              },
            },
          },
        },
      },
    });

    expect(() =>
      validateAggregationConfig({ rootConfig, registry: numberRegistry }),
    ).toThrow(/Invalid thresholds configuration|Invalid threshold expression/);
  });

  it('should throw when weightedStatusScore KPI thresholds leave a gap on the number line', () => {
    const rootConfig = mockServices.rootConfig({
      data: {
        scorecard: {
          aggregationKPIs: {
            weightedKpi: {
              title: 'Weighted status score KPI',
              type: aggregationTypes.weightedStatusScore,
              description: 'Weighted health score',
              metricId: 'github.open_prs',
              options: {
                statusScores: { success: 100, warning: 50, error: 0 },
                thresholds: gapThresholds,
              },
            },
          },
        },
      },
    });

    expect(() =>
      validateAggregationConfig({ rootConfig, registry: numberRegistry }),
    ).toThrow(/do not cover the entire real line/);
  });

  it.each(scalarAggregationTypes)(
    'should not throw when scalar %s KPI is valid for a number metric',
    type => {
      const rootConfig = mockServices.rootConfig({
        data: {
          scorecard: {
            aggregationKPIs: {
              scalarKpi: {
                title: 'Scalar KPI',
                description: 'Scalar aggregation',
                type,
                metricId: 'github.open_prs',
              },
            },
          },
        },
      });

      expect(() =>
        validateAggregationConfig({ rootConfig, registry: numberRegistry }),
      ).not.toThrow();
    },
  );

  it.each(scalarAggregationTypes)(
    'should throw when scalar %s KPI targets a boolean metric',
    type => {
      const registry = buildMockMetricProvidersRegistry({
        provider: new MockBooleanProvider('jira.license', 'jira'),
      });

      const rootConfig = mockServices.rootConfig({
        data: {
          scorecard: {
            aggregationKPIs: {
              badScalarKpi: {
                title: 'Bad scalar',
                description: 'Scalar on boolean metric',
                type,
                metricId: 'jira.license',
              },
            },
          },
        },
      });

      expect(() => validateAggregationConfig({ rootConfig, registry })).toThrow(
        /requires a number metric/,
      );
    },
  );

  it('should throw when scalar KPI thresholds leave a gap on the real line', () => {
    const rootConfig = mockServices.rootConfig({
      data: {
        scorecard: {
          aggregationKPIs: {
            badScalarKpi: {
              title: 'Bad scalar',
              description: 'Scalar with gap thresholds',
              type: aggregationTypes.sum,
              metricId: 'github.open_prs',
              options: {
                thresholds: gapThresholds,
              },
            },
          },
        },
      },
    });

    expect(() =>
      validateAggregationConfig({ rootConfig, registry: numberRegistry }),
    ).toThrow(/do not cover the entire real line/);
  });
});
