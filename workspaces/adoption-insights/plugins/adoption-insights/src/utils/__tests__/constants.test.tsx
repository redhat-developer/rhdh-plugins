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
import {
  DATE_RANGE_OPTIONS,
  CATALOG_ENTITIES_TITLE,
  CATALOG_ENTITIES_TABLE_HEADERS,
  PLUGINS_TABLE_HEADERS,
  TECHDOCS_TABLE_HEADERS,
  TEMPLATE_TABLE_HEADERS,
} from '../constants';

describe('Constants', () => {
  test('DATE_RANGE_OPTIONS should have correct values', () => {
    expect(DATE_RANGE_OPTIONS).toEqual([
      { value: 'today', label: 'Today' },
      { value: 'last-week', label: 'Last week' },
      { value: 'last-month', label: 'Last month' },
      { value: 'last-28-days', label: 'Last 28 days' },
      { value: 'last-year', label: 'Last year' },
    ]);
  });

  test('CATALOG_ENTITIES_TITLE should be defined', () => {
    expect(CATALOG_ENTITIES_TITLE).toBe('Top catalog entities');
  });

  test('CATALOG_ENTITIES_TABLE_HEADERS should have correct headers', () => {
    expect(CATALOG_ENTITIES_TABLE_HEADERS).toEqual([
      { id: 'name', title: 'Name' },
      { id: 'kind', title: 'Kind' },
      { id: 'last-used', title: 'Last used' },
      { id: 'views', title: 'Views' },
    ]);
  });

  test('PLUGINS_TABLE_HEADERS should have correct headers', () => {
    expect(PLUGINS_TABLE_HEADERS).toEqual([
      { id: 'name', title: 'Name' },
      { id: 'trend', title: 'Trend' },
      { id: 'percent', title: '' },
      { id: 'views', title: 'Views' },
    ]);
  });

  test('TECHDOCS_TABLE_HEADERS should have correct headers', () => {
    expect(TECHDOCS_TABLE_HEADERS).toEqual([
      { id: 'name', title: 'Name' },
      { id: 'entity', title: 'Entity' },
      { id: 'last-used', title: 'Last used' },
      { id: 'views', title: 'Views' },
    ]);
  });

  test('TEMPLATE_TABLE_HEADERS should have correct headers', () => {
    expect(TEMPLATE_TABLE_HEADERS).toEqual([
      { id: 'name', title: 'Name' },
      { id: 'executions', title: 'Executions' },
    ]);
  });
});
