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
  getDatasourceScheduleConfigPath,
  getDatasourceThresholdsConfigPath,
  getMetricLocalConfigKey,
  getMetricThresholdsConfigPath,
  getProviderLocalConfigKey,
  getProviderScheduleConfigPath,
  getProviderThresholdsConfigPath,
  resolveScheduleFromConfig,
  resolveThresholdsConfigPath,
} from './metricProviderConfigKeys';

describe('metricProviderConfigKeys', () => {
  describe('getProviderLocalConfigKey', () => {
    it('returns datasource when provider ID equals datasource', () => {
      expect(getProviderLocalConfigKey('filecheck', 'filecheck')).toBe(
        'filecheck',
      );
    });

    it('returns local name for prefixed provider ID', () => {
      expect(getProviderLocalConfigKey('jira.openIssues', 'jira')).toBe(
        'openIssues',
      );
    });
  });

  describe('getMetricLocalConfigKey', () => {
    it('returns local name for prefixed metric ID', () => {
      expect(getMetricLocalConfigKey('filecheck.readme', 'filecheck')).toBe(
        'readme',
      );
    });
  });

  describe('threshold config paths', () => {
    it('builds datasource-level path', () => {
      expect(getDatasourceThresholdsConfigPath('github')).toBe(
        'scorecard.plugins.github.thresholds',
      );
    });

    it('builds provider-level path', () => {
      expect(getProviderThresholdsConfigPath('github', 'github.openPRs')).toBe(
        'scorecard.plugins.github.metricProviders.openPRs.thresholds',
      );
      expect(getProviderThresholdsConfigPath('filecheck', 'filecheck')).toBe(
        'scorecard.plugins.filecheck.metricProviders.filecheck.thresholds',
      );
    });

    it('builds metric-level path for single-metric provider', () => {
      expect(
        getMetricThresholdsConfigPath(
          'github',
          'github.openPRs',
          'github.openPRs',
        ),
      ).toBe(
        'scorecard.plugins.github.metricProviders.openPRs.metrics.openPRs.thresholds',
      );
    });

    it('builds metric-level path for batch provider', () => {
      expect(
        getMetricThresholdsConfigPath(
          'filecheck',
          'filecheck',
          'filecheck.readme',
        ),
      ).toBe(
        'scorecard.plugins.filecheck.metricProviders.filecheck.metrics.readme.thresholds',
      );
    });
  });

  describe('schedule config paths', () => {
    it('builds datasource- and provider-level schedule paths', () => {
      expect(getDatasourceScheduleConfigPath('github')).toBe(
        'scorecard.plugins.github.schedule',
      );
      expect(getProviderScheduleConfigPath('github', 'github.openPRs')).toBe(
        'scorecard.plugins.github.metricProviders.openPRs.schedule',
      );
    });

    it('prefers provider schedule when present', () => {
      const config = new ConfigReader({
        scorecard: {
          plugins: {
            github: {
              schedule: {
                frequency: { hours: 1 },
                timeout: { minutes: 15 },
              },
              metricProviders: {
                openPRs: {
                  schedule: {
                    frequency: { hours: 2 },
                    timeout: { minutes: 20 },
                  },
                },
              },
            },
          },
        },
      });

      expect(
        resolveScheduleFromConfig(config, 'github', 'github.openPRs'),
      ).toEqual({
        frequency: { hours: 2 },
        timeout: { minutes: 20 },
      });
    });

    it('falls back to datasource schedule when provider schedule is absent', () => {
      const config = new ConfigReader({
        scorecard: {
          plugins: {
            github: {
              schedule: {
                frequency: { hours: 1 },
                timeout: { minutes: 15 },
              },
            },
          },
        },
      });

      expect(
        resolveScheduleFromConfig(config, 'github', 'github.openPRs'),
      ).toEqual({
        frequency: { hours: 1 },
        timeout: { minutes: 15 },
      });
    });

    it('returns undefined when no schedule is configured', () => {
      expect(
        resolveScheduleFromConfig(
          new ConfigReader({}),
          'github',
          'github.openPRs',
        ),
      ).toBeUndefined();
    });
  });

  describe('resolveThresholdsConfigPath', () => {
    it('prefers metric over provider and datasource', () => {
      const config = new ConfigReader({
        scorecard: {
          plugins: {
            github: {
              thresholds: { rules: [] },
              metricProviders: {
                openPRs: {
                  thresholds: { rules: [] },
                  metrics: {
                    openPRs: {
                      thresholds: { rules: [] },
                    },
                  },
                },
              },
            },
          },
        },
      });

      expect(
        resolveThresholdsConfigPath(
          config,
          'github',
          'github.openPRs',
          'github.openPRs',
        ),
      ).toBe(
        'scorecard.plugins.github.metricProviders.openPRs.metrics.openPRs.thresholds',
      );
    });

    it('prefers provider over datasource when metric is absent', () => {
      const config = new ConfigReader({
        scorecard: {
          plugins: {
            github: {
              thresholds: { rules: [] },
              metricProviders: {
                openPRs: {
                  thresholds: { rules: [] },
                },
              },
            },
          },
        },
      });

      expect(
        resolveThresholdsConfigPath(
          config,
          'github',
          'github.openPRs',
          'github.openPRs',
        ),
      ).toBe('scorecard.plugins.github.metricProviders.openPRs.thresholds');
    });

    it('falls back to datasource when provider and metric are absent', () => {
      const config = new ConfigReader({
        scorecard: {
          plugins: {
            github: {
              thresholds: { rules: [] },
            },
          },
        },
      });

      expect(
        resolveThresholdsConfigPath(
          config,
          'github',
          'github.openPRs',
          'github.openPRs',
        ),
      ).toBe('scorecard.plugins.github.thresholds');
    });

    it('returns undefined when no thresholds are configured', () => {
      expect(
        resolveThresholdsConfigPath(
          new ConfigReader({}),
          'github',
          'github.openPRs',
          'github.openPRs',
        ),
      ).toBeUndefined();
    });
  });
});
