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

import { VisibleDefaultWidget } from '../defaultWidgets/types';
import { filterAuthorizedWidgets, matches } from './permissionUtils';

const widget = (id: string, tags?: string[]): VisibleDefaultWidget => ({
  id,
  ref: id,
  ...(tags && { tags }),
});

describe('matches', () => {
  it('returns true when no filter is provided', () => {
    expect(matches(widget('a'), undefined)).toBe(true);
  });

  it('matches by HAS_WIDGET_ID rule', () => {
    expect(
      matches(widget('onboarding'), {
        rule: 'HAS_WIDGET_ID',
        resourceType: 'homepage-default-widget',
        params: { widgetIds: ['onboarding', 'search'] },
      }),
    ).toBe(true);
  });

  it('does not match HAS_WIDGET_ID when id is not in list', () => {
    expect(
      matches(widget('admin-panel'), {
        rule: 'HAS_WIDGET_ID',
        resourceType: 'homepage-default-widget',
        params: { widgetIds: ['onboarding'] },
      }),
    ).toBe(false);
  });

  it('matches by HAS_TAG rule', () => {
    expect(
      matches(widget('dashboard', ['admin', 'management']), {
        rule: 'HAS_TAG',
        resourceType: 'homepage-default-widget',
        params: { tags: ['admin'] },
      }),
    ).toBe(true);
  });

  it('does not match HAS_TAG when widget has no tags', () => {
    expect(
      matches(widget('dashboard'), {
        rule: 'HAS_TAG',
        resourceType: 'homepage-default-widget',
        params: { tags: ['admin'] },
      }),
    ).toBe(false);
  });

  it('does not match HAS_TAG when no tag overlaps', () => {
    expect(
      matches(widget('dashboard', ['developer']), {
        rule: 'HAS_TAG',
        resourceType: 'homepage-default-widget',
        params: { tags: ['admin'] },
      }),
    ).toBe(false);
  });

  it('handles anyOf combinator', () => {
    expect(
      matches(widget('search'), {
        anyOf: [
          {
            rule: 'HAS_WIDGET_ID',
            resourceType: 'homepage-default-widget',
            params: { widgetIds: ['onboarding'] },
          },
          {
            rule: 'HAS_WIDGET_ID',
            resourceType: 'homepage-default-widget',
            params: { widgetIds: ['search'] },
          },
        ],
      }),
    ).toBe(true);
  });

  it('handles allOf combinator', () => {
    expect(
      matches(widget('dashboard', ['admin']), {
        allOf: [
          {
            rule: 'HAS_WIDGET_ID',
            resourceType: 'homepage-default-widget',
            params: { widgetIds: ['dashboard'] },
          },
          {
            rule: 'HAS_TAG',
            resourceType: 'homepage-default-widget',
            params: { tags: ['admin'] },
          },
        ],
      }),
    ).toBe(true);
  });

  it('handles not combinator', () => {
    expect(
      matches(widget('public'), {
        not: {
          rule: 'HAS_TAG',
          resourceType: 'homepage-default-widget',
          params: { tags: ['admin'] },
        },
      }),
    ).toBe(true);
  });

  it('returns false for unknown rule', () => {
    expect(
      matches(widget('a'), {
        rule: 'UNKNOWN_RULE',
        resourceType: 'homepage-default-widget',
        params: {},
      }),
    ).toBe(false);
  });
});

describe('filterAuthorizedWidgets', () => {
  const widgets = [
    widget('search'),
    widget('admin-panel', ['admin']),
    widget('dev-tools', ['developer']),
    widget('onboarding'),
  ];

  it('returns all widgets when no filter is provided', () => {
    expect(filterAuthorizedWidgets(widgets, undefined)).toEqual(widgets);
  });

  it('filters by widget ID', () => {
    const result = filterAuthorizedWidgets(widgets, {
      rule: 'HAS_WIDGET_ID',
      resourceType: 'homepage-default-widget',
      params: { widgetIds: ['search', 'onboarding'] },
    });
    expect(result.map(w => w.id)).toEqual(['search', 'onboarding']);
  });

  it('filters by tag (tagless widgets bypass filter)', () => {
    const result = filterAuthorizedWidgets(widgets, {
      rule: 'HAS_TAG',
      resourceType: 'homepage-default-widget',
      params: { tags: ['admin'] },
    });
    expect(result.map(w => w.id)).toEqual([
      'search',
      'admin-panel',
      'onboarding',
    ]);
  });

  it('filters with anyOf combining tags (tagless widgets bypass filter)', () => {
    const result = filterAuthorizedWidgets(widgets, {
      anyOf: [
        {
          rule: 'HAS_TAG',
          resourceType: 'homepage-default-widget',
          params: { tags: ['admin'] },
        },
        {
          rule: 'HAS_TAG',
          resourceType: 'homepage-default-widget',
          params: { tags: ['developer'] },
        },
      ],
    });
    expect(result.map(w => w.id)).toEqual([
      'search',
      'admin-panel',
      'dev-tools',
      'onboarding',
    ]);
  });

  it('tagless widgets always included regardless of filter', () => {
    const result = filterAuthorizedWidgets(
      [widget('no-tags'), widget('tagged', ['secret'])],
      {
        rule: 'HAS_TAG',
        resourceType: 'homepage-default-widget',
        params: { tags: ['admin'] },
      },
    );
    expect(result.map(w => w.id)).toEqual(['no-tags']);
  });
});
