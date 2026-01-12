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

export const VALUE_UNAVAILABLE = '---' as const;
export const AVAILABLE = 'Available';
export const UNAVAILABLE = 'Unavailable';

// Translation keys for workflow status
export const WORKFLOW_STATUS_KEYS = {
  available: 'workflow.status.available',
  unavailable: 'workflow.status.unavailable',
} as const;
export const SHORT_REFRESH_INTERVAL = 5000;
export const LONG_REFRESH_INTERVAL = 15000;
export const DEFAULT_TABLE_PAGE_SIZE = 20;
