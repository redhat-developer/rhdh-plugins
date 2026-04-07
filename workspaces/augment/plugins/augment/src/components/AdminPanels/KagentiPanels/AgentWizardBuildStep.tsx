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

import type { FC } from 'react';
import { useMemo } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import LinearProgress from '@mui/material/LinearProgress';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import RefreshIcon from '@mui/icons-material/Refresh';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import type { BuildProgress } from './agentWizardTypes';

export interface AgentWizardBuildStepProps {
  progress: BuildProgress;
  onRetry: () => void;
  onClose: () => void;
  resourceLabel?: string;
}

interface PhaseStep {
  label: string;
  state: 'pending' | 'active' | 'done' | 'error';
}

function formatElapsed(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  if (min === 0) return `${sec}s`;
  return `${min}m ${sec}s`;
}

function stepLabelColor(
  state: PhaseStep['state'],
  palette: {
    text: { primary: string; disabled: string };
    error: { main: string };
  },
): string {
  if (state === 'pending') return palette.text.disabled;
  if (state === 'error') return palette.error.main;
  return palette.text.primary;
}

function derivePhaseSteps(
  progress: BuildProgress,
  resourceLabel: string,
): PhaseStep[] {
  const { phase } = progress;
  const capLabel =
    resourceLabel.charAt(0).toUpperCase() + resourceLabel.slice(1);
  const steps: PhaseStep[] = [
    { label: 'Build submitted', state: 'done' },
    { label: 'Building container image', state: 'pending' },
    { label: `Deploying ${resourceLabel}`, state: 'pending' },
    { label: `${capLabel} ready`, state: 'pending' },
  ];

  if (phase === 'building') {
    steps[1].state = 'active';
  } else if (phase === 'finalizing') {
    steps[1].state = 'done';
    steps[2].state = 'active';
  } else if (phase === 'complete') {
    steps[1].state = 'done';
    steps[2].state = 'done';
    steps[3].state = 'done';
  } else if (phase === 'failed') {
    if (progress.deployFailedAfterBuild) {
      steps[1].state = 'done';
      steps[2].state = 'error';
    } else {
      steps[1].state = 'error';
    }
  }

  return steps;
}

export const AgentWizardBuildStep: FC<AgentWizardBuildStepProps> = ({
  progress,
  onRetry,
  onClose,
  resourceLabel = 'agent',
}) => {
  const theme = useTheme();
  const steps = useMemo(
    () => derivePhaseSteps(progress, resourceLabel),
    [progress, resourceLabel],
  );

  const isDone = progress.phase === 'complete';
  const isFailed = progress.phase === 'failed';
  const isActive = !isDone && !isFailed;
  const retryLabel = progress.deployFailedAfterBuild
    ? 'Retry Deploy'
    : 'Retry Build';

  return (
    <Stack spacing={3} sx={{ py: 1 }}>
      {/* Phase timeline */}
      <Box>
        {steps.map((step, idx) => {
          const isLast = idx === steps.length - 1;
          return (
            <Box
              key={step.label}
              sx={{
                display: 'flex',
                alignItems: 'flex-start',
                mb: isLast ? 0 : 0.5,
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  mr: 1.5,
                  minWidth: 28,
                }}
              >
                {step.state === 'done' && (
                  <CheckCircleIcon
                    sx={{ fontSize: 22, color: theme.palette.success.main }}
                  />
                )}
                {step.state === 'active' && (
                  <CircularProgress size={20} thickness={5} />
                )}
                {step.state === 'error' && (
                  <ErrorIcon
                    sx={{ fontSize: 22, color: theme.palette.error.main }}
                  />
                )}
                {step.state === 'pending' && (
                  <Box
                    sx={{
                      width: 16,
                      height: 16,
                      borderRadius: '50%',
                      border: `2px solid ${theme.palette.divider}`,
                      mt: '3px',
                    }}
                  />
                )}
                {!isLast && (
                  <Box
                    sx={{
                      width: 2,
                      height: 20,
                      bgcolor:
                        step.state === 'done'
                          ? theme.palette.success.main
                          : theme.palette.divider,
                      mt: 0.25,
                    }}
                  />
                )}
              </Box>
              <Typography
                variant="body2"
                sx={{
                  pt: '2px',
                  fontWeight: step.state === 'active' ? 600 : 400,
                  color: stepLabelColor(step.state, theme.palette),
                }}
              >
                {step.label}
              </Typography>
            </Box>
          );
        })}
      </Box>

      {/* Progress bar for active builds */}
      {isActive && (
        <LinearProgress
          variant="indeterminate"
          sx={{ borderRadius: 1, height: 4 }}
        />
      )}

      {/* Elapsed time */}
      {progress.elapsedMs > 0 && (
        <Typography variant="caption" color="text.secondary">
          Elapsed: {formatElapsed(progress.elapsedMs)}
        </Typography>
      )}

      {/* Poll error warning */}
      {progress.pollErrorCount > 0 && isActive && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            p: 1.5,
            borderRadius: 1.5,
            bgcolor: `${theme.palette.warning.main}14`,
            border: `1px solid ${theme.palette.warning.main}40`,
          }}
        >
          <WarningAmberIcon
            sx={{ fontSize: 18, color: theme.palette.warning.main }}
          />
          <Typography
            variant="caption"
            sx={{ color: theme.palette.warning.dark }}
          >
            Having trouble reaching the build service. Retrying…
          </Typography>
        </Box>
      )}

      {/* Build details */}
      <Box
        sx={{
          p: 2,
          borderRadius: 2,
          bgcolor: theme.palette.background.paper,
          border: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Typography
          variant="subtitle2"
          sx={{ mb: 1, fontWeight: 600, fontSize: '0.8rem' }}
        >
          Build details
        </Typography>
        <Stack spacing={0.75}>
          {progress.buildRunName && (
            <DetailRow label="Build run" value={progress.buildRunName} />
          )}
          {progress.buildRunPhase && (
            <DetailRow
              label="Phase"
              value={
                <Chip
                  label={progress.buildRunPhase}
                  size="small"
                  sx={{
                    height: 22,
                    fontSize: '0.7rem',
                    bgcolor: phaseChipColor(
                      progress.buildRunPhase,
                      theme.palette,
                    ),
                    color: '#fff',
                  }}
                />
              }
            />
          )}
          {progress.strategy && (
            <DetailRow label="Strategy" value={progress.strategy} />
          )}
          {progress.gitUrl && (
            <DetailRow label="Git" value={progress.gitUrl} mono />
          )}
          {progress.outputImage && (
            <DetailRow label="Image" value={progress.outputImage} mono />
          )}
        </Stack>
      </Box>

      {/* Status message */}
      {progress.message && !isFailed && (
        <Typography variant="body2" color="text.secondary">
          {progress.message}
        </Typography>
      )}

      {/* Failure message */}
      {isFailed && progress.failureMessage && (
        <Box
          sx={{
            p: 2,
            borderRadius: 2,
            bgcolor: `${theme.palette.error.main}12`,
            border: `1px solid ${theme.palette.error.main}40`,
          }}
        >
          <Typography
            variant="body2"
            sx={{ color: theme.palette.error.main, wordBreak: 'break-word' }}
          >
            {progress.failureMessage}
          </Typography>
        </Box>
      )}

      {/* Success banner */}
      {isDone && (
        <Box
          sx={{
            p: 2,
            borderRadius: 2,
            bgcolor: `${theme.palette.success.main}12`,
            border: `1px solid ${theme.palette.success.main}40`,
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
          }}
        >
          <RocketLaunchIcon
            sx={{ color: theme.palette.success.main, fontSize: 28 }}
          />
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              {resourceLabel.charAt(0).toUpperCase() + resourceLabel.slice(1)}{' '}
              deployed successfully
            </Typography>
            {progress.message && (
              <Typography variant="caption" color="text.secondary">
                {progress.message}
              </Typography>
            )}
          </Box>
        </Box>
      )}

      {/* Action buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 1 }}>
        {isActive ? (
          <Button
            size="small"
            onClick={onClose}
            sx={{ textTransform: 'none', color: theme.palette.text.secondary }}
          >
            Run in background
          </Button>
        ) : (
          <Box />
        )}
        <Box sx={{ display: 'flex', gap: 1 }}>
          {isFailed && (
            <Button
              variant="outlined"
              size="small"
              startIcon={<RefreshIcon />}
              onClick={onRetry}
              sx={{ textTransform: 'none' }}
            >
              {retryLabel}
            </Button>
          )}
          {(isDone || isFailed) && (
            <Button
              variant="contained"
              size="small"
              onClick={onClose}
              sx={{ textTransform: 'none' }}
            >
              {isDone ? 'Done' : 'Close'}
            </Button>
          )}
        </Box>
      </Box>
    </Stack>
  );
};

function DetailRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
      <Typography
        variant="caption"
        sx={{
          color: 'text.secondary',
          minWidth: 80,
          fontWeight: 500,
          flexShrink: 0,
        }}
      >
        {label}
      </Typography>
      {typeof value === 'string' ? (
        <Typography
          variant="caption"
          sx={{
            fontFamily: mono ? 'monospace' : undefined,
            fontSize: mono ? '0.7rem' : undefined,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {value}
        </Typography>
      ) : (
        value
      )}
    </Box>
  );
}

function phaseChipColor(
  phase: string | undefined,
  palette: {
    success: { main: string };
    warning: { main: string };
    error: { main: string };
    info: { main: string };
  },
): string {
  switch (phase?.toLowerCase()) {
    case 'succeeded':
      return palette.success.main;
    case 'running':
    case 'pending':
      return palette.info.main;
    case 'failed':
      return palette.error.main;
    default:
      return palette.warning.main;
  }
}
