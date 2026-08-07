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
import {
  MockNumberProvider,
  MockBatchBooleanProvider,
} from '../../__fixtures__/mockProviders';
import { MockEntityBuilder } from '../../__fixtures__/mockEntityBuilder';
import { ThresholdResolver } from './ThresholdResolver';

describe('ThresholdResolver', () => {
  const customThresholds = {
    scorecard: {
      metricProviders: {
        github: {
          numberMetric: {
            metrics: {
              numberMetric: {
                thresholds: {
                  rules: [
                    { key: 'error', expression: '>100' },
                    { key: 'warning', expression: '>50' },
                    { key: 'success', expression: '<=50' },
                  ],
                },
              },
            },
          },
        },
      },
    },
  };

  it('uses default provider thresholds when no custom thresholds', () => {
    const provider = new MockNumberProvider('github.numberMetric', 'github');
    const resolver = new ThresholdResolver(
      new ConfigReader({
        scorecard: {
          metricProviders: {
            github: {
              otherMetric: {
                metrics: {
                  otherMetric: {
                    thresholds: {
                      rules: [
                        { key: 'error', expression: '>100' },
                        { key: 'warning', expression: '>50' },
                        { key: 'success', expression: '<=50' },
                      ],
                    },
                  },
                },
              },
            },
          },
        },
      }),
      [provider, new MockNumberProvider('github.otherMetric', 'github')],
    );

    expect(resolver.resolveMetricThresholds(provider.getMetrics()[0])).toEqual({
      rules: [
        { key: 'error', expression: '>40' },
        { key: 'warning', expression: '>20' },
        { key: 'success', expression: '<=20' },
      ],
    });
  });

  it('uses configured provider-level thresholds when configured metric thresholds are absent', () => {
    const provider = new MockNumberProvider('github.numberMetric', 'github');
    const resolver = new ThresholdResolver(
      new ConfigReader({
        scorecard: {
          metricProviders: {
            github: {
              numberMetric: {
                thresholds: {
                  rules: [
                    { key: 'error', expression: '>100' },
                    { key: 'warning', expression: '>50' },
                    { key: 'success', expression: '<=50' },
                  ],
                },
              },
            },
          },
        },
      }),
      [provider],
    );

    expect(resolver.resolveMetricThresholds(provider.getMetrics()[0])).toEqual({
      rules: [
        { key: 'error', expression: '>100' },
        { key: 'warning', expression: '>50' },
        { key: 'success', expression: '<=50' },
      ],
    });
  });

  it('uses configured metric-level thresholds over configured provider-level thresholds', () => {
    const provider = new MockNumberProvider('github.numberMetric', 'github');
    const resolver = new ThresholdResolver(
      new ConfigReader({
        scorecard: {
          metricProviders: {
            github: {
              numberMetric: {
                thresholds: {
                  rules: [
                    { key: 'error', expression: '>150' },
                    { key: 'warning', expression: '>75' },
                    { key: 'success', expression: '<=75' },
                  ],
                },
                metrics: {
                  numberMetric: {
                    thresholds: {
                      rules: [
                        { key: 'error', expression: '>100' },
                        { key: 'warning', expression: '>50' },
                        { key: 'success', expression: '<=50' },
                      ],
                    },
                  },
                },
              },
            },
          },
        },
      }),
      [provider],
    );

    expect(resolver.resolveMetricThresholds(provider.getMetrics()[0])).toEqual({
      rules: [
        { key: 'error', expression: '>100' },
        { key: 'warning', expression: '>50' },
        { key: 'success', expression: '<=50' },
      ],
    });
  });

  it('uses configured thresholds per metric for batch providers', () => {
    const provider = new MockBatchBooleanProvider(
      'filecheck',
      'filecheck.fileExistence',
      [
        { id: 'readme', path: 'README.md' },
        { id: 'license', path: 'LICENSE' },
      ],
    );
    const resolver = new ThresholdResolver(
      new ConfigReader({
        scorecard: {
          metricProviders: {
            filecheck: {
              fileExistence: {
                metrics: {
                  readme: {
                    thresholds: {
                      rules: [
                        {
                          key: 'present',
                          expression: '==true',
                          color: 'success.main',
                          icon: 'scorecardSuccessStatusIcon',
                        },
                        {
                          key: 'absent',
                          expression: '==false',
                          color: 'error.main',
                          icon: 'scorecardErrorStatusIcon',
                        },
                      ],
                    },
                  },
                },
              },
            },
          },
        },
      }),
      [provider],
    );

    expect(resolver.resolveMetricThresholds(provider.getMetrics()[0])).toEqual({
      rules: [
        {
          key: 'present',
          expression: '==true',
          color: 'success.main',
          icon: 'scorecardSuccessStatusIcon',
        },
        {
          key: 'absent',
          expression: '==false',
          color: 'error.main',
          icon: 'scorecardErrorStatusIcon',
        },
      ],
    });

    // license has no config override — falls back to metric defaults
    expect(resolver.resolveMetricThresholds(provider.getMetrics()[1])).toEqual({
      rules: [
        { key: 'success', expression: '==true' },
        { key: 'error', expression: '==false' },
      ],
    });
  });

  it('merges entity annotation overrides on top of default provider thresholds', () => {
    const provider = new MockNumberProvider('github.numberMetric', 'github');
    const resolver = new ThresholdResolver(new ConfigReader({}), [provider]);
    const entity = new MockEntityBuilder()
      .withAnnotations({
        'scorecard.io/github.numberMetric.thresholds.rules.warning': '>10',
        'scorecard.io/github.numberMetric.thresholds.rules.success': '<=10',
      })
      .build();

    expect(
      resolver.resolveEntityThresholds(entity, provider.getMetrics()[0]),
    ).toEqual({
      rules: [
        { key: 'error', expression: '>40' },
        { key: 'warning', expression: '>10' },
        { key: 'success', expression: '<=10' },
      ],
    });
  });

  it('merges entity annotation overrides on top of default provider thresholds when provider is unexpectedly not loaded on startup', () => {
    const provider = new MockNumberProvider('github.numberMetric', 'github');
    const resolver = new ThresholdResolver(new ConfigReader({}), []);
    const entity = new MockEntityBuilder()
      .withAnnotations({
        'scorecard.io/github.numberMetric.thresholds.rules.warning': '>10',
        'scorecard.io/github.numberMetric.thresholds.rules.success': '<=10',
      })
      .build();

    expect(
      resolver.resolveEntityThresholds(entity, provider.getMetrics()[0]),
    ).toEqual({
      rules: [
        { key: 'error', expression: '>40' },
        { key: 'warning', expression: '>10' },
        { key: 'success', expression: '<=10' },
      ],
    });
  });

  it('merges entity annotation overrides on top of custom provider thresholds', () => {
    const provider = new MockNumberProvider('github.numberMetric', 'github');
    const resolver = new ThresholdResolver(new ConfigReader(customThresholds), [
      provider,
    ]);
    const entity = new MockEntityBuilder()
      .withAnnotations({
        'scorecard.io/github.numberMetric.thresholds.rules.warning': '>10',
        'scorecard.io/github.numberMetric.thresholds.rules.success': '<=10',
      })
      .build();

    expect(
      resolver.resolveEntityThresholds(entity, provider.getMetrics()[0]),
    ).toEqual({
      rules: [
        { key: 'error', expression: '>100' },
        { key: 'warning', expression: '>10' },
        { key: 'success', expression: '<=10' },
      ],
    });
  });

  it('loads configured thresholds once at startup', () => {
    const config = new ConfigReader({
      scorecard: {
        metricProviders: {
          github: {
            numberMetric: {
              metrics: {
                numberMetric: {
                  thresholds: {
                    rules: [
                      { key: 'error', expression: '>100' },
                      { key: 'warning', expression: '>50' },
                      { key: 'success', expression: '<=50' },
                    ],
                  },
                },
              },
            },
          },
        },
      },
    });
    const getOptionalSpy = jest.spyOn(config, 'getOptional');
    const provider = new MockNumberProvider('github.numberMetric', 'github');
    const resolver = new ThresholdResolver(config, [provider]);

    resolver.resolveMetricThresholds(provider.getMetrics()[0]);
    resolver.resolveMetricThresholds(provider.getMetrics()[0]);

    expect(getOptionalSpy).toHaveBeenCalledTimes(1);
  });

  it('validates configured thresholds at startup', () => {
    const config = new ConfigReader({
      scorecard: {
        metricProviders: {
          github: {
            numberMetric: {
              thresholds: {
                rules: [{ key: 'error', expression: 'INVALID' }],
              },
            },
          },
        },
      },
    });
    const provider = new MockNumberProvider('github.numberMetric', 'github');

    expect(() => new ThresholdResolver(config, [provider])).toThrow(
      'Invalid thresholds configuration at scorecard.metricProviders.github.numberMetric.thresholds',
    );
  });
});
