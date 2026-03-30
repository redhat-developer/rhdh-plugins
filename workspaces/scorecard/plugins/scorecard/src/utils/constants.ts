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

/**
 * Color used when there's an error with scorecard data (e.g., threshold evaluation error, metric fetch error)
 */
export const SCORECARD_ERROR_STATE_COLOR = 'rhdh.general.cardBorderColor';

interface HeadCell {
  id: string;
  label: string;
  width: string;
  sortable: boolean;
}

export const SCORECARD_ENTITIES_TABLE_HEADERS: readonly HeadCell[] = [
  {
    id: 'status',
    label: 'entitiesPage.entitiesTable.header.metric',
    width: '12%',
    sortable: true,
  },
  {
    id: 'metricValue',
    label: 'entitiesPage.entitiesTable.header.value',
    width: '8%',
    sortable: true,
  },
  {
    id: 'entityName',
    label: 'entitiesPage.entitiesTable.header.entity',
    width: '28%',
    sortable: true,
  },
  {
    id: 'owner',
    label: 'entitiesPage.entitiesTable.header.owner',
    width: '20%',
    sortable: true,
  },
  {
    id: 'entityKind',
    label: 'entitiesPage.entitiesTable.header.kind',
    width: '12%',
    sortable: true,
  },
  {
    id: 'timestamp',
    label: 'entitiesPage.entitiesTable.header.lastUpdated',
    width: '20%',
    sortable: true,
  },
];
