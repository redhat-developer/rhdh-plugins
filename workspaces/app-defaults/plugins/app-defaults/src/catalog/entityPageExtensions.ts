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

import { isKind } from '@backstage/plugin-catalog';
import catalogPlugin from '@backstage/plugin-catalog/alpha';
import { EntityContentBlueprint } from '@backstage/plugin-catalog-react/alpha';

import { legacyTabLoader } from './entityPage/legacyTabLoader';

const overviewOverride = catalogPlugin
  .getExtension('entity-content:catalog/overview')
  .override({
    factory(originalFactory) {
      return originalFactory({
        params: {
          path: '/',
          title: 'Overview',
          group: 'overview',
          loader: legacyTabLoader(() =>
            import('./entityPage/OverviewTabContent').then(m => ({
              Content: m.OverviewTabContent,
            })),
          ),
        },
      });
    },
  });

const dependenciesTab = EntityContentBlueprint.make({
  name: 'rhdh-dependencies',
  params: {
    path: '/dependencies',
    title: 'Dependencies',
    filter: isKind('component'),
    loader: legacyTabLoader(() =>
      import('./entityPage/DependenciesTabContent').then(m => ({
        Content: m.DependenciesTabContent,
      })),
    ),
  },
});

const systemDiagramTab = EntityContentBlueprint.make({
  name: 'rhdh-system-diagram',
  params: {
    path: '/system',
    title: 'System Diagram',
    filter: isKind('system'),
    loader: legacyTabLoader(() =>
      import('./entityPage/DiagramTabContent').then(m => ({
        Content: m.DiagramTabContent,
      })),
    ),
  },
});

/**
 * Legacy RHDH entity tabs on the catalog plugin (Overview, Dependencies, Diagram).
 * Api + Definition tabs are registered via {@link entityPageApiDocsExtensions}.
 *
 * @internal
 */
export const entityPageCatalogExtensions = [
  overviewOverride,
  dependenciesTab,
  systemDiagramTab,
];
