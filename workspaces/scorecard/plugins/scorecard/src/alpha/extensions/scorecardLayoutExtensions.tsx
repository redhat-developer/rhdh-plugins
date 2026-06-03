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

import { ScorecardEntityContentLayoutBlueprint } from '../blueprints';

/**
 * Grid view layout extension for the Scorecard entity tab.
 *
 * Extension ID: scorecard-layout:catalog/scorecard-entity-layout-grid
 * @alpha
 */
export const scorecardEntityLayoutGrid =
  ScorecardEntityContentLayoutBlueprint.make({
    name: 'scorecard-entity-layout-grid',
    params: {
      title: 'Grid',
      loader: () =>
        import(
          '../../components/Scorecard/ScorecardEntityContentGridView'
        ).then(m => m.ScorecardEntityContentGridView),
    },
  });

/**
 * List view layout extension for the Scorecard entity tab.
 *
 * Extension ID: scorecard-layout:catalog/scorecard-entity-layout-list
 * @alpha
 */
export const scorecardEntityLayoutList =
  ScorecardEntityContentLayoutBlueprint.make({
    name: 'scorecard-entity-layout-list',
    params: {
      title: 'List',
      loader: () =>
        import('../../components/Scorecard/ScorecardEntityListView').then(
          m => m.ScorecardEntityListView,
        ),
    },
  });
