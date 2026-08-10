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
  DORA_DEFAULT_DEPLOYMENT_PULL_REQUESTS_COLLECTOR_ID,
  DORA_DEFAULT_DEPLOYMENTS_COLLECTOR_ID,
  DORA_DEFAULT_INCIDENTS_COLLECTOR_ID,
  DORA_DEFAULT_PRODUCTION_ENVIRONMENTS,
} from '../constants';
import {
  parseDoraChangeFailureRateConfig,
  parseDoraDeploymentFrequencyConfig,
  parseDoraMeanTimeToRestoreConfig,
  parseDoraMedianLeadTimeForChangesConfig,
} from './DoraConfig';

describe('DoraConfig', () => {
  describe('parseDoraDeploymentFrequencyConfig', () => {
    it('returns defaults when unset', () => {
      expect(parseDoraDeploymentFrequencyConfig(new ConfigReader({}))).toEqual({
        deploymentsCollector: {
          id: DORA_DEFAULT_DEPLOYMENTS_COLLECTOR_ID,
          input: {},
        },
        productionEnvironments: DORA_DEFAULT_PRODUCTION_ENVIRONMENTS,
      });
    });

    it('parses collectors and productionEnvironments', () => {
      expect(
        parseDoraDeploymentFrequencyConfig(
          new ConfigReader({
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
          }),
        ),
      ).toEqual({
        deploymentsCollector: {
          id: 'custom:deployments',
          input: { workflowName: 'Deploy' },
        },
        productionEnvironments: ['prod', 'live'],
      });
    });

    it('falls back to default productionEnvironments when empty', () => {
      expect(
        parseDoraDeploymentFrequencyConfig(
          new ConfigReader({
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
          }),
        ).productionEnvironments,
      ).toEqual(DORA_DEFAULT_PRODUCTION_ENVIRONMENTS);
    });
  });

  describe('parseDoraMedianLeadTimeForChangesConfig', () => {
    it('returns defaults when unset', () => {
      expect(
        parseDoraMedianLeadTimeForChangesConfig(new ConfigReader({})),
      ).toEqual({
        deploymentsCollector: {
          id: DORA_DEFAULT_DEPLOYMENTS_COLLECTOR_ID,
          input: {},
        },
        deploymentPullRequestsCollector: {
          id: DORA_DEFAULT_DEPLOYMENT_PULL_REQUESTS_COLLECTOR_ID,
          input: {},
        },
        productionEnvironments: DORA_DEFAULT_PRODUCTION_ENVIRONMENTS,
      });
    });

    it('parses collectors and productionEnvironments', () => {
      expect(
        parseDoraMedianLeadTimeForChangesConfig(
          new ConfigReader({
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
          }),
        ),
      ).toEqual({
        deploymentsCollector: {
          id: 'custom:deployments',
          input: { flag: true },
        },
        deploymentPullRequestsCollector: {
          id: 'custom:deployment-prs',
          input: { label: 'prs' },
        },
        productionEnvironments: ['prod'],
      });
    });
  });

  describe('parseDoraMeanTimeToRestoreConfig', () => {
    it('returns defaults when unset', () => {
      expect(parseDoraMeanTimeToRestoreConfig(new ConfigReader({}))).toEqual({
        incidentsCollector: {
          id: DORA_DEFAULT_INCIDENTS_COLLECTOR_ID,
          input: {},
        },
      });
    });

    it('parses incidents collector', () => {
      expect(
        parseDoraMeanTimeToRestoreConfig(
          new ConfigReader({
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
          }),
        ),
      ).toEqual({
        incidentsCollector: {
          id: 'custom:incidents',
          input: { project: 'OPS' },
        },
      });
    });
  });

  describe('parseDoraChangeFailureRateConfig', () => {
    it('returns defaults when unset', () => {
      expect(parseDoraChangeFailureRateConfig(new ConfigReader({}))).toEqual({
        deploymentsCollector: {
          id: DORA_DEFAULT_DEPLOYMENTS_COLLECTOR_ID,
          input: {},
        },
        incidentsCollector: {
          id: DORA_DEFAULT_INCIDENTS_COLLECTOR_ID,
          input: {},
        },
        productionEnvironments: DORA_DEFAULT_PRODUCTION_ENVIRONMENTS,
      });
    });

    it('parses collectors and productionEnvironments', () => {
      expect(
        parseDoraChangeFailureRateConfig(
          new ConfigReader({
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
          }),
        ),
      ).toEqual({
        deploymentsCollector: {
          id: 'custom:deployments',
          input: { workflowName: 'Deploy' },
        },
        incidentsCollector: {
          id: 'custom:incidents',
          input: { project: 'OPS' },
        },
        productionEnvironments: ['prod', 'live'],
      });
    });
  });
});
