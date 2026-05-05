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
 * Default table page size in the UI.
 * @public
 */
export const DEFAULT_PAGE_SIZE = 10;

/**
 * Default table page sort in the UI.
 * @public
 */
export const DEFAULT_PAGE_SORT = 'created_at';

/**
 * Default table page order in the UI.
 * @public
 */
export const DEFAULT_PAGE_ORDER = 'desc';

/**
 * Path to the default conversion project scaffolder template.
 *
 * This might be subject to exposing as a plugin configuration option in the future.
 *
 * @public
 */
export const CREATE_PROJECT_TEMPLATE_PATH =
  '/create/templates/default/x2a-conversion-project-template';

/**
 * Prefix for the scaffolder secret keys for the SCM provider tokens.
 *
 * @public
 */
export const SCAFFOLDER_SECRET_PREFIX = 'OAUTH_TOKEN_';

/**
 * Maximum number of projects to run in parallel for a bulk run.
 * This is a trade-off between performance and resource usage.
 * For every project, we issue one API request per eligible module.
 *
 * @public
 */
export const MAX_CONCURRENT_BULK_RUN = 3;

/**
 * Polling interval for refreshing data views.
 *
 * @public
 */
export const POLLING_INTERVAL_MS = 10 * 1000;

/**
 * Limit of increasing of the polling interval on consecutive errors (like server not reachable).
 *
 * @public
 */
export const MAX_BACKOFF_MS = 5 * 60 * 1000;

/**
 * When sorting by a computed field loads more projects than this
 * threshold, a warning is logged on the backend.
 *
 * @public
 */
export const IN_MEMORY_SORT_WARN_THRESHOLD = 100;

/**
 * When sorting by status, if the number of projects is greater than this
 * threshold, the sort will not be available on the FE side due to performance reasons.
 *
 * @public
 */
export const PROJECT_LIST_SORT_BY_STATUS_HARD_THRESHOLD = 500;

/**
 * URL hash for the project details page deep link that opens the init re-run confirmation flow.
 *
 * @public
 */
export const RUN_INIT_DEEP_LINK_HASH = '#runinit';

/**
 * URL hash for the project details page deep link that opens the bulk “run all
 * eligible modules” confirmation (next phase where possible).
 *
 * @public
 */
export const RUN_NEXT_DEEP_LINK_HASH = '#runnext';
