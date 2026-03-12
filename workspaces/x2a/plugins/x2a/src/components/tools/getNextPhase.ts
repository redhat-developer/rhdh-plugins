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
  MigrationPhase,
  Module,
  ModulePhase,
} from '@red-hat-developer-hub/backstage-plugin-x2a-common';

import { getLastPhaseReached } from './getLastPhaseReached';

const nextPhases: Record<MigrationPhase, ModulePhase | undefined> = {
  init: 'analyze',
  analyze: 'migrate',
  migrate: 'publish',
  publish: undefined,
};

export const getNextPhase = (module: Module): ModulePhase | undefined => {
  const lastJob = getLastPhaseReached(module, true);
  const lastPhase: MigrationPhase = lastJob?.phase || 'init';

  if (lastJob?.status === 'error' && lastPhase !== 'init') {
    // If the last is in error, let the user to rerun it.
    return lastPhase;
  }

  return nextPhases[lastPhase];
};
