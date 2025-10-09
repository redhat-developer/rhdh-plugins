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

import {
  PermissionCriteria,
  PermissionCondition,
  PermissionRuleParams,
} from '@backstage/plugin-permission-common';
import { Metric } from '@red-hat-developer-hub/backstage-plugin-scorecard-common';
import { filterAuthorizedMetrics, matches } from './permissionUtils';

const createMockMetric = (
  id: string,
  title: string = `${id} metric`,
): Metric => ({
  id,
  title,
  description: `Description for ${title}`,
  type: 'number',
  history: false,
});

describe('permissionUtils', () => {
  const mockMetricIdPermissionCondition = {
    rule: 'HAS_METRIC_ID',
    resourceType: 'scorecard-metric',
    params: { metricIds: ['github.open_prs'] },
  };

  describe('matches', () => {
    const anyOfFilter: PermissionCriteria<
      PermissionCondition<string, PermissionRuleParams>
    > = {
      anyOf: [mockMetricIdPermissionCondition],
    };

    const allOfFilter: PermissionCriteria<
      PermissionCondition<string, PermissionRuleParams>
    > = {
      allOf: [mockMetricIdPermissionCondition],
    };

    const notFilter: PermissionCriteria<
      PermissionCondition<string, PermissionRuleParams>
    > = {
      not: mockMetricIdPermissionCondition,
    };

    const matchedMetric = createMockMetric(
      'github.open_prs',
      'GitHub Open PRs',
    );
    const nonMatchedMetric = createMockMetric(
      'jira.open_issues',
      'Jira Open Issues',
    );

    it('should return true when a filter is not supplied', () => {
      expect(matches(matchedMetric)).toBeTruthy();
    });

    it('should return true with anyOf filter where metricId matches filter metricId', () => {
      expect(matches(matchedMetric, anyOfFilter)).toBeTruthy();
    });

    it('shoule return false with anyOf filter where metricId does not match filter metricId', () => {
      expect(matches(nonMatchedMetric, anyOfFilter)).toBeFalsy();
    });

    it('should return true with allOf filter where metricId matches filter metricId', () => {
      expect(matches(matchedMetric, allOfFilter)).toBeTruthy();
    });

    it('shoule return false with allOf filter where metricId does not match filter metricId', () => {
      expect(matches(nonMatchedMetric, allOfFilter)).toBeFalsy();
    });

    it('should return false with not filter where metricId matches filter metricId', () => {
      expect(matches(matchedMetric, notFilter)).toBeFalsy();
    });

    it('should return true with not filter where metricId does not match filter metricId', () => {
      expect(matches(nonMatchedMetric, notFilter)).toBeTruthy();
    });
  });

  describe('filterAuthorizedMetrics', () => {
    const metrics = [
      createMockMetric('github.open_prs', 'GitHub Open PRs'),
      createMockMetric('jira.open_issues', 'Jira Open Issues'),
    ];

    it('should return all metrics when no filter is provided', () => {
      const result = filterAuthorizedMetrics(metrics);
      expect(result).toEqual(metrics);
      expect(result).toHaveLength(2);
    });

    it('should filter metrics based on filter criteria', () => {
      const result = filterAuthorizedMetrics(metrics, {
        anyOf: [mockMetricIdPermissionCondition],
      });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('github.open_prs');
    });
  });
});
