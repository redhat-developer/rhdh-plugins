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
import { aggregationTypes } from '@red-hat-developer-hub/backstage-plugin-scorecard-common';
import { buildAggregationConfig } from './buildAggregationConfig';

describe('buildAggregationConfig', () => {
  it('maps nested config and aggregation id into AggregationConfig', () => {
    const config = new ConfigReader({
      title: 'GitHub PRs',
      description: 'Open pull requests',
      type: aggregationTypes.statusGrouped,
      metricId: 'github.open_prs',
    });

    const result = buildAggregationConfig('openPrsKpi', { config });

    expect(result).toEqual({
      id: 'openPrsKpi',
      title: 'GitHub PRs',
      description: 'Open pull requests',
      type: aggregationTypes.statusGrouped,
      metricId: 'github.open_prs',
    });
  });
});
