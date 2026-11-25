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

import { normalizePluginId } from '../../popularContent';
import {
  applyResolvedDestinations,
  mapPluginTrendsToPopularContentItems,
} from '../mapPlugins';

describe('mapPluginTrendsToPopularContentItems', () => {
  it('maps plugin trends with display name and metrics, without hrefs', () => {
    const mapped = mapPluginTrendsToPopularContentItems([
      {
        plugin_id: 'catalog',
        visit_count: 1053,
        trend_percentage: '8',
        trend: [],
      },
      {
        plugin_id: 'bulk-import',
        visit_count: 40,
        trend_percentage: '2',
        trend: [],
      },
      {
        plugin_id: 'mystery',
        visit_count: 1,
        trend_percentage: '0',
        trend: [],
      },
    ]);

    expect(mapped).toMatchObject([
      {
        id: 'catalog',
        title: 'Software Catalog',
        subtitle: 'catalog',
        visitCount: 1053,
        trendPercentage: '8',
      },
      {
        id: 'bulk-import',
        title: 'Bulk Import',
        subtitle: 'bulk-import',
        visitCount: 40,
        trendPercentage: '2',
      },
      {
        id: 'mystery',
        title: 'Mystery',
        subtitle: 'mystery',
        visitCount: 1,
        trendPercentage: '0',
      },
    ]);
    expect(mapped.every(item => item.href === undefined)).toBe(true);
    expect(mapped.every(item => item.icon === undefined)).toBe(true);
  });
});

describe('applyResolvedDestinations', () => {
  it('fills missing hrefs from the map and preserves explicit ones', () => {
    expect(
      applyResolvedDestinations(
        [
          { id: 'catalog-graph', title: 'Catalog Graph' },
          { id: 'custom', title: 'Custom', href: '/already' },
          { id: 'mystery', title: 'Mystery' },
        ],
        new Map([
          ['catalog-graph', '/catalog-graph'],
          ['custom', '/ignored'],
        ]),
        normalizePluginId,
      ),
    ).toEqual([
      {
        id: 'catalog-graph',
        title: 'Catalog Graph',
        href: '/catalog-graph',
      },
      { id: 'custom', title: 'Custom', href: '/already' },
      { id: 'mystery', title: 'Mystery' },
    ]);
  });
});
