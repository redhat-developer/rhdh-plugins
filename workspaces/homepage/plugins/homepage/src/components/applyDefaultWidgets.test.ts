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

import type { AppNode } from '@backstage/frontend-plugin-api';
import {
  applyDefaultWidgetsToNfsWidgets,
  getHomepageWidgetExtensionName,
} from './applyDefaultWidgets';
import type { HomePageCardConfig } from '../types';

function widget(
  extensionName: string,
  extras: Partial<HomePageCardConfig> = {},
): HomePageCardConfig {
  return {
    node: {
      spec: { id: `home-page-widget:homepage/${extensionName}` },
    } as AppNode,
    component: null as unknown as React.ReactElement,
    name: extensionName,
    ...extras,
  };
}

describe('applyDefaultWidgetsToNfsWidgets', () => {
  it('returns all widgets even when only some match defaultWidgets refs', () => {
    const widgets = [
      widget('rhdh-onboarding-section'),
      widget('rhdh-entity-section'),
      widget('featured-docs-card'),
    ];

    const result = applyDefaultWidgetsToNfsWidgets(widgets, [
      { id: 'featured', ref: 'featured-docs-card' },
      { id: 'onboarding', ref: 'rhdh-onboarding-section' },
    ]);

    expect(result).toHaveLength(3);
    expect(result.map(getHomepageWidgetExtensionName)).toEqual([
      'rhdh-onboarding-section',
      'rhdh-entity-section',
      'featured-docs-card',
    ]);
  });

  it('applies layout from defaultWidgets to matching widgets', () => {
    const widgets = [widget('rhdh-entity-section')];
    const result = applyDefaultWidgetsToNfsWidgets(widgets, [
      {
        id: 'entity-list',
        ref: 'rhdh-entity-section',
        layout: { xl: { w: 12, h: 7 } },
      },
    ]);

    expect(result[0].breakpointLayouts).toEqual({ xl: { w: 12, h: 7 } });
  });

  it('ignores defaultWidgets whose ref does not match any NFS widget', () => {
    const widgets = [widget('quickaccess-card')];
    const result = applyDefaultWidgetsToNfsWidgets(widgets, [
      { id: 'missing', ref: 'homepage.missing' },
      { id: 'qa', ref: 'quickaccess-card' },
    ]);

    expect(result).toHaveLength(1);
    expect(getHomepageWidgetExtensionName(result[0])).toBe('quickaccess-card');
  });

  it('keeps existing breakpointLayouts when defaultWidgets omit layout', () => {
    const widgets = [
      widget('rhdh-entity-section', {
        breakpointLayouts: {
          xl: { x: 0, y: 0, w: 6, h: 4 },
        } as HomePageCardConfig['breakpointLayouts'],
      }),
    ];
    const result = applyDefaultWidgetsToNfsWidgets(widgets, [
      { id: 'entity-list', ref: 'rhdh-entity-section' },
    ]);

    expect(result[0].breakpointLayouts).toEqual({
      xl: { x: 0, y: 0, w: 6, h: 4 },
    });
  });

  it('includes widgets that have no matching defaultWidgets ref', () => {
    const widgets = [widget('quickaccess-card'), widget('third-party-widget')];

    const result = applyDefaultWidgetsToNfsWidgets(widgets, [
      { id: 'qa', ref: 'quickaccess-card' },
    ]);

    expect(result).toHaveLength(2);
    expect(result.map(getHomepageWidgetExtensionName)).toContain(
      'third-party-widget',
    );
  });

  it('returns all widgets unchanged when defaultWidgets is empty', () => {
    const widgets = [
      widget('quickaccess-card'),
      widget('recently-visited-card'),
    ];

    const result = applyDefaultWidgetsToNfsWidgets(widgets, []);

    expect(result).toHaveLength(2);
    expect(result.map(getHomepageWidgetExtensionName)).toEqual([
      'quickaccess-card',
      'recently-visited-card',
    ]);
  });
});
