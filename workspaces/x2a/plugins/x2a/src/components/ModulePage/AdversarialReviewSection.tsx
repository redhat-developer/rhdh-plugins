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
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  ButtonGroup,
  Divider,
  Grid,
  Tooltip,
  Typography,
  makeStyles,
} from '@material-ui/core';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import WarningIcon from '@material-ui/icons/Warning';
import {
  AdversarialAgent,
  ArtifactKind,
  Job,
  JobStatus,
  MigrationPhase,
} from '@red-hat-developer-hub/backstage-plugin-x2a-common';

import { useTranslation } from '../../hooks/useTranslation';
import { useLogStream } from '../../hooks/useLogStream';
import { useClientService } from '../../ClientService';
import { ArtifactLink } from '../ArtifactLink';
import { ItemField } from '../ItemField';
import { PhaseStatus } from '../PhaseStatus';
import { TelemetrySection } from '../PhaseTelemetry';
import {
  canCancelPhase,
  downloadLogFile,
  formatDuration,
  getEffectiveDurationSeconds,
  humanizeDate,
  secondsBetween,
} from '../tools';
import { AdversarialAgentsSelector } from './AdversarialAgentsSelector';

const useStyles = makeStyles(theme => ({
  accordionSummaryContent: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1.5),
    flexWrap: 'wrap' as const,
    minWidth: 0,
  },
  accordionDetails: {
    flexDirection: 'column' as const,
  },
  logViewerWrapper: {
    height: 400,
    '& a[role="row"]': {
      userSelect: 'none',
    },
  },
  runRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: theme.spacing(2),
    flexWrap: 'wrap' as const,
  },
  selectorWrapper: {
    flex: '1 1 300px',
    minWidth: 0,
  },
  criticalWarningIcon: {
    color: theme.palette.warning.main ?? '#f57c00',
    fontSize: '1.1rem',
    verticalAlign: 'middle',
  },
  warningTooltip: {
    fontSize: theme.typography.body2.fontSize,
  },
}));

export const AdversarialReviewSection = ({
  job,
  projectId,
  moduleId,
  adversarialPhaseName,
  runPhase,
  targetRepoUrl,
  targetRepoBranch,
  canRun,
  onCancel,
  onRunAdversarial,
}: {
  job?: Job;
  projectId: string;
  moduleId: string;
  adversarialPhaseName: MigrationPhase;
  runPhase: 'analyze' | 'migrate';
  targetRepoUrl: string;
  targetRepoBranch: string;
  canRun: boolean;
  onCancel?: () => void;
  onRunAdversarial?: (phase: 'analyze' | 'migrate', agentIds: string[]) => void;
}) => {
  const { t } = useTranslation();
  const classes = useStyles();
  const clientService = useClientService();
  const empty = t('module.phases.none');
  const [showLog, setShowLog] = useState(false);
  const [selectedAgentIds, setSelectedAgentIds] = useState<string[]>([]);
  const [hasCriticalAgents, setHasCriticalAgents] = useState(false);
  const handleAgentsLoaded = useCallback((agents: AdversarialAgent[]) => {
    setHasCriticalAgents(agents.some(a => a.critical));
  }, []);

  const fetchLog = useCallback(
    () =>
      clientService.projectsProjectIdModulesModuleIdLogGet({
        path: { projectId, moduleId },
        query: { phase: adversarialPhaseName, streaming: true },
      }),
    [clientService, projectId, moduleId, adversarialPhaseName],
  );

  const { logText, logStreamHasData, logLoading, logError } = useLogStream({
    enabled: showLog && !!job,
    phaseId: job?.id,
    phaseStatus: job?.status,
    projectId,
    moduleId,
    phaseName: adversarialPhaseName,
    fetchLog,
  });

  const logViewerText = useMemo((): string => {
    if (logStreamHasData) return logText ?? '';
    if (logLoading) return t('modulePage.phases.logWaitingForStream');
    return logText || t('modulePage.phases.noLogsAvailable');
  }, [logStreamHasData, logText, logLoading, t]);

  const reportArtifact = job?.artifacts?.find(a =>
    ArtifactKind.from(a.type).equals(ArtifactKind.ADVERSARIAL_REPORT),
  );

  const reportJson = useMemo(() => {
    const jsonArtifact = job?.artifacts?.find(a =>
      ArtifactKind.from(a.type).equals(ArtifactKind.ADVERSARIAL_REPORT_JSON),
    );
    if (!jsonArtifact) return undefined;
    try {
      return JSON.parse(jsonArtifact.value) as {
        total_findings: number;
        total_critical_findings: number;
      };
    } catch {
      return undefined;
    }
  }, [job]);

  const durationSeconds = job ? getEffectiveDurationSeconds(job) : undefined;
  const duration =
    durationSeconds === undefined ? empty : formatDuration(t, durationSeconds);

  const attemptCount = job?.attemptCount ?? 1;
  const totalDuration =
    attemptCount > 1 && job?.firstAttemptAt && job?.finishedAt
      ? formatDuration(t, secondsBetween(job.firstAttemptAt, job.finishedAt))
      : undefined;

  if (!job && !canRun) return null;

  const jobStatus = job?.status ? JobStatus.from(job.status) : undefined;
  const isActive = jobStatus?.isActive() ?? false;

  return (
    <Box>
      {isActive && <Progress />}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box className={classes.accordionSummaryContent}>
            <Typography variant="subtitle2">
              {t('modulePage.phases.adversarialReview')}
            </Typography>
            {job ? (
              <>
                <PhaseStatus status={job.status} />
                {reportJson && (
                  <Typography variant="body2" color="textSecondary">
                    {reportJson.total_critical_findings}{' '}
                    {t('modulePage.phases.adversarialCriticalFindings')}{' '}
                    &middot;{' '}
                    {reportJson.total_findings -
                      reportJson.total_critical_findings}{' '}
                    {t('modulePage.phases.adversarialWarningFindings')}
                  </Typography>
                )}
                <Typography variant="body2" color="textSecondary">
                  {duration}
                </Typography>
              </>
            ) : (
              <>
                <Typography variant="body2" color="textSecondary">
                  {t('modulePage.phases.adversarialNoRuns')}
                </Typography>
                {canRun && hasCriticalAgents && (
                  <Tooltip
                    title={t(
                      'modulePage.phases.adversarialCriticalAgentsWarning',
                    )}
                    classes={{ tooltip: classes.warningTooltip }}
                  >
                    <WarningIcon className={classes.criticalWarningIcon} />
                  </Tooltip>
                )}
              </>
            )}
          </Box>
        </AccordionSummary>

        <AccordionDetails className={classes.accordionDetails}>
          {onRunAdversarial && canRun && (
            <>
              <Box className={classes.runRow}>
                <Box className={classes.selectorWrapper}>
                  <AdversarialAgentsSelector
                    selectedAgentIds={selectedAgentIds}
                    onSelectionChange={setSelectedAgentIds}
                    onAgentsLoaded={handleAgentsLoaded}
                    phase={runPhase}
                  />
                </Box>
                <Button
                  variant="outlined"
                  color="default"
                  size="small"
                  disabled={selectedAgentIds.length === 0}
                  onClick={() => onRunAdversarial(runPhase, selectedAgentIds)}
                >
                  {t('modulePage.phases.runAdversarialReview')}
                </Button>
              </Box>
              {job && <Divider style={{ margin: '16px 0' }} />}
            </>
          )}

          {job && (
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

              <Grid item xs={3}>
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
                  label={t('modulePage.phases.adversarialCriticalFindings')}
                  value={
                    reportJson !== undefined
                      ? String(reportJson.total_critical_findings)
                      : empty
                  }
                />
              </Grid>
              <Grid item xs={3}>
                <ItemField
                  label={t('modulePage.phases.adversarialWarningFindings')}
                  value={
                    reportJson !== undefined
                      ? String(
                          reportJson.total_findings -
                            reportJson.total_critical_findings,
                        )
                      : empty
                  }
                />
              </Grid>
              <Grid item xs={3} />

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
              <Grid item xs={3} />

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
                            `${adversarialPhaseName}-${projectId}`,
                          )
                        }
                      />
                    </div>
                  )}
                </Grid>
              )}

              <TelemetrySection telemetry={job.telemetry} />
            </Grid>
          )}
        </AccordionDetails>
      </Accordion>
    </Box>
  );
};
