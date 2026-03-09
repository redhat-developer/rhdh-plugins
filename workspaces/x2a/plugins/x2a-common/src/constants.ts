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
 * Path to the default chef conversion project scaffolder template.
 *
 * This might be subject to exposing as a plugin configuration option in the future.
 *
 * @public
 */
export const CREATE_CHEF_PROJECT_TEMPLATE_PATH =
  '/create/templates/default/chef-conversion-project-template';
