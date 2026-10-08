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

import { makeRhdhEntityRelationsGraphCardExtension } from './rhdhEntityRelationsGraphCardExtension';

/**
 * Relations graph on Overview for API and System only (legacy RHDH). Components
 * use {@link entityDependenciesGraphCardExtension} on the Dependencies tab.
 *
 * @internal
 */
export const entityOverviewGraphCardExtension =
  makeRhdhEntityRelationsGraphCardExtension({
    name: 'rhdh-overview-relations',
    attachTo: {
      id: 'entity-content:catalog/overview',
      input: 'cards',
    },
    filter: isKind(['api', 'system']),
    type: 'content',
  });
