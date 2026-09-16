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
import { EntityContentBlueprint } from '@backstage/plugin-catalog-react/alpha';

import { entityDependenciesContentExtension } from './entityDependenciesContentExtension';
import { legacyTabLoader } from './entityPage/legacyTabLoader';

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
 * Legacy RHDH entity tabs registered via NFS {@link EntityContentBlueprint}.
 * Dependencies is NFS-composed from entity cards; System Diagram tab still uses a custom tab body.
 *
 * @internal
 */
export const entityPageTabExtensions = [
  entityDependenciesContentExtension,
  systemDiagramTab,
];
