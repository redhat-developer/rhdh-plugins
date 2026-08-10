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

import { useCallback, useMemo, useState } from 'react';

import { LogViewer, Progress } from '@backstage/core-components';
import {
  Box,
  Button,
  ButtonGroup,
  Divider,
  Grid,
  Typography,
  makeStyles,
} from '@material-ui/core';
import {
  ArtifactKind,
  Job,
  MigrationPhase,
} from '@red-hat-developer-hub/backstage-plugin-x2a-common';

import { useTranslation } from '../../hooks/useTranslation';
import { useLogStream } from '../../hooks/useLogStream';
import { useClientService } from '../../ClientService';
import { ItemField } from '../ItemField';
import { PhaseStatus } from '../PhaseStatus';
import { canCancelPhase } from '../tools';
import { PhaseTelemetry } from '../PhaseTelemetry';
import { ArtifactLink } from '../ArtifactLink';
import {
  downloadLogFile,
  formatDuration,
  getEffectiveDurationSeconds,
  humanizeDate,
  secondsBetween,
} from '../tools';

const useStyles = makeStyles(theme => ({
  logViewerWrapper: {
    height: 400,
    '& a[role="row"]': {
      userSelect: 'none',
    },
  },
  sectionTitle: {
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(1),
  },
}));

export const AdversarialJobDetails = ({
  job,
  projectId,
  moduleId,
  phaseName,
  targetRepoUrl,
  targetRepoBranch,
  onCancel,
}: {
  job?: Job;
  projectId: string;
  moduleId: string;
  phaseName: MigrationPhase;
  targetRepoUrl: string;
  targetRepoBranch: string;
  onCancel?: () => void;
}) => {
  const { t } = useTranslation();
  const classes = useStyles();
  const clientService = useClientService();
  const empty = t('module.phases.none');
  const [showLog, setShowLog] = useState(false);

  const fetchLog = useCallback(
    () =>
      clientService.projectsProjectIdModulesModuleIdLogGet({
        path: { projectId, moduleId },
        query: { phase: phaseName, streaming: true },
      }),
    [clientService, projectId, moduleId, phaseName],
  );

  const { logText, logStreamHasData, logLoading, logError } = useLogStream({
    enabled: showLog && !!job,
    phaseId: job?.id,
    phaseStatus: job?.status,
    projectId,
    moduleId,
    phaseName,
    fetchLog,
  });

  const logViewerText = useMemo((): string => {
    if (logStreamHasData) {
      return logText ?? '';
    }
    if (logLoading) {
      return t('modulePage.phases.logWaitingForStream');
    }
    return logText || t('modulePage.phases.noLogsAvailable');
  }, [logStreamHasData, logText, logLoading, t]);

  if (!job) return null;

  const reportArtifact = job.artifacts?.find(a =>
    ArtifactKind.from(a.type).equals(ArtifactKind.ADVERSARIAL_REPORT),
  );

  const durationSeconds = getEffectiveDurationSeconds(job);
  const duration =
    durationSeconds === undefined ? empty : formatDuration(t, durationSeconds);

  const attemptCount = job.attemptCount ?? 1;
  const totalDuration =
    attemptCount > 1 && job.firstAttemptAt && job.finishedAt
      ? formatDuration(t, secondsBetween(job.firstAttemptAt, job.finishedAt))
      : undefined;

  return (
    <Box mt={2}>
      <Divider />
      <Box mt={2}>
        <Typography variant="subtitle2" className={classes.sectionTitle}>
          {t('modulePage.phases.adversarialReview')}
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={2}>
            <ItemField
              label={t('modulePage.phases.status')}
              value={<PhaseStatus status={job.status} />}
            />
          </Grid>
          <Grid item xs={10}>
            <ItemField
              label={t('modulePage.phases.errorDetails')}
              value={job.errorDetails || empty}
            />
          </Grid>

          <Grid item xs={12}>
            <ItemField
              label={t('artifact.types.adversarial_report')}
              value={
                <ArtifactLink
                  artifact={reportArtifact}
                  targetRepoUrl={targetRepoUrl}
                  targetRepoBranch={targetRepoBranch}
                />
              }
            />
          </Grid>

          <Grid item xs={3}>
            <ItemField
              label={t('modulePage.phases.startedAt')}
              value={job.startedAt ? humanizeDate(job.startedAt) : empty}
            />
          </Grid>
          <Grid item xs={3}>
            <ItemField
              label={t('modulePage.phases.duration')}
              value={duration}
            />
          </Grid>
          <Grid item xs={3}>
            <ItemField
              label={t('modulePage.phases.attempts')}
              value={String(attemptCount)}
            />
          </Grid>
          <Grid item xs={3}>
            <ItemField
              label={t('modulePage.phases.totalElapsed')}
              value={totalDuration || empty}
            />
          </Grid>

          <Grid item xs={3}>
            <ItemField
              label={t('modulePage.phases.k8sJobName')}
              value={job.k8sJobName || empty}
            />
          </Grid>
          <Grid item xs={3}>
            <ItemField
              label={t('modulePage.phases.id')}
              value={job.id || empty}
            />
          </Grid>
          <Grid item xs={3}>
            <ItemField
              label={t('modulePage.phases.commitId')}
              value={job.commitId || empty}
            />
          </Grid>
          <Grid item xs={3}>
            {/* space holder */}
          </Grid>

          <Grid item xs={12}>
            <ButtonGroup>
              <Button
                variant="outlined"
                size="small"
                onClick={() => setShowLog(prev => !prev)}
              >
                {showLog
                  ? t('modulePage.phases.hideLog')
                  : t('modulePage.phases.viewLog')}
              </Button>
              {canCancelPhase(job.status) && onCancel && (
                <Button variant="outlined" onClick={onCancel}>
                  {t('modulePage.phases.cancel')}
                </Button>
              )}
            </ButtonGroup>
          </Grid>

          {showLog && (
            <Grid item xs={12}>
              {logLoading && <Progress />}
              {logError && (
                <Typography color="error">{logError.message}</Typography>
              )}
              {logText !== undefined && (
                <div className={classes.logViewerWrapper}>
                  <LogViewer
                    text={logViewerText}
                    onDownloadLog={() =>
                      downloadLogFile(
                        logText || '',
                        `${phaseName}-${projectId}`,
                      )
                    }
                  />
                </div>
              )}
            </Grid>
          )}

          {job.telemetry && (
            <>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  {t('modulePage.phases.telemetry.title')}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <PhaseTelemetry telemetry={job.telemetry} />
              </Grid>
            </>
          )}
        </Grid>
      </Box>
    </Box>
  );
};
