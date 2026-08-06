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
    it('returns local name for prefixed provider ID', () => {
      expect(getProviderLocalConfigKey('jira.openIssues', 'jira')).toBe(
        'openIssues',
      );
      expect(
        getProviderLocalConfigKey('filecheck.fileExistence', 'filecheck'),
      ).toBe('fileExistence');
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
    it('builds provider-level path', () => {
      expect(getProviderThresholdsConfigPath('github', 'github.openPRs')).toBe(
        'scorecard.metricProviders.github.openPRs.thresholds',
      );
      expect(
        getProviderThresholdsConfigPath('filecheck', 'filecheck.fileExistence'),
      ).toBe('scorecard.metricProviders.filecheck.fileExistence.thresholds');
    });

    it('builds metric-level path for single-metric provider', () => {
      expect(
        getMetricThresholdsConfigPath(
          'github',
          'github.openPRs',
          'github.openPRs',
        ),
      ).toBe(
        'scorecard.metricProviders.github.openPRs.metrics.openPRs.thresholds',
      );
    });
  });

  describe('schedule config paths', () => {
    it('builds provider-level schedule path', () => {
      expect(getProviderScheduleConfigPath('github', 'github.openPRs')).toBe(
        'scorecard.metricProviders.github.openPRs.schedule',
      );
    });

    it('resolves provider schedule when present', () => {
      const config = new ConfigReader({
        scorecard: {
          metricProviders: {
            github: {
              openPRs: {
                schedule: {
                  frequency: { hours: 2 },
                  timeout: { minutes: 20 },
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
    it('prefers metric over provider', () => {
      const config = new ConfigReader({
        scorecard: {
          metricProviders: {
            github: {
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
      });

      expect(
        resolveThresholdsConfigPath(
          config,
          'github',
          'github.openPRs',
          'github.openPRs',
        ),
      ).toBe(
        'scorecard.metricProviders.github.openPRs.metrics.openPRs.thresholds',
      );
    });

    it('falls back to provider when metric is absent', () => {
      const config = new ConfigReader({
        scorecard: {
          metricProviders: {
            github: {
              openPRs: {
                thresholds: { rules: [] },
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
      ).toBe('scorecard.metricProviders.github.openPRs.thresholds');
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
