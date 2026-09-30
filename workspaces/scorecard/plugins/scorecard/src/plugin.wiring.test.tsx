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

import { coreExtensionData } from '@backstage/frontend-plugin-api';
import { createExtensionTester } from '@backstage/frontend-test-utils';
import scorecardPlugin, { scorecardTranslationsModule } from './index';
import { scorecardApi } from './extensions/api';
import { scorecardEntityContent } from './extensions/entityTab';
import { aggregatedCardWithGithubOpenPrsWidget } from './extensions/homePageCards';
import { scorecardPage } from './extensions/scorecardPage';
import { scorecardTranslation } from './extensions/translation';
import { rootRouteRef, scorecardDrillDownRouteRef } from './routes';

describe('scorecard NFS plugin wiring', () => {
  it('registers the scorecard plugin id and route refs', () => {
    expect(scorecardPlugin.$$type).toBe('@backstage/FrontendPlugin');
    expect(scorecardPlugin.pluginId).toBe('scorecard');
    expect(scorecardPlugin.routes.root).toBe(rootRouteRef);
    expect(scorecardPlugin.routes.drillDown).toBe(scorecardDrillDownRouteRef);
  });

  it('installs the API extension', () => {
    expect(scorecardPlugin.getExtension('api:scorecard')).toMatchObject({
      kind: 'api',
      namespace: 'scorecard',
    });
    expect(createExtensionTester(scorecardApi).snapshot().id).toBe('api:test');
  });

  it('installs the drill-down page on the drill-down route ref', () => {
    expect(scorecardPlugin.getExtension('page:scorecard')).toMatchObject({
      kind: 'page',
      namespace: 'scorecard',
    });
    const tester = createExtensionTester(scorecardPage);

    expect(tester.get(coreExtensionData.routePath)).toBe(
      '/scorecard/aggregations/:aggregationId/metrics/:metricId',
    );
    expect(tester.get(coreExtensionData.routeRef)).toBe(
      scorecardDrillDownRouteRef,
    );
  });

  it('installs the entity tab on the scorecard route ref', () => {
    expect(
      scorecardPlugin.getExtension(
        'entity-content:scorecard/entity-content-scorecard',
      ),
    ).toMatchObject({
      kind: 'entity-content',
      name: 'entity-content-scorecard',
      namespace: 'scorecard',
    });
    const tester = createExtensionTester(scorecardEntityContent);

    expect(tester.get(coreExtensionData.routePath)).toBe('/scorecard');
    expect(tester.get(coreExtensionData.routeRef)).toBe(rootRouteRef);
  });

  it('installs a homepage widget blueprint', () => {
    expect(
      scorecardPlugin.getExtension(
        'home-page-widget:scorecard/scorecard-github-open-prs',
      ),
    ).toMatchObject({
      kind: 'home-page-widget',
      name: 'scorecard-github-open-prs',
      namespace: 'scorecard',
    });
    expect(
      createExtensionTester(aggregatedCardWithGithubOpenPrsWidget).snapshot()
        .id,
    ).toBe('home-page-widget:scorecard-github-open-prs');
  });

  it('installs the translations module for NFS discovery', () => {
    expect(scorecardTranslationsModule.$$type).toBe(
      '@backstage/FrontendModule',
    );
    expect(scorecardTranslationsModule.pluginId).toBe('app');
    expect(createExtensionTester(scorecardTranslation).snapshot().id).toBe(
      'translation:scorecard-translations',
    );
  });
});
