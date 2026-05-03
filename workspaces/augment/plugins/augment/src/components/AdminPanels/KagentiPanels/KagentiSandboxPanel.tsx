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
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
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
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Switch from '@mui/material/Switch';
import LinearProgress from '@mui/material/LinearProgress';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditIcon from '@mui/icons-material/Edit';
import RefreshIcon from '@mui/icons-material/Refresh';
import FolderIcon from '@mui/icons-material/Folder';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import CleaningServicesIcon from '@mui/icons-material/CleaningServices';
import TimelineIcon from '@mui/icons-material/Timeline';
import MemoryIcon from '@mui/icons-material/Memory';
import { useTheme, alpha } from '@mui/material/styles';
import type {
  KagentiSandboxAgentInfo,
  KagentiSandboxSession,
  KagentiSessionTokenUsage,
} from '@red-hat-developer-hub/backstage-plugin-augment-common';
import { augmentApiRef } from '../../../api';
import * as kagentiEndpoints from '../../../api/kagentiEndpoints';
import type { KagentiApiDeps } from '../../../api/kagentiEndpoints';
import { getErrorMessage } from '../../../utils';
import { ConfirmDialog } from '../shared/ConfirmDialog';
import {
  sectionCardSx,
  tableContainerSx,
} from '../shared/commandCenterStyles';
import { SELECT_MENU_PROPS } from '../shared/selectMenuProps';
import { PanelIntroBanner } from '../shared/PanelIntroBanner';

export interface KagentiSandboxPanelProps {
  namespace: string;
}

const ROWS = 10;

export function KagentiSandboxPanel({ namespace }: KagentiSandboxPanelProps) {
  const theme = useTheme();
  const api = useApi(augmentApiRef);
  const kagentiDeps: KagentiApiDeps = useMemo(
    () => ({
      fetchJson: (
        api as unknown as { fetchJson: KagentiApiDeps['fetchJson'] }
      ).fetchJson.bind(api),
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

  // Session detail + chain + history
  const [detailOpen, setDetailOpen] = useState(false);
  const [sessionDetail, setSessionDetail] = useState<Record<
    string,
    unknown
  > | null>(null);
  const [sessionChain, setSessionChain] = useState<Record<
    string,
    unknown
  > | null>(null);
  const [sessionHistory, setSessionHistory] = useState<Record<
    string,
    unknown
  > | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailTab, setDetailTab] = useState(0);

  // Session lifecycle
  const [cleanupOpen, setCleanupOpen] = useState(false);
  const [cleanupTtl, setCleanupTtl] = useState('60');
  const [deleteTarget, setDeleteTarget] =
    useState<KagentiSandboxSession | null>(null);

  // Pod metrics + events
  const [podMetrics, setPodMetrics] = useState<
    Record<string, Record<string, unknown>>
  >({});
  const [podEvents, setPodEvents] = useState<
    Record<string, Record<string, unknown>>
  >({});

  // File browser
  const [fileAgent, setFileAgent] = useState('');
  const [filePath, setFilePath] = useState('/');
  const [fileEntries, setFileEntries] = useState<Record<
    string,
    unknown
  > | null>(null);
  const [fileContent, setFileContent] = useState<Record<
    string,
    unknown
  > | null>(null);
  const [fileLoading, setFileLoading] = useState(false);

  // Sidecars
  const [sidecarContextId, setSidecarContextId] = useState('');
  const [sidecars, setSidecars] = useState<Array<Record<string, unknown>>>([]);
  const [sidecarsLoading, setSidecarsLoading] = useState(false);

  // Token tree
  const [tokenTree, setTokenTree] = useState<Record<string, unknown> | null>(
    null,
  );
  const [tokenTreeLoading, setTokenTreeLoading] = useState(false);

  // Events timeline
  const [eventsContextId, setEventsContextId] = useState('');
  const [events, setEvents] = useState<Record<string, unknown> | null>(null);
  const [tasks, setTasks] = useState<Record<string, unknown> | null>(null);
  const [eventsLoading, setEventsLoading] = useState(false);

  // Sandbox agent lifecycle
  const [createAgentOpen, setCreateAgentOpen] = useState(false);
  const [createAgentName, setCreateAgentName] = useState('');
  const [createAgentImage, setCreateAgentImage] = useState('');
  const [agentConfig, setAgentConfig] = useState<Record<
    string,
    unknown
  > | null>(null);
  const [agentConfigTarget, setAgentConfigTarget] = useState('');

  // Top-level tab
  const [mainTab, setMainTab] = useState(0);

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
          typeof res.total === 'number'
            ? res.total
            : (res.sessions ?? []).length,
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

  const openSessionDetail = useCallback(
    async (s: KagentiSandboxSession) => {
      setSelected(s);
      setDetailOpen(true);
      setDetailLoading(true);
      setDetailTab(0);
      try {
        const [detail, chain, history] = await Promise.allSettled([
          kagentiEndpoints.getSandboxSession(
            kagentiDeps,
            namespace,
            s.contextId,
          ),
          kagentiEndpoints.getSandboxSessionChain(
            kagentiDeps,
            namespace,
            s.contextId,
          ),
          kagentiEndpoints.getSandboxSessionHistory(
            kagentiDeps,
            namespace,
            s.contextId,
          ),
        ]);
        setSessionDetail(
          detail.status === 'fulfilled'
            ? (detail.value as unknown as Record<string, unknown>)
            : null,
        );
        setSessionChain(chain.status === 'fulfilled' ? chain.value : null);
        setSessionHistory(
          history.status === 'fulfilled' ? history.value : null,
        );
      } catch (e) {
        setError(getErrorMessage(e));
      } finally {
        setDetailLoading(false);
      }
    },
    [namespace, kagentiDeps],
  );

  const handleDeleteSession = async (s: KagentiSandboxSession) => {
    setActionBusy(`del:${s.contextId}`);
    setError(null);
    try {
      await kagentiEndpoints.deleteSandboxSession(
        kagentiDeps,
        namespace,
        s.contextId,
      );
      loadSessions();
      if (selected?.contextId === s.contextId) setSelected(null);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setActionBusy(null);
      setDeleteTarget(null);
    }
  };

  const handleCleanup = async () => {
    setActionBusy('cleanup');
    setError(null);
    try {
      await kagentiEndpoints.cleanupSandboxSessions(
        kagentiDeps,
        namespace,
        Number(cleanupTtl) || 60,
      );
      loadSessions();
      setCleanupOpen(false);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setActionBusy(null);
    }
  };

  const loadPodMetrics = async (name: string) => {
    setActionBusy(`metrics:${name}`);
    try {
      const m = await kagentiEndpoints.getSandboxAgentMetrics(
        kagentiDeps,
        namespace,
        name,
      );
      setPodMetrics(prev => ({ ...prev, [name]: m }));
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setActionBusy(null);
    }
  };

  const loadPodEvents = async (name: string) => {
    setActionBusy(`events:${name}`);
    try {
      const ev = await kagentiEndpoints.getSandboxAgentEvents(
        kagentiDeps,
        namespace,
        name,
      );
      setPodEvents(prev => ({ ...prev, [name]: ev }));
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setActionBusy(null);
    }
  };

  const loadDirectory = async () => {
    if (!fileAgent) return;
    setFileLoading(true);
    setFileContent(null);
    try {
      const entries = await kagentiEndpoints.listSandboxDirectory(
        kagentiDeps,
        namespace,
        fileAgent,
        filePath,
      );
      setFileEntries(entries);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setFileLoading(false);
    }
  };

  const loadFileContent = async (path: string) => {
    if (!fileAgent) return;
    setFileLoading(true);
    try {
      const content = await kagentiEndpoints.getSandboxFileContent(
        kagentiDeps,
        namespace,
        fileAgent,
        path,
      );
      setFileContent(content);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setFileLoading(false);
    }
  };

  const loadSidecars = async () => {
    if (!sidecarContextId) return;
    setSidecarsLoading(true);
    try {
      const res = await kagentiEndpoints.listSidecars(
        kagentiDeps,
        namespace,
        sidecarContextId,
      );
      setSidecars(
        (res.sidecars ?? []) as unknown as Array<Record<string, unknown>>,
      );
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setSidecarsLoading(false);
    }
  };

  const toggleSidecar = async (sidecarType: string, enabled: boolean) => {
    setActionBusy(`sidecar:${sidecarType}`);
    try {
      if (enabled) {
        await kagentiEndpoints.enableSidecar(
          kagentiDeps,
          namespace,
          sidecarContextId,
          sidecarType,
        );
      } else {
        await kagentiEndpoints.disableSidecar(
          kagentiDeps,
          namespace,
          sidecarContextId,
          sidecarType,
        );
      }
      await loadSidecars();
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setActionBusy(null);
    }
  };

  const resetSidecarHandler = async (sidecarType: string) => {
    setActionBusy(`sidecar-reset:${sidecarType}`);
    try {
      await kagentiEndpoints.resetSidecar(
        kagentiDeps,
        namespace,
        sidecarContextId,
        sidecarType,
      );
      await loadSidecars();
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setActionBusy(null);
    }
  };

  const loadTokenTree = async (contextId: string) => {
    setTokenTreeLoading(true);
    try {
      const tree = await kagentiEndpoints.getSessionTreeUsage(
        kagentiDeps,
        namespace,
        contextId,
      );
      setTokenTree(tree);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setTokenTreeLoading(false);
    }
  };

  const loadEvents = async () => {
    if (!eventsContextId) return;
    setEventsLoading(true);
    try {
      const [ev, tk] = await Promise.allSettled([
        kagentiEndpoints.getSandboxEvents(
          kagentiDeps,
          namespace,
          eventsContextId,
          { limit: 50 },
        ),
        kagentiEndpoints.getSandboxTasksPaginated(
          kagentiDeps,
          namespace,
          eventsContextId,
          { limit: 50 },
        ),
      ]);
      setEvents(ev.status === 'fulfilled' ? ev.value : null);
      setTasks(tk.status === 'fulfilled' ? tk.value : null);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setEventsLoading(false);
    }
  };

  const runSessionAction = async (key: string, fn: () => Promise<unknown>) => {
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
    return (
      <Alert severity="warning">Select a namespace to list sessions.</Alert>
    );
  }

  let tokenUsagePanel: ReactNode;
  if (!selected) {
    tokenUsagePanel = (
      <Typography variant="body2" color="text.secondary">
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
          bgcolor: 'background.paper',
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
      <Typography variant="body2" color="text.secondary">
        No usage data.
      </Typography>
    );
  }

  const jsonBlock = (data: unknown) => (
    <Box
      component="pre"
      sx={{
        p: 1.5,
        borderRadius: 1,
        border: 1,
        borderColor: 'divider',
        bgcolor: alpha(theme.palette.background.default, 0.5),
        fontSize: '0.75rem',
        overflow: 'auto',
        maxHeight: 400,
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-all',
      }}
    >
      {JSON.stringify(data, null, 2)}
    </Box>
  );

  const sectionCard = (
    title: string,
    actions: ReactNode | undefined,
    children: ReactNode,
  ) => (
    <Box sx={{ ...sectionCardSx(theme), mb: 2, p: 2 }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 1.5,
        }}
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
          {title}
        </Typography>
        {actions}
      </Box>
      {children}
    </Box>
  );

  // ---- Sessions tab content ----
  const sessionsTab = (
    <>
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
        <Button
          size="small"
          startIcon={<CleaningServicesIcon />}
          color="warning"
          variant="outlined"
          onClick={() => setCleanupOpen(true)}
          sx={{ textTransform: 'none', ml: 'auto' }}
        >
          Bulk Cleanup
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
          <CircularProgress size={28} />
        </Box>
      ) : (
        <>
          <TableContainer sx={tableContainerSx(theme)}>
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
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ py: 3 }}
                      >
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
                    sx={{ cursor: 'pointer' }}
                    onClick={() => setSelected(s)}
                  >
                    <TableCell>{s.title ?? '—'}</TableCell>
                    <TableCell>
                      <Typography
                        variant="caption"
                        noWrap
                        sx={{ maxWidth: 120 }}
                      >
                        {s.contextId}
                      </Typography>
                    </TableCell>
                    <TableCell>{s.agentName ?? '—'}</TableCell>
                    <TableCell>
                      <Chip label={s.status} size="small" />
                    </TableCell>
                    <TableCell>{s.visibility ?? '—'}</TableCell>
                    <TableCell align="right" onClick={e => e.stopPropagation()}>
                      <Tooltip title="View details">
                        <IconButton
                          size="small"
                          aria-label="View session details"
                          onClick={() => openSessionDetail(s)}
                        >
                          <TimelineIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Rename">
                        <IconButton
                          size="small"
                          aria-label="Rename session"
                          onClick={() => openRename(s)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Approve">
                        <Box component="span">
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
                        </Box>
                      </Tooltip>
                      <Tooltip title="Deny">
                        <Box component="span">
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
                        </Box>
                      </Tooltip>
                      <Tooltip title="Delete session">
                        <IconButton
                          size="small"
                          color="error"
                          aria-label="Delete session"
                          onClick={() => setDeleteTarget(s)}
                        >
                          <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Kill session">
                        <IconButton
                          size="small"
                          color="warning"
                          aria-label="Kill session"
                          onClick={() => setKillTarget(s)}
                        >
                          <CloseIcon fontSize="small" color="warning" />
                        </IconButton>
                      </Tooltip>
                      <FormControl size="small" sx={{ minWidth: 100, ml: 0.5 }}>
                        <InputLabel>Visibility</InputLabel>
                        <Select
                          label="Visibility"
                          value={
                            s.visibility === 'private' ||
                            s.visibility === 'namespace'
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

      <Box sx={{ mt: 2 }}>
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
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              <Button
                size="small"
                onClick={() => loadTokenUsage(selected)}
                disabled={tokenLoading}
                sx={{ textTransform: 'none' }}
              >
                Refresh
              </Button>
              <Button
                size="small"
                onClick={() => loadTokenTree(selected.contextId)}
                disabled={tokenTreeLoading}
                sx={{ textTransform: 'none' }}
              >
                Tree view
              </Button>
            </Box>
          )}
        </Box>
        {tokenUsagePanel}
        {tokenTree && (
          <Box sx={{ mt: 1.5 }}>
            <Typography
              variant="caption"
              sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}
            >
              Token Usage Tree
            </Typography>
            {jsonBlock(tokenTree)}
            <Button
              size="small"
              onClick={() => setTokenTree(null)}
              sx={{ textTransform: 'none', mt: 0.5 }}
            >
              Close tree
            </Button>
          </Box>
        )}
      </Box>
    </>
  );

  // ---- Pod Observability tab ----
  const podsTab = (
    <>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 2,
        }}
      >
        <Typography variant="subtitle2">Sandbox Agents</Typography>
        <Button
          size="small"
          startIcon={<RefreshIcon />}
          onClick={loadPods}
          disabled={podsLoading}
          sx={{ textTransform: 'none' }}
        >
          Refresh
        </Button>
      </Box>
      {/* eslint-disable-next-line no-nested-ternary */}
      {podsLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
          <CircularProgress size={28} />
        </Box>
      ) : sandboxAgents.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No sandbox agents.
        </Typography>
      ) : (
        <TableContainer
          sx={{ border: 1, borderColor: 'divider', borderRadius: 1 }}
        >
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Sessions</TableCell>
                <TableCell>Pod Status</TableCell>
                <TableCell>Metrics</TableCell>
                <TableCell>Events</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sandboxAgents.map(a => (
                <TableRow key={a.name}>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {a.name}
                    </Typography>
                  </TableCell>
                  <TableCell>{a.sessionCount ?? '—'}</TableCell>
                  <TableCell>
                    <Button
                      size="small"
                      onClick={() => refreshPodForAgent(a.name)}
                      disabled={actionBusy === `pod:${a.name}`}
                      sx={{ textTransform: 'none' }}
                    >
                      {actionBusy === `pod:${a.name}` ? (
                        <CircularProgress size={14} />
                      ) : (
                        'Fetch'
                      )}
                    </Button>
                    {Object.prototype.hasOwnProperty.call(podStatus, a.name) &&
                      (() => {
                        const ps = podStatus[a.name] as Record<
                          string,
                          unknown
                        > | null;
                        if (!ps)
                          return (
                            <Typography variant="caption" sx={{ mt: 0.5 }}>
                              No data
                            </Typography>
                          );
                        const phase = String(ps.phase ?? ps.status ?? '—');
                        const restarts = ps.restartCount ?? ps.restarts;
                        const colorMap: Record<string, string> = {
                          Running: 'success',
                          Pending: 'warning',
                          Failed: 'error',
                        };
                        return (
                          <Box
                            sx={{
                              mt: 0.5,
                              display: 'flex',
                              flexWrap: 'wrap',
                              gap: 0.5,
                            }}
                          >
                            <Chip
                              label={phase}
                              size="small"
                              color={
                                (colorMap[phase] || 'default') as
                                  | 'success'
                                  | 'warning'
                                  | 'error'
                                  | 'default'
                              }
                              sx={{ height: 24, fontSize: '0.75rem' }}
                            />
                            {restarts !== undefined && (
                              <Chip
                                label={`${restarts} restart${Number(restarts) === 1 ? '' : 's'}`}
                                size="small"
                                variant="outlined"
                                sx={{ height: 24, fontSize: '0.75rem' }}
                              />
                            )}
                          </Box>
                        );
                      })()}
                  </TableCell>
                  <TableCell>
                    <Button
                      size="small"
                      startIcon={<MemoryIcon />}
                      onClick={() => loadPodMetrics(a.name)}
                      disabled={actionBusy === `metrics:${a.name}`}
                      sx={{ textTransform: 'none' }}
                    >
                      {actionBusy === `metrics:${a.name}` ? (
                        <CircularProgress size={14} />
                      ) : (
                        'Metrics'
                      )}
                    </Button>
                    {podMetrics[a.name] && jsonBlock(podMetrics[a.name])}
                  </TableCell>
                  <TableCell>
                    <Button
                      size="small"
                      startIcon={<TimelineIcon />}
                      onClick={() => loadPodEvents(a.name)}
                      disabled={actionBusy === `events:${a.name}`}
                      sx={{ textTransform: 'none' }}
                    >
                      {actionBusy === `events:${a.name}` ? (
                        <CircularProgress size={14} />
                      ) : (
                        'Events'
                      )}
                    </Button>
                    {podEvents[a.name] && jsonBlock(podEvents[a.name])}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </>
  );

  // ---- File Browser tab ----
  const fileTab = (
    <>
      <Box sx={{ display: 'flex', gap: 1, mb: 2, alignItems: 'center' }}>
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Agent</InputLabel>
          <Select
            label="Agent"
            value={fileAgent}
            onChange={e => {
              setFileAgent(e.target.value);
              setFileEntries(null);
              setFileContent(null);
            }}
            MenuProps={SELECT_MENU_PROPS}
          >
            {sandboxAgents.map(a => (
              <MenuItem key={a.name} value={a.name}>
                {a.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField
          size="small"
          label="Path"
          value={filePath}
          onChange={e => setFilePath(e.target.value)}
          sx={{ minWidth: 200 }}
        />
        <Button
          size="small"
          variant="outlined"
          onClick={loadDirectory}
          disabled={!fileAgent || fileLoading}
          sx={{ textTransform: 'none' }}
        >
          Browse
        </Button>
      </Box>
      {fileLoading && <LinearProgress sx={{ mb: 1 }} />}
      {fileEntries && (
        <Box
          sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 1.5 }}
        >
          {(() => {
            const entries =
              (fileEntries as Record<string, unknown>).entries ??
              (fileEntries as Record<string, unknown>).files ??
              [];
            if (!Array.isArray(entries) || entries.length === 0)
              return (
                <Typography variant="body2" color="text.secondary">
                  Empty directory
                </Typography>
              );
            return entries.map(
              (entry: Record<string, unknown>, idx: number) => {
                const name = String(
                  entry.name ?? entry.path ?? entry.filename ?? '',
                );
                const isDir =
                  entry.type === 'directory' || entry.isDirectory === true;
                return (
                  <Box
                    key={idx}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      py: 0.3,
                      cursor: 'pointer',
                      '&:hover': {
                        bgcolor: alpha(theme.palette.action.hover, 0.1),
                      },
                      borderRadius: 0.5,
                      px: 0.5,
                    }}
                    onClick={() => {
                      const newPath = filePath.endsWith('/')
                        ? `${filePath}${name}`
                        : `${filePath}/${name}`;
                      if (isDir) {
                        setFilePath(newPath);
                        setFileContent(null);
                        loadDirectory();
                      } else loadFileContent(newPath);
                    }}
                  >
                    {isDir ? (
                      <FolderIcon
                        sx={{ fontSize: 16, color: theme.palette.warning.main }}
                      />
                    ) : (
                      <InsertDriveFileIcon
                        sx={{ fontSize: 16, color: theme.palette.info.main }}
                      />
                    )}
                    <Typography variant="body2">{name}</Typography>
                    {entry.size !== undefined && (
                      <Typography
                        variant="caption"
                        sx={{ ml: 'auto', color: 'text.disabled' }}
                      >
                        {String(entry.size)}
                      </Typography>
                    )}
                  </Box>
                );
              },
            );
          })()}
        </Box>
      )}
      {fileContent && (
        <Box sx={{ mt: 2 }}>
          <Box
            sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}
          >
            <Typography variant="caption" sx={{ fontWeight: 600 }}>
              File content
            </Typography>
            <Button
              size="small"
              onClick={() => setFileContent(null)}
              sx={{ textTransform: 'none' }}
            >
              Close
            </Button>
          </Box>
          {jsonBlock(fileContent)}
        </Box>
      )}
    </>
  );

  // ---- Sidecars tab ----
  const sidecarsTab = (
    <>
      <Box sx={{ display: 'flex', gap: 1, mb: 2, alignItems: 'center' }}>
        <TextField
          size="small"
          label="Session Context ID"
          value={sidecarContextId}
          onChange={e => setSidecarContextId(e.target.value)}
          sx={{ minWidth: 240 }}
          placeholder="Enter a session context ID"
        />
        <Button
          size="small"
          variant="outlined"
          onClick={loadSidecars}
          disabled={!sidecarContextId || sidecarsLoading}
          sx={{ textTransform: 'none' }}
        >
          Load sidecars
        </Button>
      </Box>
      {sidecarsLoading && <LinearProgress sx={{ mb: 1 }} />}
      {sidecars.length > 0 && (
        <TableContainer
          sx={{ border: 1, borderColor: 'divider', borderRadius: 1 }}
        >
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Type</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Enabled</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sidecars.map((sc, idx) => {
                const scType = String(sc.type ?? sc.name ?? `sidecar-${idx}`);
                const isEnabled =
                  sc.enabled === true || sc.status === 'enabled';
                return (
                  <TableRow key={idx}>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {scType}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={String(sc.status ?? '—')} size="small" />
                    </TableCell>
                    <TableCell>
                      <Switch
                        size="small"
                        checked={isEnabled}
                        disabled={actionBusy?.startsWith('sidecar:')}
                        onChange={(_, checked) =>
                          toggleSidecar(scType, checked)
                        }
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Button
                        size="small"
                        onClick={() => resetSidecarHandler(scType)}
                        disabled={actionBusy === `sidecar-reset:${scType}`}
                        sx={{ textTransform: 'none' }}
                      >
                        Reset
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      {!sidecarsLoading && sidecars.length === 0 && sidecarContextId && (
        <Typography variant="body2" color="text.secondary">
          No sidecars loaded. Click &quot;Load sidecars&quot; to fetch.
        </Typography>
      )}
    </>
  );

  // ---- Sandbox Agent Lifecycle tab ----
  const handleCreateSandbox = async () => {
    if (!createAgentName) return;
    setActionBusy('create-sandbox');
    setError(null);
    try {
      await kagentiEndpoints.createSandbox(kagentiDeps, namespace, {
        name: createAgentName,
        image: createAgentImage || undefined,
      } as import('@red-hat-developer-hub/backstage-plugin-augment-common').KagentiSandboxCreateRequest);
      loadPods();
      setCreateAgentOpen(false);
      setCreateAgentName('');
      setCreateAgentImage('');
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setActionBusy(null);
    }
  };

  const handleDeleteSandbox = async (name: string) => {
    setActionBusy(`del-sandbox:${name}`);
    setError(null);
    try {
      await kagentiEndpoints.deleteSandbox(kagentiDeps, namespace, name);
      loadPods();
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setActionBusy(null);
    }
  };

  const loadAgentConfig = async (name: string) => {
    setActionBusy(`config:${name}`);
    try {
      const cfg = await kagentiEndpoints.getSandboxConfig(
        kagentiDeps,
        namespace,
        name,
      );
      setAgentConfig(cfg);
      setAgentConfigTarget(name);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setActionBusy(null);
    }
  };

  const agentLifecycleTab = (
    <>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 2,
        }}
      >
        <Typography variant="subtitle2">Sandbox Agent Lifecycle</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            size="small"
            variant="contained"
            onClick={() => setCreateAgentOpen(true)}
            sx={{ textTransform: 'none' }}
          >
            Create Agent
          </Button>
          <Button
            size="small"
            startIcon={<RefreshIcon />}
            onClick={loadPods}
            disabled={podsLoading}
            sx={{ textTransform: 'none' }}
          >
            Refresh
          </Button>
        </Box>
      </Box>
      {/* eslint-disable-next-line no-nested-ternary */}
      {podsLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
          <CircularProgress size={28} />
        </Box>
      ) : sandboxAgents.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No sandbox agents found.
        </Typography>
      ) : (
        <TableContainer
          sx={{ border: 1, borderColor: 'divider', borderRadius: 1 }}
        >
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Sessions</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sandboxAgents.map(a => (
                <TableRow key={a.name}>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {a.name}
                    </Typography>
                  </TableCell>
                  <TableCell>{a.sessionCount ?? '—'}</TableCell>
                  <TableCell align="right">
                    <Button
                      size="small"
                      onClick={() => loadAgentConfig(a.name)}
                      disabled={actionBusy === `config:${a.name}`}
                      sx={{ textTransform: 'none' }}
                    >
                      Config
                    </Button>
                    <Button
                      size="small"
                      color="error"
                      onClick={() => handleDeleteSandbox(a.name)}
                      disabled={actionBusy === `del-sandbox:${a.name}`}
                      sx={{ textTransform: 'none', ml: 0.5 }}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      {agentConfig && agentConfigTarget && (
        <Box sx={{ mt: 2 }}>
          <Box
            sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}
          >
            <Typography variant="caption" sx={{ fontWeight: 600 }}>
              Config for {agentConfigTarget}
            </Typography>
            <Button
              size="small"
              onClick={() => setAgentConfig(null)}
              sx={{ textTransform: 'none' }}
            >
              Close
            </Button>
          </Box>
          {jsonBlock(agentConfig)}
        </Box>
      )}
      <Dialog
        open={createAgentOpen}
        onClose={() => setCreateAgentOpen(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Create Sandbox Agent</DialogTitle>
        <DialogContent>
          <TextField
            label="Agent Name"
            fullWidth
            size="small"
            value={createAgentName}
            onChange={e => setCreateAgentName(e.target.value)}
            sx={{ mt: 1, mb: 2 }}
          />
          <TextField
            label="Image (optional)"
            fullWidth
            size="small"
            value={createAgentImage}
            onChange={e => setCreateAgentImage(e.target.value)}
            placeholder="e.g. quay.io/..."
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setCreateAgentOpen(false)}
            sx={{ textTransform: 'none' }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleCreateSandbox}
            disabled={!createAgentName || actionBusy === 'create-sandbox'}
            sx={{ textTransform: 'none' }}
          >
            {actionBusy === 'create-sandbox' ? (
              <CircularProgress size={16} sx={{ mr: 0.5 }} />
            ) : null}
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );

  // ---- Events timeline tab ----
  const eventsTab = (
    <>
      <Box sx={{ display: 'flex', gap: 1, mb: 2, alignItems: 'center' }}>
        <TextField
          size="small"
          label="Session Context ID"
          value={eventsContextId}
          onChange={e => setEventsContextId(e.target.value)}
          sx={{ minWidth: 240 }}
          placeholder="Enter a session context ID"
        />
        <Button
          size="small"
          variant="outlined"
          onClick={loadEvents}
          disabled={!eventsContextId || eventsLoading}
          sx={{ textTransform: 'none' }}
        >
          Load events
        </Button>
      </Box>
      {eventsLoading && <LinearProgress sx={{ mb: 1 }} />}
      {events && sectionCard('Events', undefined, jsonBlock(events))}
      {tasks && sectionCard('Tasks', undefined, jsonBlock(tasks))}
    </>
  );

  return (
    <Card variant="outlined">
      <CardContent>
        <PanelIntroBanner storageKey="sandbox-panel">
          The Sandbox provides isolated environments to test agents before
          promoting them to production. Create sessions, inspect conversations,
          and validate behavior.
        </PanelIntroBanner>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, color: 'text.primary' }}>
          Sandbox Management
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Tabs
          value={mainTab}
          onChange={(_, v) => setMainTab(v)}
          sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Sessions" sx={{ textTransform: 'none', minHeight: 40 }} />
          <Tab
            label="Agent Lifecycle"
            sx={{ textTransform: 'none', minHeight: 40 }}
          />
          <Tab
            label="Pod Observability"
            sx={{ textTransform: 'none', minHeight: 40 }}
          />
          <Tab
            label="File Browser"
            sx={{ textTransform: 'none', minHeight: 40 }}
          />
          <Tab label="Sidecars" sx={{ textTransform: 'none', minHeight: 40 }} />
          <Tab
            label="Events & Tasks"
            sx={{ textTransform: 'none', minHeight: 40 }}
          />
        </Tabs>

        {mainTab === 0 && sessionsTab}
        {mainTab === 1 && agentLifecycleTab}
        {mainTab === 2 && podsTab}
        {mainTab === 3 && fileTab}
        {mainTab === 4 && sidecarsTab}
        {mainTab === 5 && eventsTab}

        {/* Session detail dialog */}
        <Dialog
          open={detailOpen}
          onClose={() => setDetailOpen(false)}
          fullWidth
          maxWidth="md"
        >
          <DialogTitle>
            Session Detail — {selected?.contextId ?? ''}
          </DialogTitle>
          <DialogContent>
            {detailLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress size={28} />
              </Box>
            ) : (
              <>
                <Tabs
                  value={detailTab}
                  onChange={(_, v) => setDetailTab(v)}
                  sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
                >
                  <Tab label="Detail" sx={{ textTransform: 'none' }} />
                  <Tab label="Chain" sx={{ textTransform: 'none' }} />
                  <Tab label="History" sx={{ textTransform: 'none' }} />
                </Tabs>
                {detailTab === 0 &&
                  (sessionDetail ? (
                    jsonBlock(sessionDetail)
                  ) : (
                    <Typography color="text.secondary">
                      No detail data
                    </Typography>
                  ))}
                {detailTab === 1 &&
                  (sessionChain ? (
                    jsonBlock(sessionChain)
                  ) : (
                    <Typography color="text.secondary">No chain data</Typography>
                  ))}
                {detailTab === 2 &&
                  (sessionHistory ? (
                    jsonBlock(sessionHistory)
                  ) : (
                    <Typography color="text.secondary">
                      No history data
                    </Typography>
                  ))}
              </>
            )}
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => setDetailOpen(false)}
              sx={{ textTransform: 'none' }}
            >
              Close
            </Button>
          </DialogActions>
        </Dialog>

        {/* Rename dialog */}
        <Dialog
          open={renameOpen}
          onClose={() => setRenameOpen(false)}
          fullWidth
          maxWidth="xs"
        >
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
            <Button
              onClick={() => setRenameOpen(false)}
              sx={{ textTransform: 'none' }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={submitRename}
              sx={{ textTransform: 'none' }}
            >
              Save
            </Button>
          </DialogActions>
        </Dialog>

        {/* Bulk cleanup dialog */}
        <Dialog
          open={cleanupOpen}
          onClose={() => setCleanupOpen(false)}
          fullWidth
          maxWidth="xs"
        >
          <DialogTitle>Bulk Session Cleanup</DialogTitle>
          <DialogContent>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Remove sessions older than the specified TTL (minutes). This
              action cannot be undone.
            </Typography>
            <TextField
              label="TTL (minutes)"
              fullWidth
              size="small"
              type="number"
              value={cleanupTtl}
              onChange={e => setCleanupTtl(e.target.value)}
            />
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => setCleanupOpen(false)}
              sx={{ textTransform: 'none' }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              color="warning"
              onClick={handleCleanup}
              disabled={actionBusy === 'cleanup'}
              sx={{ textTransform: 'none' }}
            >
              {actionBusy === 'cleanup' ? (
                <CircularProgress size={16} sx={{ mr: 0.5 }} />
              ) : null}
              Cleanup
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete session confirm */}
        <ConfirmDialog
          open={!!deleteTarget}
          title="Delete session"
          message={
            deleteTarget
              ? `Permanently delete session ${deleteTarget.contextId}?`
              : ''
          }
          confirmLabel="Delete"
          onConfirm={async () => {
            if (deleteTarget) await handleDeleteSession(deleteTarget);
          }}
          onCancel={() => setDeleteTarget(null)}
        />

        {/* Kill session confirm */}
        <ConfirmDialog
          open={!!killTarget}
          title="Kill session"
          message={killTarget ? `Kill session ${killTarget.contextId}?` : ''}
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
