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

import type { ReactNode } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import type { KagentiBuildInfo } from '@red-hat-developer-hub/backstage-plugin-augment-common';
import { PropertyRow } from './KagentiPropertyRow';
import { buildRunPhaseChipColor, formatDateTime } from './kagentiDisplayUtils';

export interface ToolBuildSectionProps {
  buildLoading: boolean;
  buildFetchFailed: boolean;
  buildInfo: KagentiBuildInfo | null;
  triggeringBuild: boolean;
  finalizingBuild: boolean;
  onTriggerBuild: () => void;
  onFinalizeBuild: () => void;
}

export function ToolBuildSection({
  buildLoading,
  buildFetchFailed,
  buildInfo,
  triggeringBuild,
  finalizingBuild,
  onTriggerBuild,
  onFinalizeBuild,
}: ToolBuildSectionProps): ReactNode {
  if (buildLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
        <CircularProgress size={28} />
      </Box>
    );
  }
  if (buildFetchFailed || !buildInfo) {
    return (
      <Typography variant="body2" color="text.secondary">
        No build pipeline configured
      </Typography>
    );
  }

  const phaseLower = buildInfo.buildRunPhase?.toLowerCase();
  const buildIsRunning =
    phaseLower === 'running' ||
    phaseLower === 'pending' ||
    phaseLower === 'workqueue';
  const canTriggerBuild =
    buildInfo.buildRegistered && !buildIsRunning && !triggeringBuild;
  const showFinalize =
    buildInfo.hasBuildRun && buildInfo.buildRunPhase === 'Succeeded';

  return (
    <>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1.5 }}>
        <Chip
          size="small"
          label={
            buildInfo.buildRegistered
              ? 'Build registered'
              : 'Build not registered'
          }
          color={buildInfo.buildRegistered ? 'success' : 'default'}
          variant="outlined"
        />
      </Box>
      <PropertyRow label="Strategy" value={buildInfo.strategy || '—'} />
      <PropertyRow label="Output image" value={buildInfo.outputImage || '—'} />
      <Divider sx={{ my: 1.5 }} />
      <Typography variant="caption" color="text.secondary" fontWeight={600}>
        Git
      </Typography>
      <PropertyRow label="Git URL" value={buildInfo.gitUrl || '—'} />
      <PropertyRow label="Git revision" value={buildInfo.gitRevision || '—'} />
      <PropertyRow
        label="Context directory"
        value={buildInfo.contextDir || '—'}
      />
      {buildInfo.hasBuildRun && (
        <>
          <Divider sx={{ my: 1.5 }} />
          <Typography variant="caption" color="text.secondary" fontWeight={600}>
            Build run
          </Typography>
          <PropertyRow
            label="Build run name"
            value={buildInfo.buildRunName ?? '—'}
          />
          <Box sx={{ mb: 1 }}>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}
            >
              Phase
            </Typography>
            {buildInfo.buildRunPhase ? (
              <Chip
                size="small"
                label={buildInfo.buildRunPhase}
                color={buildRunPhaseChipColor(buildInfo.buildRunPhase)}
              />
            ) : (
              <Typography variant="body2">—</Typography>
            )}
          </Box>
          <PropertyRow
            label="Started"
            value={formatDateTime(buildInfo.buildRunStartTime)}
          />
          <PropertyRow
            label="Completed"
            value={formatDateTime(buildInfo.buildRunCompletionTime)}
          />
          {buildInfo.buildRunFailureMessage ? (
            <Alert severity="warning" sx={{ mt: 1 }}>
              {buildInfo.buildRunFailureMessage}
            </Alert>
          ) : null}
        </>
      )}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
        <Button
          variant="contained"
          size="small"
          onClick={onTriggerBuild}
          disabled={!canTriggerBuild}
          sx={{ textTransform: 'none' }}
        >
          {triggeringBuild ? (
            <CircularProgress size={18} color="inherit" />
          ) : (
            'Trigger Build'
          )}
        </Button>
        {showFinalize && (
          <Button
            variant="outlined"
            size="small"
            onClick={onFinalizeBuild}
            disabled={finalizingBuild}
            sx={{ textTransform: 'none' }}
          >
            {finalizingBuild ? (
              <CircularProgress size={18} />
            ) : (
              'Finalize Build'
            )}
          </Button>
        )}
      </Box>
    </>
  );
}
