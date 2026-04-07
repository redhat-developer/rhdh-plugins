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

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import Alert from '@mui/material/Alert';
import { useTheme, alpha } from '@mui/material/styles';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import RefreshIcon from '@mui/icons-material/Refresh';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import type {
  KagentiAgentDetail,
  KagentiAgentSummary,
  KagentiBuildInfo,
} from '@red-hat-developer-hub/backstage-plugin-augment-common';
import { statusChipColor as statusColor } from './kagentiDisplayUtils';

/* ── helpers ─────────────────────────────────────── */

interface KubeCondition {
  type: string;
  status: string;
  reason?: string;
  message?: string;
  last_transition_time?: string;
  lastTransitionTime?: string;
  last_update_time?: string;
}

function getTransitionTime(c: KubeCondition): string | undefined {
  return c.last_transition_time ?? c.lastTransitionTime;
}

function buildPhaseToStatus(phase: string): string {
  if (phase === 'Succeeded') return 'ready';
  if (phase === 'Failed') return 'error';
  return 'pending';
}

function interpretConditions(conditions: KubeCondition[]): {
  severity: 'success' | 'info' | 'warning' | 'error';
  summary: string;
} {
  const available = conditions.find(c => c.type === 'Available');
  const progressing = conditions.find(c => c.type === 'Progressing');

  const isAvailable = available?.status === 'True';
  const isProgressing = progressing?.status === 'True';

  if (isAvailable && isProgressing) {
    return {
      severity: 'success',
      summary:
        'Agent is running and healthy. All replicas are available and the latest version has been rolled out.',
    };
  }
  if (isAvailable && !isProgressing) {
    return {
      severity: 'warning',
      summary:
        'Agent is available but a rollout may be stalled or the deployment has not met its progress deadline.',
    };
  }
  if (!isAvailable && isProgressing) {
    return {
      severity: 'info',
      summary:
        'Agent is starting up. A new version is being rolled out and replicas are coming online.',
    };
  }
  return {
    severity: 'error',
    summary:
      'Agent is unavailable. The deployment may have failed or has insufficient replicas.',
  };
}

function conditionStatusIcon(status: string) {
  if (status === 'True')
    return <CheckCircleIcon sx={{ fontSize: 16, color: 'success.main' }} />;
  if (status === 'False')
    return <ErrorIcon sx={{ fontSize: 16, color: 'error.main' }} />;
  return <HourglassEmptyIcon sx={{ fontSize: 16, color: 'warning.main' }} />;
}

function formatTimestamp(iso: string | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleString();
}

/* ── component ───────────────────────────────────── */

export interface AgentStatusTabProps {
  agent: KagentiAgentSummary;
  agentDetail: KagentiAgentDetail | null;
  buildInfo: KagentiBuildInfo | null;
  loading: boolean;
  buildTriggering: boolean;
  hasBuild: boolean | null;
  onRefreshBuild: () => void;
  onTriggerBuild: () => void;
}

export function AgentStatusTab({
  agent,
  agentDetail,
  buildInfo,
  loading,
  buildTriggering,
  hasBuild,
  onRefreshBuild,
  onTriggerBuild,
}: AgentStatusTabProps) {
  const theme = useTheme();
  const conditions = (agentDetail?.status as Record<string, unknown>)
    ?.conditions as KubeCondition[] | undefined;

  const interpretation = conditions ? interpretConditions(conditions) : null;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* ── Agent Status ── */}
      <Card variant="outlined" sx={{ p: 2.5 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 2,
          }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            Agent Status
          </Typography>
          <Typography
            variant="caption"
            sx={{ color: theme.palette.text.disabled }}
          >
            Auto-refreshes every 15 s
          </Typography>
        </Box>

        {loading && <CircularProgress size={24} />}

        {!loading && conditions && (
          <>
            {interpretation && (
              <Alert
                severity={interpretation.severity}
                sx={{ mb: 2, borderRadius: 1 }}
                variant="outlined"
              >
                {interpretation.summary}
              </Alert>
            )}
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell />
                  <TableCell>Condition</TableCell>
                  <TableCell>Value</TableCell>
                  <TableCell>Reason</TableCell>
                  <TableCell>Message</TableCell>
                  <TableCell>Last Transition</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {conditions.map(c => (
                  <TableRow key={c.type}>
                    <TableCell sx={{ width: 32, pr: 0 }}>
                      {conditionStatusIcon(c.status)}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 500 }}>{c.type}</TableCell>
                    <TableCell>
                      <Chip
                        label={c.status}
                        size="small"
                        color={statusColor(c.status)}
                      />
                    </TableCell>
                    <TableCell sx={{ color: theme.palette.text.secondary }}>
                      {c.reason || '—'}
                    </TableCell>
                    <TableCell
                      sx={{
                        color: theme.palette.text.secondary,
                        maxWidth: 300,
                        fontSize: '0.8rem',
                      }}
                    >
                      {c.message || '—'}
                    </TableCell>
                    <TableCell
                      sx={{
                        color: theme.palette.text.secondary,
                        fontSize: '0.8rem',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {formatTimestamp(getTransitionTime(c))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </>
        )}

        {!loading && !conditions && (
          <Chip
            label={agent.status}
            size="small"
            color={statusColor(agent.status)}
          />
        )}
      </Card>

      {/* ── Shipwright Build Status (only for source-built agents) ── */}
      {hasBuild !== false && (
        <Card variant="outlined" sx={{ p: 2.5 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              mb: 2,
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              Shipwright Build Status
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <IconButton size="small" onClick={onRefreshBuild} title="Refresh">
                <RefreshIcon sx={{ fontSize: 18 }} />
              </IconButton>
              <Button
                size="small"
                variant="outlined"
                startIcon={<PlayArrowIcon sx={{ fontSize: 16 }} />}
                disabled={buildTriggering}
                onClick={onTriggerBuild}
                sx={{ textTransform: 'none' }}
              >
                {buildTriggering ? 'Triggering...' : 'Trigger Build'}
              </Button>
            </Box>
          </Box>

          {buildInfo ? (
            <Box>
              <Table size="small">
                <TableBody>
                  {[
                    { label: 'Build Name', value: buildInfo.name },
                    {
                      label: 'Build Registered',
                      value: buildInfo.buildRegistered ? (
                        <Chip
                          label="Yes"
                          size="small"
                          color="success"
                          sx={{ height: 22 }}
                        />
                      ) : (
                        <Chip
                          label="No"
                          size="small"
                          color="default"
                          sx={{ height: 22 }}
                        />
                      ),
                    },
                    {
                      label: 'Build Strategy',
                      value: buildInfo.strategy ? (
                        <Chip
                          label={buildInfo.strategy}
                          size="small"
                          color="info"
                          sx={{ height: 22 }}
                        />
                      ) : (
                        '—'
                      ),
                    },
                    {
                      label: 'Output Image',
                      value: buildInfo.outputImage ? (
                        <Typography
                          variant="body2"
                          sx={{
                            fontFamily: 'monospace',
                            fontSize: '0.75rem',
                            wordBreak: 'break-all',
                          }}
                        >
                          {buildInfo.outputImage}
                        </Typography>
                      ) : (
                        '—'
                      ),
                    },
                    {
                      label: 'Git URL',
                      value: buildInfo.gitUrl ? (
                        <Typography
                          variant="body2"
                          sx={{
                            fontFamily: 'monospace',
                            fontSize: '0.75rem',
                            wordBreak: 'break-all',
                          }}
                        >
                          {buildInfo.gitUrl}
                        </Typography>
                      ) : (
                        '—'
                      ),
                    },
                    {
                      label: 'Git Revision',
                      value: buildInfo.gitRevision || '—',
                    },
                    {
                      label: 'Context Directory',
                      value: buildInfo.contextDir || '—',
                    },
                  ]
                    .filter(r => r.value)
                    .map(row => (
                      <TableRow
                        key={row.label}
                        sx={{ '&:last-child td': { borderBottom: 0 } }}
                      >
                        <TableCell
                          sx={{
                            fontWeight: 500,
                            fontSize: '0.8125rem',
                            color: theme.palette.text.secondary,
                            width: 160,
                            py: 1,
                          }}
                        >
                          {row.label}
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.8125rem', py: 1 }}>
                          {row.value}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>

              {buildInfo.buildRunName && (
                <Box sx={{ mt: 2.5 }}>
                  <Typography
                    variant="subtitle2"
                    sx={{ fontWeight: 700, mb: 1.5 }}
                  >
                    Latest BuildRun
                  </Typography>
                  <Table size="small">
                    <TableBody>
                      {[
                        {
                          label: 'BuildRun Name',
                          value: buildInfo.buildRunName,
                        },
                        {
                          label: 'Phase',
                          value: buildInfo.buildRunPhase ? (
                            <Chip
                              label={buildInfo.buildRunPhase}
                              size="small"
                              color={statusColor(
                                buildPhaseToStatus(buildInfo.buildRunPhase),
                              )}
                              sx={{ height: 22 }}
                            />
                          ) : (
                            '—'
                          ),
                        },
                        {
                          label: 'Message',
                          value: buildInfo.buildMessage || '—',
                        },
                      ]
                        .filter(r => r.value)
                        .map(row => (
                          <TableRow
                            key={row.label}
                            sx={{ '&:last-child td': { borderBottom: 0 } }}
                          >
                            <TableCell
                              sx={{
                                fontWeight: 500,
                                fontSize: '0.8125rem',
                                color: theme.palette.text.secondary,
                                width: 160,
                                py: 1,
                              }}
                            >
                              {row.label}
                            </TableCell>
                            <TableCell sx={{ fontSize: '0.8125rem', py: 1 }}>
                              {row.value}
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </Box>
              )}
            </Box>
          ) : (
            <Box
              sx={{
                py: 3,
                textAlign: 'center',
                border: `1px dashed ${alpha(theme.palette.divider, 0.4)}`,
                borderRadius: 1,
              }}
            >
              <Typography
                variant="body2"
                sx={{ color: theme.palette.text.disabled }}
              >
                No build information available. Click &ldquo;Trigger
                Build&rdquo; to start a build.
              </Typography>
            </Box>
          )}
        </Card>
      )}
    </Box>
  );
}
