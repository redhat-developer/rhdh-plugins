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

export const MODULE_STATUS_COLORS = {
  finished: '#00C49F',
  waiting: '#4CAF50',
  pending: '#FF8042',
  running: '#0088FE',
  error: '#FF0000',
  cancelled: '#9E9E9E',
} as const;

// States that mean the same thing share one value, so a change to the module
// color updates the project bar too.
export const PROJECT_STATE_COLORS = {
  created: MODULE_STATUS_COLORS.pending,
  initializing: MODULE_STATUS_COLORS.waiting,
  initialized: '#26C6DA',
  inProgress: MODULE_STATUS_COLORS.running,
  completed: MODULE_STATUS_COLORS.finished,
  failed: MODULE_STATUS_COLORS.error,
} as const;
