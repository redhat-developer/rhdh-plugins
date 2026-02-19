/**
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

import { MigrationPhase } from '@red-hat-developer-hub/backstage-plugin-x2a-common';

import { useTranslation } from '../../hooks/useTranslation';

class PhaseStepMapper {
  private readonly phaseToStep: Record<MigrationPhase, number> = {
    init: 0,
    analyze: 1,
    migrate: 2,
    publish: 3,
  };

  getStepNumber(phase: MigrationPhase): number {
    return this.phaseToStep[phase];
  }
}

export const CurrentPhaseCell = ({ phase }: { phase?: MigrationPhase }) => {
  const { t } = useTranslation();

  if (!phase || phase === 'init') {
    return <div>{t('module.notStarted')}</div>;
  }

  const mapper = new PhaseStepMapper();
  const stepNumber = mapper.getStepNumber(phase);
  const phaseName = t(`module.phases.${phase}`);
  const displayText = `${phaseName} (Step ${stepNumber} of 3)`;

  return <div>{displayText}</div>;
};
