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
import {
  JobStatus,
  Project,
} from '@red-hat-developer-hub/backstage-plugin-x2a-common';

/**
 * A project is eligible for migration plan resync when:
 * - A migration plan already exists (init phase succeeded at least once)
 * - No init job is currently running
 *
 * This is distinct from `isEligibleForRetriggerInit` which covers the case
 * where the first init failed and needs to be re-run from scratch.
 */
export const isEligibleForResync = (project: Project): boolean => {
  const hasMigrationPlan = !!project.migrationPlan;
  const initJobStatus = project.initJob?.status;
  const initRunning =
    !!initJobStatus && JobStatus.from(initJobStatus).isActive();

  return hasMigrationPlan && !initRunning;
};
