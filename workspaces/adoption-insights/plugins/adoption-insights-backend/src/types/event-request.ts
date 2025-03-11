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
export const QUERY_TYPES = [
  'total_users',
  'active_users',
  'top_plugins',
  'top_templates',
  'top_techdocs',
  'top_searches',
  'top_catalog_entities',
] as const;

export type QueryType = (typeof QUERY_TYPES)[number];

export interface QueryParams {
  type: QueryType;
  start_date: string;
  end_date: string;
  limit?: string;
  kind?: string;
  format?: string;
  licensedUsers?: number;
}
