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

// eslint-disable-next-line
import '@backstage/ui/css/styles.css';

import { createDevApp } from '@backstage/dev-utils';
import { EntityProvider } from '@backstage/plugin-catalog-react';
import { Page, Header, TabbedLayout } from '@backstage/core-components';
import { TestApiProvider } from '@backstage/test-utils';
import { getAllThemes } from '@red-hat-developer-hub/backstage-plugin-theme';
import type { Entity } from '@backstage/catalog-model';
import type {
  MetricResult,
  AggregatedMetricResult,
} from '@red-hat-developer-hub/backstage-plugin-scorecard-common';

import { scorecardPlugin, EntityScorecardContent } from '../src/plugin';
import { scorecardTranslations } from '../src/translations';
import { scorecardApiRef, ScorecardApi } from '../src/api';
import {
  mockScorecardErrorData,
  mockScorecardSuccessData,
} from '../__fixtures__/scorecardData';
import { mockAggregatedScorecardSuccessData } from '../__fixtures__/aggregatedScorecardData';

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
}

createDevApp()
  .registerPlugin(scorecardPlugin)
  .addTranslationResource(scorecardTranslations)
  .setAvailableLanguages(['en', 'de', 'es', 'fr', 'it', 'ja'])
  .setDefaultLanguage('en')
  .addThemes(getAllThemes())
  .addPage({
    element: (
      <TestApiProvider apis={[[scorecardApiRef, new MockScorecardApi()]]}>
        <EntityProvider entity={mockComponentEntity}>
          <Page themeId="tool">
            <Header
              type="component — tool"
              title={mockComponentEntity.metadata.name}
            />
            <TabbedLayout>
              <TabbedLayout.Route path="/" title="Scorecard">
                <EntityScorecardContent />
              </TabbedLayout.Route>
            </TabbedLayout>
          </Page>
        </EntityProvider>
      </TestApiProvider>
    ),
    title: 'Scorecard',
    path: '/scorecard',
  })
  .render();
