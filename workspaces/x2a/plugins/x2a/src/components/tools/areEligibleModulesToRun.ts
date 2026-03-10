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
import { Project } from '@red-hat-developer-hub/backstage-plugin-x2a-common';

/**
 * Returns true when the project has at least one module whose next
 * phase can be triggered by a Bulk Run action (i.e. modules that
 * completed a non-final phase and are waiting for the next one).
 */
export const areEligibleModulesToRun = (project: Project): boolean => {
  const summary = project.status?.modulesSummary;
  if (!summary) {
    return false;
  }

  return summary.waiting > 0;
};
