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

import { EntityContentLayoutBlueprint } from '@backstage/plugin-catalog-react/alpha';

/**
 * Column layout for the RHDH Dependencies entity tab.
 *
 * @internal
 */
export const entityDependenciesLayoutExtension =
  EntityContentLayoutBlueprint.makeWithOverrides({
    name: 'rhdh-dependencies',
    attachTo: {
      id: 'entity-content:catalog/rhdh-dependencies',
      input: 'layouts',
    },
    factory(originalFactory) {
      return originalFactory({
        loader: async () =>
          import('./entityDependenciesLayout').then(
            m => m.EntityDependenciesLayout,
          ),
      });
    },
  });
