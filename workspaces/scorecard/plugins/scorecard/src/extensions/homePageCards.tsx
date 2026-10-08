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

import type { ComponentType, ReactElement } from 'react';
import { HomePageWidgetBlueprint } from '@backstage/plugin-home-react/alpha';
import type { RendererProps } from '@backstage/plugin-home-react';

const defaultCardLayout = {
  width: {
    minColumns: 3,
    maxColumns: 12,
    defaultColumns: 4,
  },
  height: {
    minRows: 5,
    maxRows: 12,
    defaultRows: 6,
  },
} as const;

type ScorecardHomepageCardProps = {
  metricId?: string;
  aggregationId?: string;
};

const aggregationIdDescription =
  'KPI key from scorecard.aggregationKPIs, or a metric ID such as github.openPRs.';

function lazyScorecardWidget(
  factory: (
    ScorecardHomepageCardWithProvider: ComponentType<ScorecardHomepageCardProps>,
  ) => (props?: ScorecardHomepageCardProps) => ReactElement,
) {
  return async () => {
    const { ScorecardHomepageCardWithProvider } = await import(
      '../components/ScorecardHomepageSection'
    );
    return { Content: factory(ScorecardHomepageCardWithProvider) };
  };
}

/** Forwards homepage card settings, including `aggregationId`, into the card. */
function ConfigurableScorecardWidgetRenderer({
  Content,
  ...rest
}: RendererProps) {
  return <Content {...rest} />;
}

/**
 * NFS homepage card for one scorecard aggregation.
 *
 * Set Aggregation ID in the card settings on an editable homepage.
 */
export const scorecardAggregatedCardWidget = HomePageWidgetBlueprint.make({
  name: 'scorecard-aggregated-card',
  attachTo: { id: 'page:homepage', input: 'widgets' },
  params: {
    name: 'ScorecardAggregatedCard',
    title: 'Scorecard',
    description:
      'Aggregated scorecard. Set Aggregation ID to a KPI key from scorecard.aggregationKPIs, or to a metric ID such as github.openPRs.',
    layout: defaultCardLayout,
    settings: {
      schema: {
        title: 'Scorecard settings',
        type: 'object',
        required: ['aggregationId'],
        properties: {
          aggregationId: {
            title: 'Aggregation ID',
            type: 'string',
            minLength: 1,
            description: aggregationIdDescription,
          },
        },
      },
    },
    componentProps: {
      Renderer: ConfigurableScorecardWidgetRenderer,
    },
    components: lazyScorecardWidget(
      ScorecardHomepageCardWithProvider => props =>
        (
          <ScorecardHomepageCardWithProvider
            aggregationId={props?.aggregationId}
          />
        ),
    ),
  },
});
