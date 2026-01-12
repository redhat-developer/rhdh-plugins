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
  { value: 'today', labelKey: 'header.dateRange.today' },
  { value: 'last-week', labelKey: 'header.dateRange.lastWeek' },
  { value: 'last-month', labelKey: 'header.dateRange.lastMonth' },
  { value: 'last-28-days', labelKey: 'header.dateRange.last28Days' },
  { value: 'last-year', labelKey: 'header.dateRange.lastYear' },
];

export const CATALOG_ENTITIES_TABLE_HEADERS = [
  { id: 'name', titleKey: 'table.headers.name' },
  { id: 'kind', titleKey: 'table.headers.kind' },
  { id: 'last-used', titleKey: 'table.headers.lastUsed' },
  { id: 'views', titleKey: 'table.headers.views' },
];

export const PLUGINS_TABLE_HEADERS = [
  { id: 'name', titleKey: 'table.headers.name' },
  { id: 'trend', titleKey: 'table.headers.trend' },
  { id: 'percent', titleKey: '' },
  { id: 'views', titleKey: 'table.headers.views' },
];

export const TECHDOCS_TABLE_HEADERS = [
  { id: 'name', titleKey: 'table.headers.name' },
  { id: 'entity', titleKey: 'table.headers.entity' },
  { id: 'last-used', titleKey: 'table.headers.lastUsed' },
  { id: 'views', titleKey: 'table.headers.views' },
];

export const TEMPLATE_TABLE_HEADERS = [
  { id: 'name', titleKey: 'table.headers.name' },
  { id: 'executions', titleKey: 'table.headers.executions' },
];
