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
 * Jira supported products
 * @public
 */
export type Product = 'datacenter' | 'cloud';

/**
 * Jira integration configuration
 * @public
 */
export interface JiraConfig {
  baseUrl: string;
  token: string;
  product: Product;
  apiVersion?: string;
}

/**
 * Jira open issues options
 * @public
 */
export interface JiraOptions {
  mandatoryFilter?: string;
  customFilter?: string;
}

/**
 * Jira request filters
 * @public
 */
export interface JiraEntityFilters {
  project: string;
  component?: string;
  label?: string;
  team?: string;
  customFilter?: string;
}
