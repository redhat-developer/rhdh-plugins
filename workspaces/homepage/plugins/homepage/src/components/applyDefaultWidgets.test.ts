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
  it('filters and orders by visible defaultWidgets refs', () => {
    const widgets = [
      widget('rhdh-onboarding-section'),
      widget('rhdh-entity-section'),
      widget('featured-docs-card'),
    ];

    const result = applyDefaultWidgetsToNfsWidgets(widgets, [
      { id: 'featured', ref: 'featured-docs-card' },
      { id: 'onboarding', ref: 'rhdh-onboarding-section' },
    ]);

    expect(result.map(getHomepageWidgetExtensionName)).toEqual([
      'featured-docs-card',
      'rhdh-onboarding-section',
    ]);
  });

  it('matches defaultWidgets refs to NFS extension names', () => {
    const widgets = [
      widget('quickaccess-card'),
      widget('recently-visited-card'),
    ];

    const result = applyDefaultWidgetsToNfsWidgets(widgets, [
      { id: 'qa', ref: 'quickaccess-card' },
      { id: 'recent', ref: 'recently-visited-card' },
    ]);

    expect(result.map(getHomepageWidgetExtensionName)).toEqual([
      'quickaccess-card',
      'recently-visited-card',
    ]);
  });

  it('applies layout from defaultWidgets', () => {
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
});
