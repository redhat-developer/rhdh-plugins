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
import { Direction } from '@backstage/plugin-catalog-graph';

import { makeRhdhEntityRelationsGraphCardExtension } from './rhdhEntityRelationsGraphCardExtension';

/**
 * Relations graph on the Dependencies tab for components only. API and System
 * use {@link entityOverviewGraphCardExtension} on Overview.
 *
 * @internal
 */
export const entityDependenciesGraphCardExtension =
  makeRhdhEntityRelationsGraphCardExtension({
    name: 'rhdh-component-dependencies-relations',
    attachTo: {
      id: 'entity-content:catalog/rhdh-component-dependencies',
      input: 'cards',
    },
    filter: isKind('component'),
    type: 'info',
    defaultDirection: Direction.TOP_BOTTOM,
  });
