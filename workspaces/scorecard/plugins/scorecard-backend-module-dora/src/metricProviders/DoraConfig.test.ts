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
  DORA_DEFAULT_INCIDENT_LOOKBACK_MS,
  DORA_DEFAULT_INCIDENTS_COLLECTOR_ID,
  DORA_DEFAULT_PRODUCTION_ENVIRONMENTS,
  DORA_DEFAULT_STALE_AFTER_MS,
  DORA_PLUGIN_CONFIG_PATH,
  DORA_TIME_WINDOW_DAYS,
} from '../constants';
import {
  parseCollectorConfig,
  parseDoraChangeFailureRateConfig,
  parseDoraDataRetentionDays,
  parseDoraDeploymentFrequencyConfig,
  parseDoraMedianLeadTimeForChangesConfig,
  parseDoraMedianTimeToRestoreConfig,
  parseDoraSharedProviderConfig,
  parseDoraSyncConfig,
} from './DoraConfig';
import { collectorInputHash } from '../service/collectorHash';
import { EMPTY_INPUT_HASH } from '../database/__fixtures__';

describe('DoraConfig', () => {
  const customDoraPluginConfig = {
    scorecard: {
      plugins: {
        dora: {
          productionEnvironments: ['prod', 'live'],
          collectors: {
            deployments: {
              id: 'custom:deployments',
              input: { workflowName: 'Deploy' },
            },
            deploymentPullRequests: {
              id: 'custom:deploymentPrs',
              input: { label: 'prs' },
            },
            incidents: {
              id: 'custom:incidents',
              input: { project: 'OPS' },
            },
          },
        },
      },
    },
  };

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
        inputHash: EMPTY_INPUT_HASH,
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

    it('computes identity hash from input keys', () => {
      const input = {
        key1: 'value1',
        key2: 'value2',
        maxItems: 10000,
        example: ['a', 'b'],
      };

      expect(
        parseCollectorConfig(
          mockServices.rootConfig({
            data: {
              collectors: {
                test: { id: 'custom:deployments', input },
              },
            },
          }),
          exampleCollectorConfigPath,
          exampleCollectorId,
        ),
      ).toEqual({
        id: 'custom:deployments',
        input,
        inputHash: collectorInputHash(input),
      });
    });
  });

  describe('parseDoraSharedProviderConfig', () => {
    it('returns defaults when unset', () => {
      expect(
        parseDoraSharedProviderConfig(
          mockServices.rootConfig({
            data: {},
          }),
        ),
      ).toEqual({
        deploymentsCollector: {
          id: DORA_DEFAULT_DEPLOYMENTS_COLLECTOR_ID,
          input: {},
          inputHash: EMPTY_INPUT_HASH,
        },
        incidentsCollector: {
          id: DORA_DEFAULT_INCIDENTS_COLLECTOR_ID,
          input: {},
          inputHash: EMPTY_INPUT_HASH,
        },
        deploymentPullRequestsCollector: {
          id: DORA_DEFAULT_DEPLOYMENT_PULL_REQUESTS_COLLECTOR_ID,
          input: {},
          inputHash: EMPTY_INPUT_HASH,
        },
        productionEnvironments: DORA_DEFAULT_PRODUCTION_ENVIRONMENTS,
      });
    });

    it(`parses collectors and productionEnvironments from ${DORA_PLUGIN_CONFIG_PATH}`, () => {
      expect(
        parseDoraSharedProviderConfig(
          mockServices.rootConfig({
            data: customDoraPluginConfig,
          }),
        ),
      ).toEqual({
        deploymentsCollector: {
          id: 'custom:deployments',
          input: { workflowName: 'Deploy' },
          inputHash: collectorInputHash({ workflowName: 'Deploy' }),
        },
        deploymentPullRequestsCollector: {
          id: 'custom:deploymentPrs',
          input: { label: 'prs' },
          inputHash: collectorInputHash({ label: 'prs' }),
        },
        incidentsCollector: {
          id: 'custom:incidents',
          input: { project: 'OPS' },
          inputHash: collectorInputHash({ project: 'OPS' }),
        },
        productionEnvironments: ['prod', 'live'],
      });
    });

    it('falls back to default productionEnvironments when empty', () => {
      expect(
        parseDoraSharedProviderConfig(
          mockServices.rootConfig({
            data: {
              scorecard: {
                plugins: {
                  dora: {
                    productionEnvironments: [],
                  },
                },
              },
            },
          }),
        ).productionEnvironments,
      ).toEqual(DORA_DEFAULT_PRODUCTION_ENVIRONMENTS);
    });
  });

  describe('parseDoraDeploymentFrequencyConfig', () => {
    it('parses deployment frequency config', () => {
      expect(
        parseDoraDeploymentFrequencyConfig(
          mockServices.rootConfig({
            data: customDoraPluginConfig,
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
  });

  describe('parseDoraMedianLeadTimeForChangesConfig', () => {
    it('parses median lead time for changes config', () => {
      expect(
        parseDoraMedianLeadTimeForChangesConfig(
          mockServices.rootConfig({
            data: customDoraPluginConfig,
          }),
        ),
      ).toEqual({
        deploymentsCollector: {
          id: 'custom:deployments',
          input: { workflowName: 'Deploy' },
          inputHash: collectorInputHash({ workflowName: 'Deploy' }),
        },
        deploymentPullRequestsCollector: {
          id: 'custom:deploymentPrs',
          input: { label: 'prs' },
          inputHash: collectorInputHash({ label: 'prs' }),
        },
        productionEnvironments: ['prod', 'live'],
      });
    });
  });

  describe('parseDoraMedianTimeToRestoreConfig', () => {
    it('parses median time to restore config', () => {
      expect(
        parseDoraMedianTimeToRestoreConfig(
          mockServices.rootConfig({
            data: customDoraPluginConfig,
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
    it('parses change failure rate config', () => {
      expect(
        parseDoraChangeFailureRateConfig(
          mockServices.rootConfig({
            data: customDoraPluginConfig,
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
        `${DORA_PLUGIN_CONFIG_PATH}.dataRetentionDays must be greater than or equal to ${DORA_TIME_WINDOW_DAYS}`,
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
        incidentLookbackMs: DORA_DEFAULT_INCIDENT_LOOKBACK_MS,
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
                    incidentLookbackMs: 600_000,
                  },
                },
              },
            },
          }),
        ),
      ).toEqual({
        staleAfterMs: 60000,
        deploymentLookbackMs: 86_400_000,
        incidentLookbackMs: 600_000,
      });
    });

    it('allows staleAfterMs, deploymentLookbackMs and incidentLookbackMs of 0', () => {
      expect(
        parseDoraSyncConfig(
          mockServices.rootConfig({
            data: {
              scorecard: {
                plugins: {
                  dora: {
                    staleAfterMs: 0,
                    deploymentLookbackMs: 0,
                    incidentLookbackMs: 0,
                  },
                },
              },
            },
          }),
        ),
      ).toEqual({
        staleAfterMs: 0,
        deploymentLookbackMs: 0,
        incidentLookbackMs: 0,
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
        `${DORA_PLUGIN_CONFIG_PATH}.staleAfterMs must be greater than or equal to 0`,
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
        `${DORA_PLUGIN_CONFIG_PATH}.deploymentLookbackMs must be greater than or equal to 0`,
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
        `${DORA_PLUGIN_CONFIG_PATH}.deploymentLookbackMs must be less than or equal to the DORA metric computation window (${DORA_TIME_WINDOW_DAYS} days)`,
      );
    });

    it('throws when configured incidentLookbackMs is negative', () => {
      expect(() =>
        parseDoraSyncConfig(
          mockServices.rootConfig({
            data: {
              scorecard: {
                plugins: {
                  dora: {
                    incidentLookbackMs: -1,
                  },
                },
              },
            },
          }),
        ),
      ).toThrow(
        `${DORA_PLUGIN_CONFIG_PATH}.incidentLookbackMs must be greater than or equal to 0`,
      );
    });

    it('allows incidentLookbackMs equal to the time window', () => {
      expect(
        parseDoraSyncConfig(
          mockServices.rootConfig({
            data: {
              scorecard: {
                plugins: {
                  dora: {
                    incidentLookbackMs: daysToMilliseconds(
                      DORA_TIME_WINDOW_DAYS,
                    ),
                  },
                },
              },
            },
          }),
        ).incidentLookbackMs,
      ).toBe(daysToMilliseconds(DORA_TIME_WINDOW_DAYS));
    });

    it('throws when configured incidentLookbackMs is greater than the time window', () => {
      expect(() =>
        parseDoraSyncConfig(
          mockServices.rootConfig({
            data: {
              scorecard: {
                plugins: {
                  dora: {
                    incidentLookbackMs:
                      daysToMilliseconds(DORA_TIME_WINDOW_DAYS) + 1,
                  },
                },
              },
            },
          }),
        ),
      ).toThrow(
        `${DORA_PLUGIN_CONFIG_PATH}.incidentLookbackMs must be less than or equal to the DORA metric computation window (${DORA_TIME_WINDOW_DAYS} days)`,
      );
    });
  });
});
