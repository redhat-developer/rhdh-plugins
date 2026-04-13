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

import type { ReactNode } from 'react';

// eslint-disable-next-line
import '@backstage/ui/css/styles.css';

import { createDevApp } from '@backstage/dev-utils';
import {
  CatalogApi,
  catalogApiRef,
  EntityProvider,
} from '@backstage/plugin-catalog-react';
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
  AggregationMetadata,
} from '@red-hat-developer-hub/backstage-plugin-scorecard-common';
import { CatalogEntityPage } from '@backstage/plugin-catalog';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import {
  scorecardPlugin,
  EntityScorecardContent,
  ScorecardHomepageCard,
  ScorecardPage,
} from '../src/plugin';
import { scorecardTranslations } from '../src/translations';
import { scorecardApiRef } from '../src/api';
import type { ScorecardApi } from '../src/api/types';
import type { GetAggregatedScorecardEntitiesOptions } from '../src/components/types';
import {
  mockAggregatedScorecardData,
  mockScorecardErrorData,
  mockScorecardSuccessData,
} from '../__fixtures__/scorecardData';
import { mockAggregatedScorecardEntitiesData } from '../__fixtures__/aggregatedScorecardEntitiesData';
import { mockCatalogApi } from './mocks';
import { ScorecardOptions } from '../src/api/types';

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
  async getBaseUrl(): Promise<string> {
    return 'https://example.com';
  }

  async getScorecards(_options: ScorecardOptions): Promise<MetricResult[]> {
    return [...mockScorecardSuccessData, ...mockScorecardErrorData];
  }

  async getAggregatedScorecard(
    _metricId: string,
  ): Promise<AggregatedMetricResult> {
    return mockAggregatedScorecardData.statusGrouped;
  }

  async getAggregationMetadata(
    _aggregationId: string,
  ): Promise<AggregationMetadata> {
    return {
      title: 'GitHub open issues',
      description: 'GitHub open issues',
      type: 'number',
      aggregationType: 'statusGrouped',
    };
  }

  async getMetrics(_options: {
    metricIds: string[];
  }): Promise<{ metrics: Metric[] }> {
    const allMetrics = [
      ...mockScorecardSuccessData,
      ...mockScorecardErrorData,
    ].map(m => ({
      id: m.id,
      title: m.metadata.title,
      description: m.metadata.description,
      type: m.metadata.type,
      history: m.metadata.history,
    }));
    return { metrics: allMetrics };
  }

  async getAggregatedScorecardEntities(
    options: GetAggregatedScorecardEntitiesOptions,
  ): Promise<EntityMetricDetailResponse> {
    return mockAggregatedScorecardEntitiesData(
      options.metricId,
      options.page ?? 1,
      options.pageSize ?? 10,
    ) as EntityMetricDetailResponse;
  }
}

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
  .registerPlugin(scorecardPlugin)
  .addTranslationResource(scorecardTranslations)
  .setAvailableLanguages(['en', 'de', 'es', 'fr', 'it', 'ja'])
  .setDefaultLanguage('en')
  .addThemes(getAllThemes())
  .addPage({
    element: (
      <ScorecardWrapper>
        <ScorecardHomepageCard metricId="github.open_prs" />
      </ScorecardWrapper>
    ),
    title: 'Default Layout',
    path: '/',
  })
  .addPage({
    element: (
      <ScorecardWrapper>
        {[
          { label: 'Small (320x380)', width: 320, height: 380 },
          { label: 'Medium (520x480)', width: 520, height: 480 },
          { label: 'Large (800x480)', width: 800, height: 480 },
        ].map(({ label, width, height }) => (
          <Box key={label}>
            <Typography variant="caption">{label}</Typography>
            <Box sx={{ width, height }}>
              <ScorecardHomepageCard aggregationId="github.open_prs" />
            </Box>
          </Box>
        ))}
      </ScorecardWrapper>
    ),
    title: 'Custom Layout',
    path: '/custom-layout-scorecard-homepage-card',
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
            <TabbedLayout.Route path="/" title="Scorecard Entities">
              <ScorecardPage />
            </TabbedLayout.Route>
          </TabbedLayout>
        </EntityProvider>
      </ScorecardWrapper>
    ),
    title: 'Scorecard Entities',
    path: '/scorecard/aggregations/github.open_prs/metrics/github.open_prs',
  })
  .addPage({
    element: (
      <ScorecardWrapper>
        <CatalogEntityPage />
      </ScorecardWrapper>
    ),
    title: 'Catalog Entity',
    path: '/catalog/:namespace/:kind/:name',
  })
  .render();
