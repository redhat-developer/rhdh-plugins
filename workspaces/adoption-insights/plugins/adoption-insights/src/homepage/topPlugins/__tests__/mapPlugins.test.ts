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

import { mapPluginTrendsToPopularContentItems } from '../mapPlugins';

describe('mapPluginTrendsToPopularContentItems', () => {
  it('maps plugin trends with display name, metrics, and destinations', () => {
    expect(
      mapPluginTrendsToPopularContentItems([
        {
          plugin_id: 'catalog',
          visit_count: 1053,
          trend_percentage: '8',
          trend: [],
        },
        {
          plugin_id: 'mystery',
          visit_count: 1,
          trend_percentage: '0',
          trend: [],
        },
      ]),
    ).toEqual([
      {
        id: 'catalog',
        title: 'Software Catalog',
        subtitle: 'catalog',
        href: '/catalog',
        visitCount: 1053,
        trendPercentage: '8',
      },
      {
        id: 'mystery',
        title: 'Mystery',
        subtitle: 'mystery',
        href: undefined,
        visitCount: 1,
        trendPercentage: '0',
      },
    ]);
  });
});
