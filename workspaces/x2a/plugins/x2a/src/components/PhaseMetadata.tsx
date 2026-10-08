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

import { type ReactNode } from 'react';

import { Box } from '@material-ui/core';
import AccessTimeIcon from '@material-ui/icons/AccessTime';
import CloudQueueIcon from '@material-ui/icons/CloudQueue';
import CodeIcon from '@material-ui/icons/Code';
import FingerprintIcon from '@material-ui/icons/Fingerprint';
import RepeatIcon from '@material-ui/icons/Repeat';
import TimerIcon from '@material-ui/icons/Timer';
import { Job } from '@red-hat-developer-hub/backstage-plugin-x2a-common';

import { useTranslation } from '../hooks/useTranslation';
import { PhaseField } from './PhaseField';
import { TruncatedId } from './TruncatedId';
import {
  formatDuration,
  getEffectiveDurationSeconds,
  humanizeDate,
  secondsBetween,
} from './tools';

export const PhaseMetadata = ({
  phase,
  status,
}: {
  phase?: Job;
  status: ReactNode;
}) => {
  const { t } = useTranslation();
  const empty = t('module.phases.none');
  const durationSeconds = phase
    ? getEffectiveDurationSeconds(phase)
    : undefined;
  const duration =
    durationSeconds === undefined ? empty : formatDuration(t, durationSeconds);
  const attemptCount = phase?.attemptCount ?? (phase ? 1 : undefined);
  const totalDuration =
    attemptCount &&
    attemptCount > 1 &&
    phase?.firstAttemptAt &&
    phase.finishedAt
      ? formatDuration(
          t,
          secondsBetween(phase.firstAttemptAt, phase.finishedAt),
        )
      : undefined;

  return (
    <Box display="flex" flexWrap="wrap" style={{ gap: '16px 48px' }}>
      <PhaseField label={t('modulePage.phases.status')}>{status}</PhaseField>
      <PhaseField
        label={t('modulePage.phases.startedAt')}
        icon={AccessTimeIcon}
      >
        {phase?.startedAt ? humanizeDate(phase.startedAt) : empty}
      </PhaseField>
      <PhaseField label={t('modulePage.phases.duration')} icon={TimerIcon}>
        {duration}
      </PhaseField>
      <PhaseField label={t('modulePage.phases.attempts')} icon={RepeatIcon}>
        {String(attemptCount ?? empty)}
      </PhaseField>
      {totalDuration && (
        <PhaseField
          label={t('modulePage.phases.totalElapsed')}
          icon={TimerIcon}
        >
          {totalDuration}
        </PhaseField>
      )}
      {phase?.k8sJobName && (
        <PhaseField
          label={t('modulePage.phases.k8sJobName')}
          icon={CloudQueueIcon}
        >
          <TruncatedId value={phase.k8sJobName} />
        </PhaseField>
      )}
      {phase?.id && (
        <PhaseField label={t('modulePage.phases.id')} icon={FingerprintIcon}>
          <TruncatedId value={phase.id} />
        </PhaseField>
      )}
      {phase?.commitId && (
        <PhaseField label={t('modulePage.phases.commitId')} icon={CodeIcon}>
          <TruncatedId value={phase.commitId} />
        </PhaseField>
      )}
    </Box>
  );
};
