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
import apiDocsPlugin from '@backstage/plugin-api-docs/alpha';

import { legacyTabLoader } from '../catalog/entityPage/legacyTabLoader';
import { isServiceComponent } from '../catalog/entityPage/utils';

const apiTabOverride = apiDocsPlugin
  .getExtension('entity-content:api-docs/apis')
  .override({
    factory(originalFactory) {
      return originalFactory({
        params: {
          path: '/api',
          title: 'Api',
          filter: isServiceComponent,
          loader: legacyTabLoader(() =>
            import('../catalog/entityPage/ApiTabContent').then(m => ({
              Content: m.ApiTabContent,
            })),
          ),
        },
      });
    },
  });

const definitionTabOverride = apiDocsPlugin
  .getExtension('entity-content:api-docs/definition')
  .override({
    factory(originalFactory) {
      return originalFactory({
        params: {
          path: '/definition',
          title: 'Definition',
          filter: isKind('api'),
          loader: legacyTabLoader(() =>
            import('../catalog/entityPage/DefinitionTabContent').then(m => ({
              Content: m.DefinitionTabContent,
            })),
          ),
        },
      });
    },
  });

/**
 * Legacy RHDH API / Definition entity tabs.
 *
 * @internal
 */
export const entityPageApiDocsExtensions = [
  apiTabOverride,
  definitionTabOverride,
];
