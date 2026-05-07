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

import { useCallback, useEffect, useRef, useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Collapse from '@mui/material/Collapse';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Skeleton from '@mui/material/Skeleton';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CodeIcon from '@mui/icons-material/Code';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import LaptopMacOutlinedIcon from '@mui/icons-material/LaptopMacOutlined';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import RefreshIcon from '@mui/icons-material/Refresh';
import RocketLaunchOutlinedIcon from '@mui/icons-material/RocketLaunchOutlined';
import StopCircleOutlinedIcon from '@mui/icons-material/StopCircleOutlined';
import TerminalOutlinedIcon from '@mui/icons-material/TerminalOutlined';
import { alpha, useTheme } from '@mui/material/styles';
import { useApi } from '@backstage/core-plugin-api';
import type {
  DevSpacesCreateWorkspaceResponse,
  DevSpacesWorkspace,
} from '@red-hat-developer-hub/backstage-plugin-augment-common';
import { augmentApiRef } from '../../../api';
import { getErrorMessage } from '../../../utils';
import { NamespacePicker } from './NamespacePicker';

function normalizeGitRepoUrl(url: string): string {
  const trimmed = url.trim().replace(/\/+$/, '');
  const match = trimmed.match(
    /^(https?:\/\/(?:github\.com|gitlab\.com)\/[^/]+\/[^/]+)\/(?:blob|tree)\/.+/i,
  );
  if (match) return match[1];
  return trimmed;
}

const PHASE_COLORS: Record<
  string,
  'success' | 'warning' | 'error' | 'default'
> = {
  Running: 'success',
  Starting: 'warning',
  Stopping: 'warning',
  Stopped: 'default',
  Failed: 'error',
  Failing: 'error',
};

const STATUS_POLL_INTERVAL_MS = 5_000;

export interface DevSpacesLaunchFormProps {
  onBack: () => void;
  initialGitRepo?: string;
  resourceKind?: 'agent' | 'tool';
}

type FormStatus = 'idle' | 'creating' | 'polling' | 'success' | 'error';
type HealthState = 'loading' | 'ok' | 'not-configured' | 'error';

function NextStep({
  icon,
  step,
  title,
  description,
}: {
  icon: React.ReactElement;
  step: string;
  title: string;
  description: React.ReactNode;
}) {
  const theme = useTheme();
  return (
    <Box sx={{ display: 'flex', gap: 1.5 }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 32,
          height: 32,
          borderRadius: 1,
          bgcolor: alpha(theme.palette.primary.main, 0.08),
          color: theme.palette.primary.main,
          flexShrink: 0,
        }}
      >
        {icon}
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.25 }}>
          {step}. {title}
        </Typography>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ lineHeight: 1.5, display: 'block' }}
        >
          {description}
        </Typography>
      </Box>
    </Box>
  );
}

export function DevSpacesLaunchForm({
  onBack,
  initialGitRepo,
  resourceKind = 'agent',
}: DevSpacesLaunchFormProps) {
  const theme = useTheme();
  const api = useApi(augmentApiRef);
  const label = resourceKind === 'tool' ? 'tool' : 'agent';
  const Label = resourceKind === 'tool' ? 'Tool' : 'Agent';

  // ── Health check ────────────────────────────────────────────────────
  const [health, setHealth] = useState<HealthState>('loading');
  const [healthMsg, setHealthMsg] = useState('');

  useEffect(() => {
    let cancelled = false;
    api
      .checkDevSpacesHealth()
      .then(resp => {
        if (cancelled) return;
        if (!resp.configured) {
          setHealth('not-configured');
          setHealthMsg(resp.message);
        } else if (resp.ok) {
          setHealth('ok');
        } else {
          setHealth('error');
          setHealthMsg(resp.message);
        }
      })
      .catch(err => {
        if (cancelled) return;
        setHealth('error');
        setHealthMsg(getErrorMessage(err));
      });
    return () => {
      cancelled = true;
    };
  }, [api]);

  // ── Form state ──────────────────────────────────────────────────────
  const [namespace, setNamespace] = useState<string | undefined>(undefined);
  const [gitRepo, setGitRepo] = useState(initialGitRepo ?? '');
  const [memoryLimit, setMemoryLimit] = useState('8Gi');
  const [cpuLimit, setCpuLimit] = useState('2000m');
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const [status, setStatus] = useState<FormStatus>('idle');
  const [result, setResult] = useState<DevSpacesCreateWorkspaceResponse | null>(
    null,
  );
  const [errorMessage, setErrorMessage] = useState('');
  const [urlCorrected, setUrlCorrected] = useState(false);

  // ── Existing workspaces ─────────────────────────────────────────────
  const [workspaces, setWorkspaces] = useState<DevSpacesWorkspace[]>([]);
  const [wsLoading, setWsLoading] = useState(false);

  const loadWorkspaces = useCallback(
    async (ns: string) => {
      setWsLoading(true);
      try {
        const resp = await api.listDevSpacesWorkspaces(ns);
        setWorkspaces(resp.workspaces);
      } catch {
        setWorkspaces([]);
      } finally {
        setWsLoading(false);
      }
    },
    [api],
  );

  useEffect(() => {
    if (namespace && health === 'ok') {
      loadWorkspaces(namespace);
    } else {
      setWorkspaces([]);
    }
  }, [namespace, health, loadWorkspaces]);

  // ── Status polling after creation ───────────────────────────────────
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startPolling = useCallback(
    (ws: DevSpacesCreateWorkspaceResponse) => {
      setStatus('polling');
      pollRef.current = setInterval(async () => {
        try {
          const updated = await api.getDevSpacesWorkspace(
            ws.namespace,
            ws.name,
          );
          setResult(prev =>
            prev ? { ...prev, phase: updated.phase, url: updated.url } : prev,
          );
          if (updated.phase === 'Running' || updated.phase === 'Failed') {
            if (pollRef.current) clearInterval(pollRef.current);
            pollRef.current = null;
            setStatus('success');
          }
        } catch {
          // keep polling on transient errors
        }
      }, STATUS_POLL_INTERVAL_MS);
    },
    [api],
  );

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  // ── Create handler ──────────────────────────────────────────────────
  const isValid = !!namespace && gitRepo.trim().length > 0;

  const handleCreate = useCallback(async () => {
    if (!isValid || !namespace) return;
    setStatus('creating');
    setErrorMessage('');
    setResult(null);
    setUrlCorrected(false);

    const normalized = normalizeGitRepoUrl(gitRepo);
    if (normalized !== gitRepo.trim()) {
      setGitRepo(normalized);
      setUrlCorrected(true);
    }

    try {
      const response = await api.createDevSpacesWorkspace({
        namespace,
        git_repo: normalized,
        memory_limit: memoryLimit.trim() || '8Gi',
        cpu_limit: cpuLimit.trim() || '2000m',
      });
      setResult(response);

      if (response.phase !== 'Running') {
        startPolling(response);
      } else {
        setStatus('success');
      }
    } catch (err) {
      let msg = getErrorMessage(err);
      if (err && typeof err === 'object' && 'body' in err) {
        const body = (err as { body?: { message?: string } }).body;
        if (body?.message) msg = body.message;
      }
      if (
        msg.toLowerCase().includes('not configured') ||
        msg.toLowerCase().includes('authentication is not configured')
      ) {
        msg = `${msg} Go to the Administration panel → Dev Spaces section to configure the OpenShift API URL and authentication token.`;
      }
      setErrorMessage(msg);
      setStatus('error');
    }
  }, [api, namespace, gitRepo, memoryLimit, cpuLimit, isValid, startPolling]);

  // ── Workspace actions ───────────────────────────────────────────────
  const handleStop = useCallback(
    async (ws: DevSpacesWorkspace) => {
      try {
        await api.stopDevSpacesWorkspace(ws.namespace, ws.name);
        if (namespace) loadWorkspaces(namespace);
      } catch {
        /* best effort */
      }
    },
    [api, namespace, loadWorkspaces],
  );

  const handleDelete = useCallback(
    async (ws: DevSpacesWorkspace) => {
      try {
        await api.deleteDevSpacesWorkspace(ws.namespace, ws.name);
        if (namespace) loadWorkspaces(namespace);
      } catch {
        /* best effort */
      }
    },
    [api, namespace, loadWorkspaces],
  );

  // ── Render: health loading ──────────────────────────────────────────
  if (health === 'loading') {
    return (
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <IconButton onClick={onBack} size="small" aria-label="Back">
            <ArrowBackIcon fontSize="small" />
          </IconButton>
          <LaptopMacOutlinedIcon
            sx={{ fontSize: 22, color: theme.palette.primary.main }}
          />
          <Typography
            variant="h6"
            sx={{ fontWeight: 700, flex: 1, color: 'text.primary' }}
          >
            {Label} DevSpace
          </Typography>
        </Box>
        <Skeleton variant="rounded" height={80} />
      </Box>
    );
  }

  // ── Render: not configured ──────────────────────────────────────────
  if (health === 'not-configured') {
    return (
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <IconButton onClick={onBack} size="small" aria-label="Back">
            <ArrowBackIcon fontSize="small" />
          </IconButton>
          <LaptopMacOutlinedIcon
            sx={{ fontSize: 22, color: theme.palette.primary.main }}
          />
          <Typography
            variant="h6"
            sx={{ fontWeight: 700, flex: 1, color: 'text.primary' }}
          >
            {Label} DevSpace
          </Typography>
        </Box>
        <Alert severity="warning" sx={{ mb: 2 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
            Dev Spaces is not configured
          </Typography>
          <Typography variant="body2">
            {healthMsg || 'The OpenShift API URL has not been set.'} Go to{' '}
            <strong>Administration → Dev Spaces</strong> to configure the
            OpenShift API URL and authentication token, then return here.
          </Typography>
        </Alert>
        <Button onClick={onBack} sx={{ textTransform: 'none' }}>
          Back
        </Button>
      </Box>
    );
  }

  // ── Render: health error (configured but unreachable) ───────────────
  if (health === 'error') {
    return (
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <IconButton onClick={onBack} size="small" aria-label="Back">
            <ArrowBackIcon fontSize="small" />
          </IconButton>
          <LaptopMacOutlinedIcon
            sx={{ fontSize: 22, color: theme.palette.primary.main }}
          />
          <Typography
            variant="h6"
            sx={{ fontWeight: 700, flex: 1, color: 'text.primary' }}
          >
            {Label} DevSpace
          </Typography>
        </Box>
        <Alert severity="error" sx={{ mb: 2 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
            Cannot reach Kubernetes API
          </Typography>
          <Typography variant="body2">
            {healthMsg} Check the API URL and authentication token in{' '}
            <strong>Administration → Dev Spaces</strong>.
          </Typography>
        </Alert>
        <Button onClick={onBack} sx={{ textTransform: 'none' }}>
          Back
        </Button>
      </Box>
    );
  }

  // ── Render: main form ───────────────────────────────────────────────
  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
        <IconButton onClick={onBack} size="small" aria-label="Back">
          <ArrowBackIcon fontSize="small" />
        </IconButton>
        <LaptopMacOutlinedIcon
          sx={{ fontSize: 22, color: theme.palette.primary.main }}
        />
        <Typography
          variant="h6"
          sx={{ fontWeight: 700, flex: 1, color: 'text.primary' }}
        >
          {Label} DevSpace
        </Typography>
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
        Launch a ready-to-code cloud IDE with your {label}&apos;s repository,
        tools, and runtime pre-configured.
      </Typography>

      {/* ── Success / polling state ─────────────────────────────────── */}
      {(status === 'success' || status === 'polling') && result && (
        <Box>
          <Alert
            severity={status === 'polling' ? 'info' : 'success'}
            icon={
              status === 'polling' ? (
                <CircularProgress size={20} />
              ) : (
                <CheckCircleOutlineIcon />
              )
            }
            sx={{ mb: 2.5 }}
          >
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.25 }}>
              {status === 'polling'
                ? 'Workspace starting...'
                : 'Workspace created'}
            </Typography>
            <Typography variant="body2">
              <strong>{result.name}</strong> in {result.namespace} &mdash;{' '}
              <Chip
                label={result.phase}
                size="small"
                color={PHASE_COLORS[result.phase] ?? 'default'}
                sx={{ height: 20, fontSize: '0.75rem' }}
              />
            </Typography>
            {result.created_at && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: 'block', mt: 0.25 }}
              >
                Created {new Date(result.created_at).toLocaleString()}
              </Typography>
            )}
          </Alert>

          {status === 'success' && (
            <>
              <Box
                sx={{
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 2,
                  overflow: 'hidden',
                  mb: 2,
                }}
              >
                <Box
                  sx={{
                    px: 2.5,
                    py: 1.5,
                    bgcolor: alpha(theme.palette.primary.main, 0.04),
                    borderBottom: `1px solid ${theme.palette.divider}`,
                  }}
                >
                  <Typography
                    variant="subtitle2"
                    sx={{ fontWeight: 700, color: 'text.primary' }}
                  >
                    Next Steps
                  </Typography>
                </Box>

                <Box
                  sx={{
                    px: 2.5,
                    py: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                  }}
                >
                  <NextStep
                    icon={<CodeIcon sx={{ fontSize: 18 }} />}
                    step="1"
                    title={`Open your ${Label} DevSpace`}
                    description={
                      result.url ? (
                        <>
                          Your cloud IDE is ready.{' '}
                          <a
                            href={result.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ fontWeight: 600 }}
                          >
                            Open DevSpace
                          </a>{' '}
                          to start writing your {label} code.
                        </>
                      ) : (
                        `Your cloud IDE is ready. Open it to start writing your ${label} code.`
                      )
                    }
                  />
                  <NextStep
                    icon={<TerminalOutlinedIcon sx={{ fontSize: 18 }} />}
                    step="2"
                    title="Build and push from the IDE"
                    description={`Use the integrated terminal in DevSpaces to build your ${label} container image and push it to your registry.`}
                  />
                  <NextStep
                    icon={<RocketLaunchOutlinedIcon sx={{ fontSize: 18 }} />}
                    step="3"
                    title={`Deploy your ${label}`}
                    description={
                      <>
                        Once your image is ready, return here and use{' '}
                        <strong>Create {Label} &rarr; Deploy</strong> to deploy
                        it to the platform.
                      </>
                    }
                  />
                </Box>

                <Divider />

                <Box
                  sx={{
                    px: 2.5,
                    py: 1.5,
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 1,
                    bgcolor: alpha(theme.palette.info.main, 0.04),
                  }}
                >
                  <InfoOutlinedIcon
                    sx={{
                      fontSize: 16,
                      mt: 0.25,
                      color: theme.palette.info.main,
                      flexShrink: 0,
                    }}
                  />
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ lineHeight: 1.5 }}
                  >
                    Building and pushing your {label}&apos;s container image is
                    done through the IDE terminal in DevSpaces, not from this
                    UI.
                  </Typography>
                </Box>
              </Box>

              <Box
                sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5 }}
              >
                <Button
                  size="small"
                  onClick={() => {
                    setStatus('idle');
                    setResult(null);
                  }}
                  sx={{ textTransform: 'none' }}
                >
                  Create Another
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={onBack}
                  sx={{ textTransform: 'none' }}
                >
                  Done
                </Button>
              </Box>
            </>
          )}
        </Box>
      )}

      {/* ── Error state ─────────────────────────────────────────────── */}
      {status === 'error' && errorMessage && (
        <Alert
          severity="error"
          sx={{ mb: 2.5 }}
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => {
                setStatus('idle');
                setErrorMessage('');
              }}
              sx={{ textTransform: 'none', fontWeight: 600 }}
            >
              Dismiss
            </Button>
          }
        >
          {errorMessage}
        </Alert>
      )}

      {/* ── Form ────────────────────────────────────────────────────── */}
      {status !== 'success' && status !== 'polling' && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {urlCorrected && (
            <Alert
              severity="info"
              onClose={() => setUrlCorrected(false)}
              sx={{ mb: 0 }}
            >
              The URL was auto-corrected to a cloneable repository URL.
            </Alert>
          )}

          <TextField
            label="Git Repository"
            placeholder={`https://github.com/your-org/${label}-repo`}
            value={gitRepo}
            onChange={ev => setGitRepo(ev.target.value)}
            required
            fullWidth
            size="small"
            helperText="Git repository clone URL. Links to specific files or branches will be auto-corrected."
            disabled={status === 'creating'}
          />

          <NamespacePicker
            value={namespace}
            onChange={setNamespace}
            label="Namespace"
            size="small"
            enabledOnly
            required
          />

          <Box>
            <Button
              size="small"
              onClick={() => setAdvancedOpen(v => !v)}
              endIcon={
                <ExpandMoreIcon
                  sx={{
                    transform: advancedOpen ? 'rotate(180deg)' : 'none',
                    transition: 'transform 0.2s',
                  }}
                />
              }
              sx={{
                textTransform: 'none',
                color: theme.palette.text.secondary,
              }}
            >
              Resource Limits
            </Button>
            <Collapse in={advancedOpen}>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 2,
                  mt: 1,
                  p: 2,
                  borderRadius: 1.5,
                  bgcolor: alpha(theme.palette.action.hover, 0.04),
                  border: `1px solid ${theme.palette.divider}`,
                }}
              >
                <TextField
                  label="Memory Limit"
                  value={memoryLimit}
                  onChange={ev => setMemoryLimit(ev.target.value)}
                  size="small"
                  helperText="e.g. 8Gi, 4Gi"
                  disabled={status === 'creating'}
                />
                <TextField
                  label="CPU Limit"
                  value={cpuLimit}
                  onChange={ev => setCpuLimit(ev.target.value)}
                  size="small"
                  helperText="e.g. 2000m, 4000m"
                  disabled={status === 'creating'}
                />
              </Box>
            </Collapse>
          </Box>

          <Box
            sx={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 1.5,
              mt: 1,
            }}
          >
            <Button
              onClick={onBack}
              disabled={status === 'creating'}
              sx={{ textTransform: 'none' }}
            >
              Back
            </Button>
            <Button
              variant="contained"
              onClick={handleCreate}
              disabled={!isValid || status === 'creating'}
              startIcon={
                status === 'creating' ? (
                  <CircularProgress size={16} color="inherit" />
                ) : undefined
              }
              sx={{ textTransform: 'none', minWidth: 160 }}
            >
              {status === 'creating' ? 'Creating...' : 'Create Workspace'}
            </Button>
          </Box>

          {/* ── Existing workspaces ─────────────────────────────────── */}
          {namespace && (
            <Box sx={{ mt: 1 }}>
              <Divider sx={{ mb: 2 }} />
              <Box
                sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}
              >
                <Typography variant="body2" sx={{ fontWeight: 600, flex: 1 }}>
                  Existing Workspaces
                </Typography>
                <IconButton
                  size="small"
                  onClick={() => loadWorkspaces(namespace)}
                  aria-label="Refresh workspaces"
                >
                  <RefreshIcon fontSize="small" />
                </IconButton>
              </Box>

              {wsLoading && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Skeleton variant="rounded" height={48} />
                  <Skeleton variant="rounded" height={48} />
                </Box>
              )}

              {!wsLoading && workspaces.length === 0 && (
                <Typography
                  variant="body2"
                  color="text.disabled"
                  sx={{ py: 1 }}
                >
                  No workspaces in this namespace.
                </Typography>
              )}

              {!wsLoading &&
                workspaces.map(ws => (
                  <Box
                    key={ws.name}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                      py: 1,
                      px: 1.5,
                      mb: 0.5,
                      borderRadius: 1,
                      border: `1px solid ${theme.palette.divider}`,
                      '&:hover': {
                        bgcolor: alpha(theme.palette.action.hover, 0.04),
                      },
                    }}
                  >
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 600 }}
                        noWrap
                      >
                        {ws.name}
                      </Typography>
                      {ws.git_repo && (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          noWrap
                        >
                          {ws.git_repo}
                        </Typography>
                      )}
                    </Box>
                    <Chip
                      label={ws.phase}
                      size="small"
                      color={PHASE_COLORS[ws.phase] ?? 'default'}
                      sx={{ height: 20, fontSize: '0.7rem', flexShrink: 0 }}
                    />
                    {ws.url && (
                      <Tooltip title="Open in DevSpace">
                        <IconButton
                          size="small"
                          href={ws.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label="Open workspace"
                        >
                          <OpenInNewIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    {ws.phase === 'Running' && (
                      <Tooltip title="Stop workspace">
                        <IconButton
                          size="small"
                          onClick={() => handleStop(ws)}
                          aria-label="Stop workspace"
                        >
                          <StopCircleOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title="Delete workspace">
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(ws)}
                        aria-label="Delete workspace"
                        sx={{ color: theme.palette.error.main }}
                      >
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                ))}
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
}
