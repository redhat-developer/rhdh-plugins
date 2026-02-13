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
 * Default filter value that represents "all" or "no filter"
 *
 * @public
 */
export const FILTER_ALL_VALUE = 'All' as const;

/**
 * Frontend pagination constants
 *
 * @public
 */
export const FRONTEND_PAGINATION = {
  DEFAULT_PAGE: 0,
  DEFAULT_ROWS_PER_PAGE: 5,
  ROWS_PER_PAGE_OPTIONS: [5, 10, 25, 50],
};

/**
 * Time constants (in milliseconds)
 *
 * @public
 */
export const TIME_CONSTANTS = {
  SECOND_MS: 1000,
  MINUTE_MS: 60 * 1000,
  HOUR_MS: 60 * 60 * 1000,
  DAY_MS: 24 * 60 * 60 * 1000,
} as const;
