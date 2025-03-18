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
export const DATE_RANGE_OPTIONS = [
  { value: 'today', label: 'Today' },
  { value: 'last-week', label: 'Last week' },
  { value: 'last-month', label: 'Last month' },
  { value: 'last-year', label: 'Last year' },
];

export const CATALOG_ENTITIES_TITLE = 'Top catalog entities';

export const CATALOG_ENTITIES_TABLE_HEADERS = [
  { id: 'name', title: 'Name' },
  { id: 'kind', title: 'Kind' },
  { id: 'last-used', title: 'Last used' },
  { id: 'views', title: 'Views' },
];

export const PLUGINS_TABLE_HEADERS = [
  { id: 'name', title: 'Name' },
  { id: 'trend', title: 'Trend' },
  { id: 'percent', title: '' },
  { id: 'views', title: 'Views' },
];

export const TECHDOCS_TABLE_HEADERS = [
  { id: 'name', title: 'Name' },
  { id: 'entity', title: 'Entity' },
  { id: 'last-used', title: 'Last used' },
  { id: 'views', title: 'Views' },
];

export const TEMPLATE_TABLE_HEADERS = [
  { id: 'name', title: 'Name' },
  { id: 'executions', title: 'Executions' },
];
