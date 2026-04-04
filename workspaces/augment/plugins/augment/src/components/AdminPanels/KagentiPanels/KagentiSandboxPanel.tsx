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
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useApi } from '@backstage/core-plugin-api';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TablePagination from '@mui/material/TablePagination';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Chip from '@mui/material/Chip';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Tooltip from '@mui/material/Tooltip';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditIcon from '@mui/icons-material/Edit';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useTheme, alpha } from '@mui/material/styles';
import type {
  KagentiSandboxAgentInfo,
  KagentiSandboxSession,
  KagentiSessionTokenUsage,
} from '@red-hat-developer-hub/backstage-plugin-augment-common';
import { augmentApiRef } from '../../../api';
import * as kagentiEndpoints from '../../../api/kagentiEndpoints';
import { getErrorMessage } from '../../../utils';
import { ConfirmDialog } from '../shared/ConfirmDialog';
import { SELECT_MENU_PROPS } from '../shared/selectMenuProps';

export interface KagentiSandboxPanelProps {
  namespace: string;
}

type KagentiFetchJson = (path: string, init?: RequestInit) => Promise<unknown>;

const ROWS = 10;

export function KagentiSandboxPanel({ namespace }: KagentiSandboxPanelProps) {
  const theme = useTheme();
  const api = useApi(augmentApiRef);
  const kagentiDeps = useMemo(
    () => ({
      fetchJson: (api as unknown as { fetchJson: KagentiFetchJson }).fetchJson.bind(
        api,
      ),
    }),
    [api],
  );

  const [flagsOk, setFlagsOk] = useState<boolean | null>(null);
  const [sessions, setSessions] = useState<KagentiSandboxSession[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<KagentiSandboxSession | null>(null);
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameTitle, setRenameTitle] = useState('');
  const [actionBusy, setActionBusy] = useState<string | null>(null);
  const [killTarget, setKillTarget] = useState<KagentiSandboxSession | null>(
    null,
  );
  const [tokenUsage, setTokenUsage] = useState<KagentiSessionTokenUsage | null>(
    null,
  );
  const [tokenLoading, setTokenLoading] = useState(false);
  const [sandboxAgents, setSandboxAgents] = useState<KagentiSandboxAgentInfo[]>(
    [],
  );
  const [podStatus, setPodStatus] = useState<Record<string, unknown>>({});
  const [podsLoading, setPodsLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api
      .getKagentiFeatureFlags()
      .then(f => {
        if (!cancelled) setFlagsOk(f.sandbox);
      })
      .catch(() => {
        if (!cancelled) setFlagsOk(false);
      });
    return () => {
      cancelled = true;
    };
  }, [api]);

  const loadSessions = useCallback(() => {
    if (!namespace) return;
    setLoading(true);
    setError(null);
    kagentiEndpoints
      .listSandboxSessions(kagentiDeps, namespace, {
        limit: ROWS,
        offset: page * ROWS,
        search: search || undefined,
      })
      .then(res => {
        setSessions(res.sessions ?? []);
        setTotal(
          typeof res.total === 'number' ? res.total : (res.sessions ?? []).length,
        );
      })
      .catch(e => setError(getErrorMessage(e)))
      .finally(() => setLoading(false));
  }, [namespace, page, search, kagentiDeps]);

  useEffect(() => {
    if (flagsOk) loadSessions();
  }, [flagsOk, loadSessions]);

  const loadTokenUsage = useCallback(
    async (s: KagentiSandboxSession) => {
      setTokenLoading(true);
      setError(null);
      try {
        const u = await kagentiEndpoints.getSessionTokenUsage(
          kagentiDeps,
          namespace,
          s.contextId,
        );
        setTokenUsage(u);
      } catch (e) {
        setError(getErrorMessage(e));
      } finally {
        setTokenLoading(false);
      }
    },
    [namespace, kagentiDeps],
  );

  const loadPods = useCallback(() => {
    if (!namespace) return;
    setPodsLoading(true);
    setError(null);
    kagentiEndpoints
      .listSandboxAgents(kagentiDeps, namespace)
      .then(res => {
        setSandboxAgents(res.agents ?? []);
        setPodStatus({});
      })
      .catch(e => setError(getErrorMessage(e)))
      .finally(() => setPodsLoading(false));
  }, [namespace, kagentiDeps]);

  useEffect(() => {
    if (flagsOk && namespace) loadPods();
  }, [flagsOk, namespace, loadPods]);

  useEffect(() => {
    if (selected) loadTokenUsage(selected);
    else setTokenUsage(null);
  }, [selected, loadTokenUsage]);

  const refreshPodForAgent = async (name: string) => {
    setActionBusy(`pod:${name}`);
    try {
      const st = await kagentiEndpoints.getSandboxAgentPodStatus(
        kagentiDeps,
        namespace,
        name,
      );
      setPodStatus(prev => ({ ...prev, [name]: st }));
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setActionBusy(null);
    }
  };

  const runSessionAction = async (
    key: string,
    fn: () => Promise<unknown>,
  ) => {
    setActionBusy(key);
    setError(null);
    try {
      await fn();
      loadSessions();
      if (selected) loadTokenUsage(selected);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setActionBusy(null);
    }
  };

  const openRename = (s: KagentiSandboxSession) => {
    setSelected(s);
    setRenameTitle(s.title ?? '');
    setRenameOpen(true);
  };

  const submitRename = async () => {
    if (!selected) return;
    setActionBusy('rename');
    setError(null);
    try {
      await kagentiEndpoints.renameSandboxSession(
        kagentiDeps,
        namespace,
        selected.contextId,
        renameTitle,
      );
      loadSessions();
      setRenameOpen(false);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setActionBusy(null);
    }
  };

  if (flagsOk === null) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress size={28} />
      </Box>
    );
  }

  if (!flagsOk) {
    return (
      <Alert severity="info">
        Sandbox admin is disabled for this deployment (feature flag).
      </Alert>
    );
  }

  if (!namespace) {
    return <Alert severity="warning">Select a namespace to list sessions.</Alert>;
  }

  let tokenUsagePanel: ReactNode;
  if (!selected) {
    tokenUsagePanel = (
      <Typography variant="body2" color="textSecondary">
        Select a session to view token usage.
      </Typography>
    );
  } else if (tokenLoading) {
    tokenUsagePanel = <CircularProgress size={22} />;
  } else if (tokenUsage) {
    tokenUsagePanel = (
      <Box
        sx={{
          p: 1.5,
          borderRadius: 1,
          border: 1,
          borderColor: 'divider',
          bgcolor: alpha(theme.palette.info.main, 0.06),
        }}
      >
        <Typography variant="body2">
          Total tokens: {tokenUsage.totalTokens ?? '—'} · Cost:{' '}
          {tokenUsage.totalCost ?? '—'}
        </Typography>
        {(tokenUsage.models ?? []).map(m => (
          <Typography key={m.model} variant="caption" display="block">
            {m.model}: {m.tokens} tokens
            {m.cost !== undefined && m.cost !== null ? ` ($${m.cost})` : ''}
          </Typography>
        ))}
      </Box>
    );
  } else {
    tokenUsagePanel = (
      <Typography variant="body2" color="textSecondary">
        No usage data.
      </Typography>
    );
  }

  let podsPanel: ReactNode;
  if (podsLoading) {
    podsPanel = <CircularProgress size={22} />;
  } else if (sandboxAgents.length === 0) {
    podsPanel = (
      <Typography variant="body2" color="textSecondary">
        No sandbox agents.
      </Typography>
    );
  } else {
    podsPanel = (
      <TableContainer
        sx={{
          border: 1,
          borderColor: 'divider',
          borderRadius: 1,
        }}
      >
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Sessions</TableCell>
              <TableCell align="right">Pod status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sandboxAgents.map(a => (
              <TableRow key={a.name}>
                <TableCell>{a.name}</TableCell>
                <TableCell>{a.sessionCount ?? '—'}</TableCell>
                <TableCell align="right">
                  <Button
                    size="small"
                    onClick={() => refreshPodForAgent(a.name)}
                    disabled={actionBusy === `pod:${a.name}`}
                    sx={{ textTransform: 'none' }}
                  >
                    {actionBusy === `pod:${a.name}` ? (
                      <CircularProgress size={16} />
                    ) : (
                      'Fetch status'
                    )}
                  </Button>
                  {Object.prototype.hasOwnProperty.call(podStatus, a.name) && (() => {
                    const ps = podStatus[a.name] as Record<string, unknown> | null;
                    if (!ps) return <Typography variant="caption" sx={{ mt: 0.5 }}>No data</Typography>;
                    const phase = String(ps.phase ?? ps.status ?? '—');
                    const restarts = ps.restartCount ?? ps.restarts;
                    const phaseColor = phase === 'Running' ? 'success' : phase === 'Pending' ? 'warning' : phase === 'Failed' ? 'error' : 'default';
                    return (
                      <Box sx={{ mt: 0.5, display: 'flex', flexWrap: 'wrap', gap: 0.5, justifyContent: 'flex-end' }}>
                        <Chip label={phase} size="small" color={phaseColor as 'success' | 'warning' | 'error' | 'default'} sx={{ height: 20, fontSize: '0.65rem' }} />
                        {restarts !== undefined && (
                          <Chip label={`${restarts} restart${Number(restarts) === 1 ? '' : 's'}`} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.65rem' }} />
                        )}
                        {ps.podName && (
                          <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.6rem' }}>{String(ps.podName)}</Typography>
                        )}
                      </Box>
                    );
                  })()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  }

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h6" sx={{ fontSize: '1rem', mb: 2 }}>
          Sandbox sessions
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 1,
            mb: 2,
            alignItems: 'center',
          }}
        >
          <TextField
            size="small"
            label="Search"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                setPage(0);
                setSearch(searchInput);
              }
            }}
            sx={{ minWidth: 200 }}
          />
          <Button
            size="small"
            variant="outlined"
            onClick={() => {
              setPage(0);
              setSearch(searchInput);
            }}
            sx={{ textTransform: 'none' }}
          >
            Apply
          </Button>
          <Button
            size="small"
            startIcon={<RefreshIcon />}
            onClick={loadSessions}
            disabled={loading}
            sx={{ textTransform: 'none' }}
          >
            Refresh
          </Button>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress size={28} />
          </Box>
        ) : (
          <>
            <TableContainer
              sx={{
                border: 1,
                borderColor: 'divider',
                borderRadius: 1,
                bgcolor: alpha(theme.palette.background.paper, 0.5),
              }}
            >
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Title</TableCell>
                    <TableCell>Context</TableCell>
                    <TableCell>Agent</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Visibility</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sessions.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                          No sessions found
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                  {sessions.map(s => (
                    <TableRow
                      key={s.contextId}
                      selected={selected?.contextId === s.contextId}
                      hover
                      onClick={() => setSelected(s)}
                      sx={{ cursor: 'pointer' }}
                    >
                      <TableCell>{s.title ?? '—'}</TableCell>
                      <TableCell>
                        <Typography variant="caption" noWrap sx={{ maxWidth: 120 }}>
                          {s.contextId}
                        </Typography>
                      </TableCell>
                      <TableCell>{s.agentName ?? '—'}</TableCell>
                      <TableCell>
                        <Chip label={s.status} size="small" />
                      </TableCell>
                      <TableCell>{s.visibility ?? '—'}</TableCell>
                      <TableCell align="right" onClick={e => e.stopPropagation()}>
                        <Tooltip title="Rename session">
                          <IconButton
                            size="small"
                            aria-label="Rename session"
                            onClick={() => openRename(s)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Approve session">
                          <span>
                            <IconButton
                              size="small"
                              aria-label="Approve session"
                              disabled={actionBusy === `ap:${s.contextId}`}
                              onClick={() =>
                                runSessionAction(`ap:${s.contextId}`, () =>
                                  kagentiEndpoints.approveSandboxSession(
                                    kagentiDeps,
                                    namespace,
                                    s.contextId,
                                  ),
                                )
                              }
                            >
                              <CheckIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                        <Tooltip title="Deny session">
                          <span>
                            <IconButton
                              size="small"
                              aria-label="Deny session"
                              disabled={actionBusy === `dn:${s.contextId}`}
                              onClick={() =>
                                runSessionAction(`dn:${s.contextId}`, () =>
                                  kagentiEndpoints.denySandboxSession(
                                    kagentiDeps,
                                    namespace,
                                    s.contextId,
                                  ),
                                )
                              }
                            >
                              <CloseIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                        <Tooltip title="Kill session">
                          <IconButton
                            size="small"
                            color="error"
                            aria-label="Kill session"
                            onClick={() => setKillTarget(s)}
                          >
                            <DeleteOutlineIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <FormControl size="small" sx={{ minWidth: 120, ml: 0.5 }}>
                          <InputLabel>Visibility</InputLabel>
                          <Select
                            label="Visibility"
                            value={
                              s.visibility === 'private' || s.visibility === 'namespace'
                                ? s.visibility
                                : ''
                            }
                            onChange={e => {
                              const v = e.target.value as 'private' | 'namespace';
                              if (!v) return;
                              runSessionAction(`vis:${s.contextId}`, () =>
                                kagentiEndpoints.setSandboxSessionVisibility(
                                  kagentiDeps,
                                  namespace,
                                  s.contextId,
                                  v,
                                ),
                              );
                            }}
                            MenuProps={SELECT_MENU_PROPS}
                          >
                            <MenuItem value="">
                              <em>Unset</em>
                            </MenuItem>
                            <MenuItem value="private">private</MenuItem>
                            <MenuItem value="namespace">namespace</MenuItem>
                          </Select>
                        </FormControl>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              component="div"
              count={total}
              page={page}
              onPageChange={(_, p) => setPage(p)}
              rowsPerPage={ROWS}
              rowsPerPageOptions={[ROWS]}
              onRowsPerPageChange={() => {}}
            />
          </>
        )}

        <Box sx={{ mt: 3 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              mb: 1,
            }}
          >
            <Typography variant="subtitle2">Token usage</Typography>
            {selected && (
              <Button
                size="small"
                onClick={() => loadTokenUsage(selected)}
                disabled={tokenLoading}
                sx={{ textTransform: 'none' }}
              >
                Refresh
              </Button>
            )}
          </Box>
          {tokenUsagePanel}
        </Box>

        <Box sx={{ mt: 3 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              mb: 1,
            }}
          >
            <Typography variant="subtitle2">Sandbox agent pod status</Typography>
            <Button
              size="small"
              startIcon={<RefreshIcon />}
              onClick={loadPods}
              disabled={podsLoading}
              sx={{ textTransform: 'none' }}
            >
              Refresh agents
            </Button>
          </Box>
          {podsPanel}
        </Box>

        <Dialog open={renameOpen} onClose={() => setRenameOpen(false)} fullWidth maxWidth="xs">
          <DialogTitle>Rename session</DialogTitle>
          <DialogContent>
            <TextField
              label="Title"
              fullWidth
              size="small"
              value={renameTitle}
              onChange={e => setRenameTitle(e.target.value)}
              sx={{ mt: 1 }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setRenameOpen(false)} sx={{ textTransform: 'none' }}>
              Cancel
            </Button>
            <Button variant="contained" onClick={submitRename} sx={{ textTransform: 'none' }}>
              Save
            </Button>
          </DialogActions>
        </Dialog>

        <ConfirmDialog
          open={!!killTarget}
          title="Kill session"
          message={
            killTarget
              ? `Kill session ${killTarget.contextId}?`
              : ''
          }
          confirmLabel="Kill"
          onConfirm={async () => {
            const t = killTarget;
            if (!t) return;
            await runSessionAction(`kill:${t.contextId}`, () =>
              kagentiEndpoints.killSandboxSession(
                kagentiDeps,
                namespace,
                t.contextId,
              ),
            );
            setKillTarget(null);
            if (selected?.contextId === t.contextId) setSelected(null);
          }}
          onCancel={() => setKillTarget(null)}
        />
      </CardContent>
    </Card>
  );
}
