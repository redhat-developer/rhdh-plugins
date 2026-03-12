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
import { Module } from '@red-hat-developer-hub/backstage-plugin-x2a-common';

import { getLastPhaseReached } from './getLastPhaseReached';
import { getNextPhase } from './getNextPhase';

export const canRunNextPhase = (module: Module): boolean => {
  const nextPhase = getNextPhase(module);
  if (!nextPhase) {
    return false;
  }

  // TODO: Consider check whether we have all artifacts instead of just checking the last job status
  const lastJob = getLastPhaseReached(module);
  if (!lastJob || lastJob.status === 'success') {
    return true;
  }

  return false;
};
