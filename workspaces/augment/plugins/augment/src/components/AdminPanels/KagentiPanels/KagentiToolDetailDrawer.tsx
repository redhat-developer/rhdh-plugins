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

import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { useApi } from '@backstage/core-plugin-api';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import TextField from '@mui/material/TextField';
import Divider from '@mui/material/Divider';
import CloseIcon from '@mui/icons-material/Close';
import { useTheme, alpha } from '@mui/material/styles';
import type {
  KagentiBuildInfo,
  KagentiMcpToolSchema,
  KagentiToolDetail,
  KagentiToolSummary,
} from '@red-hat-developer-hub/backstage-plugin-augment-common';
import { augmentApiRef } from '../../../api';
import { getErrorMessage } from '../../../utils';
import { McpToolCatalog } from './McpToolCatalog';

export interface KagentiToolDetailDrawerProps {
  open: boolean;
  tool: KagentiToolSummary | null;
  onClose: () => void;
}

function formatValue(v: unknown): string {
  if (v === null || v === undefined) return '—';
  if (typeof v === 'object') {
    try {
      return JSON.stringify(v);
    } catch {
      return String(v);
    }
  }
  return String(v);
}

function formatDateTime(iso?: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString();
}

function readSpecField(spec: Record<string, unknown>, ...keys: string[]): unknown {
  for (const k of keys) {
    if (spec[k] !== undefined && spec[k] !== null) return spec[k];
  }
  return undefined;
}

function buildRunPhaseChipColor(
  phase?: string,
): 'success' | 'error' | 'info' | 'default' {
  const p = phase?.toLowerCase();
  if (p === 'succeeded') return 'success';
  if (p === 'failed' || p === 'cancelled' || p === 'canceled') return 'error';
  if (p === 'running' || p === 'pending' || p === 'workqueue') return 'info';
  return 'default';
}

function toolSummaryStatusChipColor(
  status: string | undefined,
): 'success' | 'warning' | 'default' {
  if (!status) return 'default';
  const s = status.toLowerCase();
  if (['running', 'ready', 'active'].includes(s)) return 'success';
  if (['pending', 'building'].includes(s)) return 'warning';
  return 'default';
}

function routeReadyChipColor(
  ready: unknown,
): 'success' | 'warning' | 'default' {
  if (ready === true) return 'success';
  if (ready === false) return 'warning';
  return 'default';
}

function routeStatusStringChipColor(
  statusField: unknown,
): 'success' | 'error' | 'default' {
  const s = String(statusField).toLowerCase();
  if (s === 'ready' || s === 'active') return 'success';
  if (s === 'failed') return 'error';
  return 'default';
}

function PropertyRow({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <Box sx={{ mb: 1.25 }}>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ display: 'block', fontWeight: 600 }}
      >
        {label}
      </Typography>
      <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
        {value ?? '—'}
      </Typography>
    </Box>
  );
}

export function KagentiToolDetailDrawer({
  open,
  tool,
  onClose,
}: KagentiToolDetailDrawerProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const api = useApi(augmentApiRef);

  const [detail, setDetail] = useState<KagentiToolDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const [routeStatus, setRouteStatus] = useState<Record<string, unknown> | null>(
    null,
  );
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);

  const [buildInfo, setBuildInfo] = useState<KagentiBuildInfo | null>(null);
  const [buildLoading, setBuildLoading] = useState(false);
  const [buildFetchFailed, setBuildFetchFailed] = useState(false);

  const [mcpTools, setMcpTools] = useState<KagentiMcpToolSchema[]>([]);
  const [mcpDiscovering, setMcpDiscovering] = useState(false);
  const [mcpError, setMcpError] = useState<string | null>(null);

  const [invokeOpen, setInvokeOpen] = useState(false);
  const [invokeToolName, setInvokeToolName] = useState('');
  const [invokeArgsJson, setInvokeArgsJson] = useState('{}');
  const [invokeResult, setInvokeResult] = useState<string | null>(null);
  const [invokeError, setInvokeError] = useState<string | null>(null);
  const [invoking, setInvoking] = useState(false);

  const [triggeringBuild, setTriggeringBuild] = useState(false);
  const [finalizingBuild, setFinalizingBuild] = useState(false);
  const [buildActionError, setBuildActionError] = useState<string | null>(null);

  const refreshBuildInfo = useCallback(async () => {
    if (!tool) return;
    setBuildLoading(true);
    setBuildFetchFailed(false);
    try {
      const info = await api.getToolBuildInfo(tool.namespace, tool.name);
      setBuildInfo(info);
    } catch {
      setBuildInfo(null);
      setBuildFetchFailed(true);
    } finally {
      setBuildLoading(false);
    }
  }, [api, tool]);

  useEffect(() => {
    if (!open || !tool) {
      setDetail(null);
      setDetailLoading(false);
      setDetailError(null);
      return () => {};
    }
    let cancelled = false;
    setDetailLoading(true);
    setDetailError(null);
    api
      .getKagentiTool(tool.namespace, tool.name)
      .then(d => {
        if (!cancelled) setDetail(d);
      })
      .catch(e => {
        if (!cancelled) setDetailError(getErrorMessage(e));
      })
      .finally(() => {
        if (!cancelled) setDetailLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, tool, api]);

  useEffect(() => {
    if (!open || !tool) {
      setRouteStatus(null);
      setRouteLoading(false);
      setRouteError(null);
      return () => {};
    }
    let cancelled = false;
    setRouteLoading(true);
    setRouteError(null);
    api
      .getToolRouteStatus(tool.namespace, tool.name)
      .then(rs => {
        if (!cancelled) setRouteStatus(rs);
      })
      .catch(e => {
        if (!cancelled) setRouteError(getErrorMessage(e));
      })
      .finally(() => {
        if (!cancelled) setRouteLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, tool, api]);

  useEffect(() => {
    if (!open || !tool) {
      setBuildInfo(null);
      setBuildLoading(false);
      setBuildFetchFailed(false);
      return () => {};
    }
    let cancelled = false;
    setBuildLoading(true);
    setBuildFetchFailed(false);
    api
      .getToolBuildInfo(tool.namespace, tool.name)
      .then(info => {
        if (!cancelled) setBuildInfo(info);
      })
      .catch(() => {
        if (!cancelled) {
          setBuildInfo(null);
          setBuildFetchFailed(true);
        }
      })
      .finally(() => {
        if (!cancelled) setBuildLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, tool, api]);

  useEffect(() => {
    if (!open || !tool) {
      setMcpTools([]);
      setMcpDiscovering(false);
      setMcpError(null);
      setInvokeOpen(false);
      setInvokeToolName('');
      setInvokeArgsJson('{}');
      setInvokeResult(null);
      setInvokeError(null);
      setBuildActionError(null);
    }
  }, [open, tool]);

  const handleDiscoverMcp = async () => {
    if (!tool) return;
    setMcpDiscovering(true);
    setMcpError(null);
    try {
      const res = await api.connectKagentiTool(tool.namespace, tool.name);
      setMcpTools(res.tools ?? []);
    } catch (e) {
      setMcpError(getErrorMessage(e));
    } finally {
      setMcpDiscovering(false);
    }
  };

  const handleStartInvoke = (name: string) => {
    setInvokeToolName(name);
    setInvokeArgsJson('{}');
    setInvokeResult(null);
    setInvokeError(null);
    setInvokeOpen(true);
  };

  const handleInvoke = async () => {
    if (!tool || !invokeToolName.trim()) return;
    let args: Record<string, unknown> = {};
    try {
      args = JSON.parse(invokeArgsJson || '{}') as Record<string, unknown>;
    } catch {
      setInvokeError('Arguments must be valid JSON');
      return;
    }
    setInvoking(true);
    setInvokeError(null);
    try {
      const res = await api.invokeKagentiTool(
        tool.namespace,
        tool.name,
        invokeToolName.trim(),
        args,
      );
      setInvokeResult(JSON.stringify(res, null, 2));
    } catch (e) {
      setInvokeError(getErrorMessage(e));
    } finally {
      setInvoking(false);
    }
  };

  const handleTriggerBuild = async () => {
    if (!tool) return;
    setTriggeringBuild(true);
    setBuildActionError(null);
    try {
      await api.triggerToolBuild(tool.namespace, tool.name);
      await refreshBuildInfo();
    } catch (e) {
      setBuildActionError(getErrorMessage(e));
    } finally {
      setTriggeringBuild(false);
    }
  };

  const handleFinalizeBuild = async () => {
    if (!tool) return;
    setFinalizingBuild(true);
    setBuildActionError(null);
    try {
      await api.finalizeToolBuild(tool.namespace, tool.name);
      await refreshBuildInfo();
    } catch (e) {
      setBuildActionError(getErrorMessage(e));
    } finally {
      setFinalizingBuild(false);
    }
  };

  if (!tool) {
    return null;
  }

  const spec = detail?.spec as Record<string, unknown> | undefined;
  const envVars = readSpecField(spec ?? {}, 'envVars', 'env_vars') as
    | unknown[]
    | undefined;
  const servicePorts = readSpecField(spec ?? {}, 'servicePorts', 'service_ports') as
    | unknown[]
    | undefined;
  const protocol = readSpecField(spec ?? {}, 'protocol');
  const framework = readSpecField(spec ?? {}, 'framework');
  const image =
    readSpecField(spec ?? {}, 'containerImage', 'image', 'container_image') ??
    readSpecField(spec ?? {}, 'image');
  const gitUrl = readSpecField(spec ?? {}, 'gitUrl', 'git_url');
  const gitRevision = readSpecField(spec ?? {}, 'gitRevision', 'git_revision', 'gitBranch');

  const routeReady = routeStatus && 'ready' in routeStatus ? routeStatus.ready : undefined;
  const routeStatusField =
    routeStatus && 'status' in routeStatus ? routeStatus.status : undefined;

  const phaseLower = buildInfo?.buildRunPhase?.toLowerCase();
  const buildIsRunning =
    phaseLower === 'running' ||
    phaseLower === 'pending' ||
    phaseLower === 'workqueue';
  const canTriggerBuild =
    buildInfo?.buildRegistered && !buildIsRunning && !triggeringBuild;
  const showFinalize =
    buildInfo?.hasBuildRun && buildInfo.buildRunPhase === 'Succeeded';

  const overviewWorkload = detail?.workloadType ?? tool.workloadType ?? '—';
  const overviewDescription = tool.description || '—';
  const labelEntries = Object.entries(tool.labels ?? {}).filter(([, v]) => v);

  const sectionCardSx = {
    mb: 2,
    border: 1,
    borderColor: 'divider',
    borderRadius: 1,
    bgcolor: alpha(theme.palette.background.paper, isDark ? 0.35 : 0.65),
  };

  let routeSectionBody: ReactNode;
  if (routeLoading) {
    routeSectionBody = (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
        <CircularProgress size={28} />
      </Box>
    );
  } else if (routeError) {
    routeSectionBody = <Alert severity="error">{routeError}</Alert>;
  } else if (routeStatus && Object.keys(routeStatus).length > 0) {
    routeSectionBody = (
      <>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 1.5 }}>
          {routeReady !== undefined && (
            <Chip
              size="small"
              label={`ready: ${formatValue(routeReady)}`}
              color={routeReadyChipColor(routeReady)}
            />
          )}
          {routeStatusField !== undefined && routeStatusField !== null && (
            <Chip
              size="small"
              label={`status: ${formatValue(routeStatusField)}`}
              color={routeStatusStringChipColor(routeStatusField)}
            />
          )}
        </Box>
        <Divider sx={{ my: 1.5 }} />
        {Object.entries(routeStatus).map(([key, val]) => (
          <PropertyRow key={key} label={key} value={formatValue(val)} />
        ))}
      </>
    );
  } else {
    routeSectionBody = (
      <Typography variant="body2" color="text.secondary">
        No route status data.
      </Typography>
    );
  }

  let specSectionBody: ReactNode;
  if (detailLoading) {
    specSectionBody = (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
        <CircularProgress size={28} />
      </Box>
    );
  } else if (detailError) {
    specSectionBody = <Alert severity="error">{detailError}</Alert>;
  } else if (spec && Object.keys(spec).length > 0) {
    specSectionBody = (
      <>
        <PropertyRow label="Protocol" value={formatValue(protocol)} />
        <PropertyRow label="Framework" value={formatValue(framework)} />
        <PropertyRow label="Image" value={formatValue(image)} />
        <PropertyRow label="Git URL" value={formatValue(gitUrl)} />
        <PropertyRow label="Git revision" value={formatValue(gitRevision)} />
        <PropertyRow
          label="Environment variables"
          value={
            Array.isArray(envVars) ? `${envVars.length}` : formatValue(envVars)
          }
        />
        <PropertyRow
          label="Service ports"
          value={
            Array.isArray(servicePorts)
              ? `${servicePorts.length}`
              : formatValue(servicePorts)
          }
        />
      </>
    );
  } else {
    specSectionBody = (
      <Typography variant="body2" color="text.secondary">
        No spec available.
      </Typography>
    );
  }

  let buildSectionBody: ReactNode;
  if (buildLoading) {
    buildSectionBody = (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
        <CircularProgress size={28} />
      </Box>
    );
  } else if (buildFetchFailed || !buildInfo) {
    buildSectionBody = (
      <Typography variant="body2" color="text.secondary">
        No build pipeline configured
      </Typography>
    );
  } else {
    buildSectionBody = (
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
        <PropertyRow label="Context directory" value={buildInfo.contextDir || '—'} />
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
            onClick={handleTriggerBuild}
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
              onClick={handleFinalizeBuild}
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

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: 520,
          maxWidth: '92vw',
          display: 'flex',
          flexDirection: 'column',
          p: 0,
        },
      }}
    >
      <Box
        sx={{
          px: 2.5,
          pt: 2.5,
          pb: 2,
          borderBottom: 1,
          borderColor: 'divider',
          position: 'relative',
          background: isDark
            ? alpha(theme.palette.primary.main, 0.08)
            : alpha(theme.palette.primary.main, 0.04),
        }}
      >
        <IconButton
          onClick={onClose}
          size="small"
          aria-label="Close"
          sx={{
            position: 'absolute',
            top: 12,
            right: 12,
            color: theme.palette.text.secondary,
          }}
        >
          <CloseIcon sx={{ fontSize: 20 }} />
        </IconButton>
        <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.1rem', pr: 4 }}>
          {tool.name}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          {tool.namespace}
        </Typography>
        <Chip
          label={tool.status}
          size="small"
          color={toolSummaryStatusChipColor(tool.status)}
          sx={{ height: 24 }}
        />
      </Box>

      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        <Card variant="outlined" sx={sectionCardSx}>
          <CardContent sx={{ pb: 2, '&:last-child': { pb: 2 } }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
              Overview
            </Typography>
            <PropertyRow label="Description" value={overviewDescription} />
            <PropertyRow label="Workload type" value={overviewWorkload} />
            <Box sx={{ mb: 1 }}>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}
              >
                Labels
              </Typography>
              {labelEntries.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  —
                </Typography>
              ) : (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {labelEntries.map(([k, v]) => (
                    <Chip
                      key={k}
                      label={`${k}: ${v}`}
                      size="small"
                      variant="outlined"
                    />
                  ))}
                </Box>
              )}
            </Box>
            <PropertyRow
              label="Created at"
              value={formatDateTime(tool.createdAt)}
            />
          </CardContent>
        </Card>

        <Card variant="outlined" sx={sectionCardSx}>
          <CardContent sx={{ pb: 2, '&:last-child': { pb: 2 } }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
              Route status
            </Typography>
            {routeSectionBody}
          </CardContent>
        </Card>

        <Card variant="outlined" sx={sectionCardSx}>
          <CardContent sx={{ pb: 2, '&:last-child': { pb: 2 } }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
              Spec
            </Typography>
            {specSectionBody}
          </CardContent>
        </Card>

        <Card variant="outlined" sx={sectionCardSx}>
          <CardContent sx={{ pb: 2, '&:last-child': { pb: 2 } }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
              Build pipeline
            </Typography>
            {buildActionError && (
              <Alert
                severity="error"
                sx={{ mb: 1.5 }}
                onClose={() => setBuildActionError(null)}
              >
                {buildActionError}
              </Alert>
            )}
            {buildSectionBody}
          </CardContent>
        </Card>

        <Card variant="outlined" sx={sectionCardSx}>
          <CardContent sx={{ pb: 2, '&:last-child': { pb: 2 } }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
              MCP tools
            </Typography>
            <Button
              variant="outlined"
              size="small"
              onClick={handleDiscoverMcp}
              disabled={mcpDiscovering}
              startIcon={
                mcpDiscovering ? (
                  <CircularProgress size={18} color="inherit" />
                ) : undefined
              }
              sx={{ textTransform: 'none', mb: 2 }}
            >
              Discover MCP Tools
            </Button>
            {mcpError && (
              <Alert
                severity="error"
                sx={{ mb: 1.5 }}
                onClose={() => setMcpError(null)}
              >
                {mcpError}
              </Alert>
            )}
            <McpToolCatalog tools={mcpTools} onInvoke={handleStartInvoke} />
            {invokeOpen && (
              <Box
                sx={{
                  mt: 2,
                  p: 1.5,
                  borderRadius: 1,
                  border: 1,
                  borderColor: 'divider',
                  bgcolor: alpha(theme.palette.action.hover, 0.06),
                }}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                  Invoke tool
                </Typography>
                <TextField
                  label="Tool name"
                  size="small"
                  value={invokeToolName}
                  onChange={e => setInvokeToolName(e.target.value)}
                  fullWidth
                  sx={{ mb: 1.5 }}
                />
                <TextField
                  label="Arguments (JSON)"
                  size="small"
                  value={invokeArgsJson}
                  onChange={e => setInvokeArgsJson(e.target.value)}
                  fullWidth
                  multiline
                  minRows={3}
                  sx={{ mb: 1.5 }}
                />
                {invokeError && (
                  <Alert severity="error" sx={{ mb: 1 }} onClose={() => setInvokeError(null)}>
                    {invokeError}
                  </Alert>
                )}
                {invokeResult && (
                  <TextField
                    label="Result"
                    size="small"
                    value={invokeResult}
                    fullWidth
                    multiline
                    minRows={4}
                    InputProps={{ readOnly: true }}
                    sx={{ mb: 1.5 }}
                  />
                )}
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Button
                    variant="contained"
                    size="small"
                    onClick={handleInvoke}
                    disabled={invoking || !invokeToolName.trim()}
                    sx={{ textTransform: 'none' }}
                  >
                    {invoking ? <CircularProgress size={18} color="inherit" /> : 'Invoke'}
                  </Button>
                  <Button
                    size="small"
                    onClick={() => {
                      setInvokeOpen(false);
                      setInvokeResult(null);
                      setInvokeError(null);
                    }}
                    disabled={invoking}
                    sx={{ textTransform: 'none' }}
                  >
                    Cancel
                  </Button>
                </Box>
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>
    </Drawer>
  );
}
