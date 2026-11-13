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

import type { TopPluginsCardProps } from '../homepage/topPlugins/TopPluginsCard';
import { adoptionInsightsAccess } from '../permissions/adoptionInsightsAccess';

const defaultCardLayout = {
  width: {
    minColumns: 3,
    maxColumns: 12,
    defaultColumns: 4,
  },
  height: {
    minRows: 4,
    maxRows: 12,
    defaultRows: 5,
  },
} as const;

/** Forwards homepage card settings into the Top Plugins card. */
function ConfigurablePopularContentRenderer({
  Content,
  ...rest
}: RendererProps) {
  return <Content {...rest} />;
}

function lazyTopPluginsWidget(
  factory: (
    TopPluginsCard: ComponentType<TopPluginsCardProps>,
  ) => (props?: TopPluginsCardProps) => ReactElement,
) {
  return async () => {
    const { TopPluginsCard } = await import(
      '../homepage/topPlugins/TopPluginsCard'
    );
    return { Content: factory(TopPluginsCard) };
  };
}

/**
 * NFS homepage widget: Top Plugins / Extensions Popular Content card.
 *
 * Widget name: `top-plugins-card`
 *
 * Gated by `adoption-insights.events.read` so denied users neither see the
 * card on the homepage nor as an option in the Add Widget catalog.
 *
 * Settings (editable homepage) / layout props:
 * - `mode`: `auto` | `hybrid` | `curated` (default `auto`)
 * - `displayCount`: number of rows (default `3`)
 * - `title`: overridable card title
 * - `items`: curated list or hybrid pins `[{ id, title?, href? }]`
 * - `pluginDestinations`: `{ [pluginId]: '/path' }` overrides / custom routes
 */
export const topPluginsCardWidget = HomePageWidgetBlueprint.make({
  name: 'top-plugins-card',
  attachTo: { id: 'page:homepage', input: 'widgets' },
  // Hide from homepage grid + Add Widget catalog without events.read.
  if: adoptionInsightsAccess,
  params: {
    name: 'TopPluginsCard',
    title: 'Top Plugins',
    description:
      'Org-wide most-used plugins and extensions from Adoption Insights. Supports auto, hybrid, and curated modes.',
    layout: defaultCardLayout,
    settings: {
      schema: {
        title: 'Top Plugins settings',
        type: 'object',
        properties: {
          mode: {
            title: 'Mode',
            type: 'string',
            enum: ['auto', 'hybrid', 'curated'],
            default: 'auto',
            description:
              'auto: usage-ranked; hybrid: pins + ranking; curated: admin list only',
          },
          displayCount: {
            title: 'Display count',
            type: 'integer',
            minimum: 1,
            default: 3,
            description: 'Number of items to show (default 3)',
          },
          title: {
            title: 'Card title',
            type: 'string',
            description: 'Optional override for the card title',
          },
        },
      },
    },
    componentProps: {
      Renderer: ConfigurablePopularContentRenderer,
    },
    components: lazyTopPluginsWidget(TopPluginsCard => props => (
      <TopPluginsCard {...props} />
    )),
  },
});
