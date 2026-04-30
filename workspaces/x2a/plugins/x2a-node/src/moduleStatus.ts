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

import type {
  Job,
  ModuleStatus,
} from '@red-hat-developer-hub/backstage-plugin-x2a-common';

/**
 * Module's status is the status of the last job of its most-advanced phase.
 *
 * If the most-advanced phase's job was cancelled, the module status is cancelled.
 *
 * If a later retrigger for an earlier phase fails (e.g. when retrigger on analyze
 * fails but a former migrate already passed), the modules status should not change.
 *
 * @public
 */
export function calculateModuleStatus({
  analyze,
  migrate,
  publish,
}: {
  analyze?: Job;
  migrate?: Job;
  publish?: Job;
}): { status: ModuleStatus; errorDetails?: string } {
  const latestPhaseJob = publish ?? migrate ?? analyze;
  if (latestPhaseJob?.status === 'cancelled') {
    return { status: 'cancelled', errorDetails: undefined };
  }

  if (publish) {
    return { status: publish.status, errorDetails: publish.errorDetails };
  }
  if (migrate) {
    return { status: migrate.status, errorDetails: migrate.errorDetails };
  }
  if (analyze) {
    return { status: analyze.status, errorDetails: analyze.errorDetails };
  }

  return { status: 'pending', errorDetails: undefined };
}
