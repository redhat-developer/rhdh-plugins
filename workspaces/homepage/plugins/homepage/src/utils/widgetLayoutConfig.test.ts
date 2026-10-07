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

import type { HomePageCardConfig } from '../types';
import { applyReadOnlyWidgetLayout } from './widgetLayoutConfig';

function widget(
  extensionId: string,
  displayName = extensionId,
): HomePageCardConfig {
  return {
    node: {
      spec: { id: `home-page-widget:scorecard/${extensionId}` },
    } as AppNode,
    component: null as unknown as React.ReactElement,
    name: displayName,
  };
}

describe('applyReadOnlyWidgetLayout', () => {
  it('forwards props from a widget name entry, matching scorecard widgetLayout', () => {
    const [card] = applyReadOnlyWidgetLayout(
      [widget('scorecard-aggregated-card', 'ScorecardAggregatedCard')],
      {
        ScorecardAggregatedCard: {
          priority: 440,
          props: {
            aggregationId: 'github.openPRs',
          },
          breakpoints: {
            xl: { w: 4, h: 6 },
            lg: { w: 4, h: 6, x: 4 },
          },
        },
      },
    );

    expect(card.props).toEqual({ aggregationId: 'github.openPRs' });
    expect(card.breakpointLayouts).toEqual({
      xl: { w: 4, h: 6 },
      lg: { w: 4, h: 6, x: 4 },
    });
  });

  it('also matches the widget extension id', () => {
    const [card] = applyReadOnlyWidgetLayout(
      [widget('scorecard-aggregated-card', 'ScorecardAggregatedCard')],
      {
        'scorecard-aggregated-card': {
          props: { aggregationId: 'jira.openIssues', limit: 5 },
        },
      },
    );

    expect(card.props).toEqual({
      aggregationId: 'jira.openIssues',
      limit: 5,
    });
  });

  it('orders widgets by priority, higher first', () => {
    const cards = applyReadOnlyWidgetLayout(
      [
        widget(
          'scorecard-jira-open-issues',
          'AggregatedCardWithJiraOpenIssues',
        ),
        widget('scorecard-github-open-prs', 'AggregatedCardWithGithubOpenPrs'),
      ],
      {
        AggregatedCardWithJiraOpenIssues: { priority: 430 },
        AggregatedCardWithGithubOpenPrs: { priority: 440 },
      },
    );

    expect(cards.map(card => card.name)).toEqual([
      'AggregatedCardWithGithubOpenPrs',
      'AggregatedCardWithJiraOpenIssues',
    ]);
  });

  it('keeps cards unchanged when widgetLayout is empty', () => {
    const widgets = [
      widget('scorecard-aggregated-card', 'ScorecardAggregatedCard'),
    ];
    expect(applyReadOnlyWidgetLayout(widgets)).toEqual(widgets);
  });
});
