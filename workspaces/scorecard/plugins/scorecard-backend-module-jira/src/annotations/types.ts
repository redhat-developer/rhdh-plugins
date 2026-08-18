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

/** Maps filter slots to catalog annotation names (e.g. `jira/project-key`). */
export interface JiraFilterAnnotations {
  project: string;
  component?: string;
  label?: string;
  team?: string;
  customFilter?: string;
}

/**
 * Per-slot JQL clause strings produced from entity annotations
 * (e.g. `project: project = "FOO"`).
 */
export interface JiraJqlFilters {
  project: string;
  component?: string;
  label?: string;
  team?: string;
  customFilter?: string;
}
