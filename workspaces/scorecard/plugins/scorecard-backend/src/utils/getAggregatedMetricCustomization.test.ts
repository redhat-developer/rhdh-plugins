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

import { InputError } from '@backstage/errors';
import { mockServices } from '@backstage/backend-test-utils';
import { getAggregatedMetricCustomization } from './getAggregatedMetricCustomization';

/**
 * Builds a root config with scorecard.plugins.<provider>.<metricName> set to pluginConfig.
 * metricId must be in form "provider.metricName" (e.g. "jira.open_issues").
 */
function buildConfig(pluginConfig: any, metricId: string) {
  const [provider, metricName] = metricId.split('.');
  return mockServices.rootConfig({
    data: {
      scorecard: {
        plugins: {
          [provider]: {
            [metricName]: pluginConfig,
          },
        },
      },
    },
  });
}

describe('getAggregatedMetricCustomization', () => {
  it('should return isCustomized false when aggregatedMetric is not configured', () => {
    const config = buildConfig({ thresholds: {} }, 'jira.open_issues');
    const result = getAggregatedMetricCustomization('jira.open_issues', {
      config,
    });

    expect(result).toEqual({
      title: '',
      description: '',
      isCustomized: false,
    });
  });

  it('should return customized object when title and description are set', () => {
    const config = buildConfig(
      {
        homepage: {
          aggregatedMetric: {
            title: 'My Jira issues',
            description: 'Custom description for Jira issues.',
          },
        },
      },
      'jira.open_issues',
    );
    const result = getAggregatedMetricCustomization('jira.open_issues', {
      config,
    });

    expect(result).toEqual({
      title: 'My Jira issues',
      description: 'Custom description for Jira issues.',
      isCustomized: true,
    });
  });

  it('should return customized object with trimmed whitespace from title and description', () => {
    const config = buildConfig(
      {
        homepage: {
          aggregatedMetric: {
            title: '  Open PRs  ',
            description: '  Open pull requests.  ',
          },
        },
      },
      'github.open_prs',
    );
    const result = getAggregatedMetricCustomization('github.open_prs', {
      config,
    });

    expect(result).toEqual({
      title: 'Open PRs',
      description: 'Open pull requests.',
      isCustomized: true,
    });
  });

  it('should return isCustomized false when metricId has no config', () => {
    const config = mockServices.rootConfig({ data: {} });
    const result = getAggregatedMetricCustomization('invalid.metric', {
      config,
    });

    expect(result).toEqual({
      title: '',
      description: '',
      isCustomized: false,
    });
  });

  it('should throw InputError when title is present but description is missing', () => {
    const config = buildConfig(
      { homepage: { aggregatedMetric: { title: 'Custom title' } } },
      'jira.open_issues',
    );

    expect(() =>
      getAggregatedMetricCustomization('jira.open_issues', { config }),
    ).toThrow(InputError);
    expect(() =>
      getAggregatedMetricCustomization('jira.open_issues', { config }),
    ).toThrow(/requires both title and description/);
  });

  it('should throw InputError when description is present but title is missing', () => {
    const config = buildConfig(
      { homepage: { aggregatedMetric: { description: 'Custom description' } } },
      'jira.open_issues',
    );

    expect(() =>
      getAggregatedMetricCustomization('jira.open_issues', { config }),
    ).toThrow(InputError);
    expect(() =>
      getAggregatedMetricCustomization('jira.open_issues', { config }),
    ).toThrow(/requires both title and description/);
  });

  it('should throw InputError when title is empty string after trim', () => {
    const config = buildConfig(
      {
        homepage: {
          aggregatedMetric: { title: '  ', description: 'Valid description' },
        },
      },
      'jira.open_issues',
    );

    expect(() =>
      getAggregatedMetricCustomization('jira.open_issues', { config }),
    ).toThrow(InputError);
    expect(() =>
      getAggregatedMetricCustomization('jira.open_issues', { config }),
    ).toThrow(/non-empty strings/);
  });

  it('should throw InputError when description is empty string after trim', () => {
    const config = buildConfig(
      {
        homepage: {
          aggregatedMetric: { title: 'Valid title', description: '' },
        },
      },
      'jira.open_issues',
    );

    expect(() =>
      getAggregatedMetricCustomization('jira.open_issues', { config }),
    ).toThrow(InputError);
    expect(() =>
      getAggregatedMetricCustomization('jira.open_issues', { config }),
    ).toThrow(/non-empty strings/);
  });
});
