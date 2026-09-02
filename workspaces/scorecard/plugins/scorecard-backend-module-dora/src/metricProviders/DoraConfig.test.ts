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
import { daysToMilliseconds } from '@red-hat-developer-hub/backstage-plugin-scorecard-node';
import {
  DORA_DEFAULT_DATA_RETENTION_DAYS,
  DORA_DEFAULT_DEPLOYMENT_LOOKBACK_MS,
  DORA_DEFAULT_DEPLOYMENT_PULL_REQUESTS_COLLECTOR_ID,
  DORA_DEFAULT_DEPLOYMENTS_COLLECTOR_ID,
  DORA_DEFAULT_INCIDENTS_COLLECTOR_ID,
  DORA_DEFAULT_PRODUCTION_ENVIRONMENTS,
  DORA_DEFAULT_STALE_AFTER_MS,
  DORA_TIME_WINDOW_DAYS,
} from '../constants';
import {
  parseCollectorConfig,
  parseDoraChangeFailureRateConfig,
  parseDoraDataRetentionDays,
  parseDoraDeploymentFrequencyConfig,
  parseDoraMeanTimeToRestoreConfig,
  parseDoraMedianLeadTimeForChangesConfig,
  parseDoraSyncConfig,
} from './DoraConfig';
import { collectorInputHash } from '../service/collectorHash';

describe('DoraConfig', () => {
  describe('parseCollectorConfig', () => {
    const exampleCollectorConfigPath = 'collectors.test';
    const exampleCollectorId = DORA_DEFAULT_DEPLOYMENTS_COLLECTOR_ID;

    it('returns defaults when unset', () => {
      expect(
        parseCollectorConfig(
          mockServices.rootConfig({ data: {} }),
          exampleCollectorConfigPath,
          exampleCollectorId,
        ),
      ).toEqual({
        id: exampleCollectorId,
        input: {},
        inputHash: collectorInputHash({}),
      });
    });

    it('parses id and input', () => {
      expect(
        parseCollectorConfig(
          mockServices.rootConfig({
            data: {
              collectors: {
                test: {
                  id: 'custom:deployments',
                  input: { workflowName: 'Deploy' },
                },
              },
            },
          }),
          exampleCollectorConfigPath,
          exampleCollectorId,
        ),
      ).toEqual({
        id: 'custom:deployments',
        input: { workflowName: 'Deploy' },
        inputHash: collectorInputHash({ workflowName: 'Deploy' }),
      });
    });

    it.each([
      ['a string', 'Deploy'],
      ['a number', 1],
      ['a boolean', true],
      ['an array', ['Deploy']],
    ])('throws when collector input is invalid: %s', (_name, input) => {
      expect(() =>
        parseCollectorConfig(
          mockServices.rootConfig({
            data: {
              collectors: {
                test: { input },
              },
            },
          }),
          exampleCollectorConfigPath,
          exampleCollectorId,
        ),
      ).toThrow(
        /Invalid type in config for key 'collectors\.test\.input' in 'mock-config', got .+, wanted object/,
      );
    });
  });

  describe('parseDoraDeploymentFrequencyConfig', () => {
    it('returns defaults when unset', () => {
      expect(
        parseDoraDeploymentFrequencyConfig(
          mockServices.rootConfig({
            data: {},
          }),
        ),
      ).toEqual({
        deploymentsCollector: {
          id: DORA_DEFAULT_DEPLOYMENTS_COLLECTOR_ID,
          input: {},
          inputHash: collectorInputHash({}),
        },
        productionEnvironments: DORA_DEFAULT_PRODUCTION_ENVIRONMENTS,
      });
    });

    it('parses collectors and productionEnvironments', () => {
      expect(
        parseDoraDeploymentFrequencyConfig(
          mockServices.rootConfig({
            data: {
              scorecard: {
                metricProviders: {
                  dora: {
                    deploymentFrequency: {
                      options: {
                        productionEnvironments: ['prod', 'live'],
                        collectors: {
                          deployments: {
                            id: 'custom:deployments',
                            input: { workflowName: 'Deploy' },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          }),
        ),
      ).toEqual({
        deploymentsCollector: {
          id: 'custom:deployments',
          input: { workflowName: 'Deploy' },
          inputHash: collectorInputHash({ workflowName: 'Deploy' }),
        },
        productionEnvironments: ['prod', 'live'],
      });
    });

    it('falls back to default productionEnvironments when empty', () => {
      expect(
        parseDoraDeploymentFrequencyConfig(
          mockServices.rootConfig({
            data: {
              scorecard: {
                metricProviders: {
                  dora: {
                    deploymentFrequency: {
                      options: {
                        productionEnvironments: [],
                      },
                    },
                  },
                },
              },
            },
          }),
        ).productionEnvironments,
      ).toEqual(DORA_DEFAULT_PRODUCTION_ENVIRONMENTS);
    });
  });

  describe('parseDoraMedianLeadTimeForChangesConfig', () => {
    it('returns defaults when unset', () => {
      expect(
        parseDoraMedianLeadTimeForChangesConfig(
          mockServices.rootConfig({
            data: {},
          }),
        ),
      ).toEqual({
        deploymentsCollector: {
          id: DORA_DEFAULT_DEPLOYMENTS_COLLECTOR_ID,
          input: {},
          inputHash: collectorInputHash({}),
        },
        deploymentPullRequestsCollector: {
          id: DORA_DEFAULT_DEPLOYMENT_PULL_REQUESTS_COLLECTOR_ID,
          input: {},
          inputHash: collectorInputHash({}),
        },
        productionEnvironments: DORA_DEFAULT_PRODUCTION_ENVIRONMENTS,
      });
    });

    it('parses collectors and productionEnvironments', () => {
      expect(
        parseDoraMedianLeadTimeForChangesConfig(
          mockServices.rootConfig({
            data: {
              scorecard: {
                metricProviders: {
                  dora: {
                    medianLeadTimeForChanges: {
                      options: {
                        productionEnvironments: ['prod'],
                        collectors: {
                          deployments: {
                            id: 'custom:deployments',
                            input: { flag: true },
                          },
                          deploymentPullRequests: {
                            id: 'custom:deployment-prs',
                            input: { label: 'prs' },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          }),
        ),
      ).toEqual({
        deploymentsCollector: {
          id: 'custom:deployments',
          input: { flag: true },
          inputHash: collectorInputHash({ flag: true }),
        },
        deploymentPullRequestsCollector: {
          id: 'custom:deployment-prs',
          input: { label: 'prs' },
          inputHash: collectorInputHash({ label: 'prs' }),
        },
        productionEnvironments: ['prod'],
      });
    });
  });

  describe('parseDoraMeanTimeToRestoreConfig', () => {
    it('returns defaults when unset', () => {
      expect(
        parseDoraMeanTimeToRestoreConfig(
          mockServices.rootConfig({
            data: {},
          }),
        ),
      ).toEqual({
        incidentsCollector: {
          id: DORA_DEFAULT_INCIDENTS_COLLECTOR_ID,
          input: {},
          inputHash: collectorInputHash({}),
        },
      });
    });

    it('parses incidents collector', () => {
      expect(
        parseDoraMeanTimeToRestoreConfig(
          mockServices.rootConfig({
            data: {
              scorecard: {
                metricProviders: {
                  dora: {
                    meanTimeToRestore: {
                      options: {
                        collectors: {
                          incidents: {
                            id: 'custom:incidents',
                            input: { project: 'OPS' },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          }),
        ),
      ).toEqual({
        incidentsCollector: {
          id: 'custom:incidents',
          input: { project: 'OPS' },
          inputHash: collectorInputHash({ project: 'OPS' }),
        },
      });
    });
  });

  describe('parseDoraChangeFailureRateConfig', () => {
    it('returns defaults when unset', () => {
      expect(
        parseDoraChangeFailureRateConfig(
          mockServices.rootConfig({
            data: {},
          }),
        ),
      ).toEqual({
        deploymentsCollector: {
          id: DORA_DEFAULT_DEPLOYMENTS_COLLECTOR_ID,
          input: {},
          inputHash: collectorInputHash({}),
        },
        incidentsCollector: {
          id: DORA_DEFAULT_INCIDENTS_COLLECTOR_ID,
          input: {},
          inputHash: collectorInputHash({}),
        },
        productionEnvironments: DORA_DEFAULT_PRODUCTION_ENVIRONMENTS,
      });
    });

    it('parses collectors and productionEnvironments', () => {
      expect(
        parseDoraChangeFailureRateConfig(
          mockServices.rootConfig({
            data: {
              scorecard: {
                metricProviders: {
                  dora: {
                    changeFailureRate: {
                      options: {
                        productionEnvironments: ['prod', 'live'],
                        collectors: {
                          deployments: {
                            id: 'custom:deployments',
                            input: { workflowName: 'Deploy' },
                          },
                          incidents: {
                            id: 'custom:incidents',
                            input: { project: 'OPS' },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          }),
        ),
      ).toEqual({
        deploymentsCollector: {
          id: 'custom:deployments',
          input: { workflowName: 'Deploy' },
          inputHash: collectorInputHash({ workflowName: 'Deploy' }),
        },
        incidentsCollector: {
          id: 'custom:incidents',
          input: { project: 'OPS' },
          inputHash: collectorInputHash({ project: 'OPS' }),
        },
        productionEnvironments: ['prod', 'live'],
      });
    });
  });

  describe('parseDoraDataRetentionDays', () => {
    it('returns the default when unset', () => {
      expect(
        parseDoraDataRetentionDays(
          mockServices.rootConfig({
            data: {},
          }),
        ),
      ).toBe(DORA_DEFAULT_DATA_RETENTION_DAYS);
    });

    it('returns the configured value', () => {
      expect(
        parseDoraDataRetentionDays(
          mockServices.rootConfig({
            data: {
              scorecard: {
                plugins: {
                  dora: {
                    dataRetentionDays: 90,
                  },
                },
              },
            },
          }),
        ),
      ).toBe(90);
    });

    it('throws when configured below the DORA metric window', () => {
      expect(() =>
        parseDoraDataRetentionDays(
          mockServices.rootConfig({
            data: {
              scorecard: {
                plugins: {
                  dora: {
                    dataRetentionDays: DORA_TIME_WINDOW_DAYS - 1,
                  },
                },
              },
            },
          }),
        ),
      ).toThrow(
        `scorecard.plugins.dora.dataRetentionDays must be greater than or equal to ${DORA_TIME_WINDOW_DAYS}`,
      );
    });

    it('allows retention equal to the DORA metric window', () => {
      expect(
        parseDoraDataRetentionDays(
          mockServices.rootConfig({
            data: {
              scorecard: {
                plugins: {
                  dora: {
                    dataRetentionDays: DORA_TIME_WINDOW_DAYS,
                  },
                },
              },
            },
          }),
        ),
      ).toBe(DORA_TIME_WINDOW_DAYS);
    });
  });

  describe('parseDoraSyncConfig', () => {
    it('returns defaults when unset', () => {
      expect(
        parseDoraSyncConfig(
          mockServices.rootConfig({
            data: {},
          }),
        ),
      ).toEqual({
        staleAfterMs: DORA_DEFAULT_STALE_AFTER_MS,
        deploymentLookbackMs: DORA_DEFAULT_DEPLOYMENT_LOOKBACK_MS,
      });
    });

    it('returns configured sync options', () => {
      expect(
        parseDoraSyncConfig(
          mockServices.rootConfig({
            data: {
              scorecard: {
                plugins: {
                  dora: {
                    staleAfterMs: 60000,
                    deploymentLookbackMs: 86_400_000,
                  },
                },
              },
            },
          }),
        ),
      ).toEqual({
        staleAfterMs: 60000,
        deploymentLookbackMs: 86_400_000,
      });
    });

    it('allows staleAfterMs and deploymentLookbackMs of 0', () => {
      expect(
        parseDoraSyncConfig(
          mockServices.rootConfig({
            data: {
              scorecard: {
                plugins: {
                  dora: {
                    staleAfterMs: 0,
                    deploymentLookbackMs: 0,
                  },
                },
              },
            },
          }),
        ),
      ).toEqual({
        staleAfterMs: 0,
        deploymentLookbackMs: 0,
      });
    });

    it('throws when configured staleAfterMs is negative', () => {
      expect(() =>
        parseDoraSyncConfig(
          mockServices.rootConfig({
            data: {
              scorecard: {
                plugins: {
                  dora: {
                    staleAfterMs: -1,
                  },
                },
              },
            },
          }),
        ),
      ).toThrow(
        'scorecard.plugins.dora.staleAfterMs must be greater than or equal to 0',
      );
    });

    it('throws when configured deploymentLookbackMs is negative', () => {
      expect(() =>
        parseDoraSyncConfig(
          mockServices.rootConfig({
            data: {
              scorecard: {
                plugins: {
                  dora: {
                    deploymentLookbackMs: -1,
                  },
                },
              },
            },
          }),
        ),
      ).toThrow(
        'scorecard.plugins.dora.deploymentLookbackMs must be greater than or equal to 0',
      );
    });

    it('allows deploymentLookbackMs equal to the time window', () => {
      expect(
        parseDoraSyncConfig(
          mockServices.rootConfig({
            data: {
              scorecard: {
                plugins: {
                  dora: {
                    deploymentLookbackMs: daysToMilliseconds(
                      DORA_TIME_WINDOW_DAYS,
                    ),
                  },
                },
              },
            },
          }),
        ).deploymentLookbackMs,
      ).toBe(daysToMilliseconds(DORA_TIME_WINDOW_DAYS));
    });

    it('throws when configured deploymentLookbackMs is greater than the time window', () => {
      expect(() =>
        parseDoraSyncConfig(
          mockServices.rootConfig({
            data: {
              scorecard: {
                plugins: {
                  dora: {
                    deploymentLookbackMs:
                      daysToMilliseconds(DORA_TIME_WINDOW_DAYS) + 1,
                  },
                },
              },
            },
          }),
        ),
      ).toThrow(
        `scorecard.plugins.dora.deploymentLookbackMs must be less than or equal to the DORA metric computation window (${DORA_TIME_WINDOW_DAYS} days)`,
      );
    });
  });
});
