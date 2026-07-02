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
import { matches } from './permissionUtils';

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

  it('does match HAS_TAG when widget has no tags', () => {
    expect(
      matches(widget('search'), {
        rule: 'HAS_TAG',
        resourceType: 'homepage-default-widget',
        params: { tags: ['admin'] },
      }),
    ).toBe(true);
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
      matches(widget('admin-panel', ['admin']), {
        not: {
          rule: 'HAS_TAG',
          resourceType: 'homepage-default-widget',
          params: { tags: ['user'] },
        },
      }),
    ).toBe(true);
    expect(
      matches(widget('admin-panel', ['admin']), {
        not: {
          rule: 'HAS_TAG',
          resourceType: 'homepage-default-widget',
          params: { tags: ['admin'] },
        },
      }),
    ).toBe(false);
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
