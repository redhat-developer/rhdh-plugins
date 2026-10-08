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

export const GITHUB_PROJECT_ANNOTATION = 'github.com/project-slug';
export const GITHUB_BATCH_SIZE = 100;

/**
 * Default client-side cap for GitHub list/compare fetches (deployments,
 * deployment workflow runs, and commits between SHAs).
 */
export const DEFAULT_DEPLOYMENT_FETCH_ITEMS_LIMIT = 1000;
