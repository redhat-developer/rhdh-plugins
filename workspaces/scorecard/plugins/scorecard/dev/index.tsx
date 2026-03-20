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

import { ReactNode } from 'react';

// eslint-disable-next-line
import '@backstage/ui/css/styles.css';

import { createDevApp } from '@backstage/dev-utils';
import {
  catalogApiRef,
  CatalogApi,
  EntityProvider,
} from '@backstage/plugin-catalog-react';
import { catalogPlugin, CatalogEntityPage } from '@backstage/plugin-catalog';
import Box from '@mui/material/Box';
import {
  Page,
  Header,
  TabbedLayout,
  Content,
} from '@backstage/core-components';
import { TestApiProvider } from '@backstage/test-utils';
import { getAllThemes } from '@red-hat-developer-hub/backstage-plugin-theme';
import type { Entity } from '@backstage/catalog-model';
import type {
  MetricResult,
  AggregatedMetricResult,
  Metric,
  EntityMetricDetailResponse,
} from '@red-hat-developer-hub/backstage-plugin-scorecard-common';
import Typography from '@mui/material/Typography';

import {
  scorecardPlugin,
  EntityScorecardContent,
  ScorecardPage,
  ScorecardHomepageCard,
} from '../src/plugin';
import { scorecardTranslations } from '../src/translations';
import { scorecardApiRef, ScorecardApi } from '../src/api';
import type { GetAggregatedScorecardEntitiesOptions } from '../src/components/types';
import {
  mockScorecardErrorData,
  mockScorecardSuccessData,
} from '../__fixtures__/scorecardData';
import { mockAggregatedScorecardSuccessData } from '../__fixtures__/aggregatedScorecardData';
import { mockAggregatedScorecardEntitiesData } from '../__fixtures__/aggregatedScorecardEntitiesData';

const mockComponentEntity: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'Component',
  metadata: {
    namespace: 'default',
    name: 'example-service',
    description: 'Example service',
  },
  spec: {
    type: 'service',
    lifecycle: 'production',
  },
};

class MockScorecardApi implements ScorecardApi {
  async getScorecards(_entity: Entity): Promise<MetricResult[]> {
    return [...mockScorecardSuccessData, ...mockScorecardErrorData];
  }
  async getAggregatedScorecard(
    _metricId: string,
  ): Promise<AggregatedMetricResult> {
    return mockAggregatedScorecardSuccessData;
  }
  async getMetrics(_options?: {
    metricIds: string[];
  }): Promise<{ metrics: Metric[] }> {
    return {
      metrics: [
        ...mockScorecardSuccessData.filter(
          metric => metric.id === 'github.open_issues',
        ),
      ] as unknown as Metric[],
    };
  }
  async getAggregatedScorecardEntities(
    _options: GetAggregatedScorecardEntitiesOptions,
  ): Promise<EntityMetricDetailResponse> {
    return mockAggregatedScorecardEntitiesData(
      _options.metricId,
      _options.page,
      _options.pageSize,
    ) as EntityMetricDetailResponse;
  }
}

const mockCatalogApi: Partial<CatalogApi> = {
  getEntities: async () => ({ items: [mockComponentEntity] }),
  getEntityByRef: async () => mockComponentEntity,
};

const ScorecardWrapper = ({ children }: { children: ReactNode }) => (
  <TestApiProvider
    apis={[
      [scorecardApiRef, new MockScorecardApi()],
      [catalogApiRef, mockCatalogApi as CatalogApi],
    ]}
  >
    <Page themeId="tool">
      <Content>{children}</Content>
    </Page>
  </TestApiProvider>
);

createDevApp()
  .registerPlugin(catalogPlugin)
  .registerPlugin(scorecardPlugin)
  .addTranslationResource(scorecardTranslations)
  .setAvailableLanguages(['en', 'de', 'es', 'fr', 'it', 'ja'])
  .setDefaultLanguage('en')
  .addThemes(getAllThemes())
  .addPage({
    element: (
      <ScorecardWrapper>
        {/* Default usage of the homepage card without explicit size constraints. The card is expected to adapt to the parent container. */}
        <ScorecardHomepageCard metricId="github.open_prs" />
      </ScorecardWrapper>
    ),
    title: 'Scorecard Homepage Card',
    path: '/',
  })
  .addPage({
    element: (
      <ScorecardWrapper>
        {/* Showcase the card in different container sizes to validate responsiveness and layout behavior across use cases.
        This helps ensure the component works correctly when embedded in various homepage grid configurations. */}
        {[
          { label: 'Small (320×300)', width: 320, height: 300 },
          { label: 'Medium (520×480)', width: 520, height: 480 },
          { label: 'Wide (800×400)', width: 800, height: 400 },
        ].map(({ label, width, height }) => (
          <Box key={label}>
            <Typography variant="caption">{label}</Typography>
            <Box sx={{ width, height }}>
              <ScorecardHomepageCard metricId="github.open_prs" />
            </Box>
          </Box>
        ))}
      </ScorecardWrapper>
    ),
    title: 'Different Sizes of Scorecard Homepage Card',
    path: '/different-sizes',
  })
  .addPage({
    element: (
      <ScorecardWrapper>
        <EntityProvider entity={mockComponentEntity}>
          <Header
            type="component — tool"
            title={mockComponentEntity.metadata.name}
          />
          <TabbedLayout>
            <TabbedLayout.Route path="/" title="Scorecard">
              <EntityScorecardContent />
            </TabbedLayout.Route>
          </TabbedLayout>
        </EntityProvider>
      </ScorecardWrapper>
    ),
    title: 'Scorecard',
    path: '/scorecard',
  })
  .addPage({
    element: (
      <ScorecardWrapper>
        <EntityProvider entity={mockComponentEntity}>
          <TabbedLayout>
            <TabbedLayout.Route path="/" title="Scorecard Page">
              <ScorecardPage />
            </TabbedLayout.Route>
          </TabbedLayout>
        </EntityProvider>
      </ScorecardWrapper>
    ),
    title: 'Scorecard Page',
    path: '/scorecard/metrics/github.open_prs',
  })
  .addPage({
    path: '/catalog/:namespace/:kind/:name',
    title: 'Catalog Entity',
    element: (
      <ScorecardWrapper>
        <CatalogEntityPage />
      </ScorecardWrapper>
    ),
  })
  .render();
