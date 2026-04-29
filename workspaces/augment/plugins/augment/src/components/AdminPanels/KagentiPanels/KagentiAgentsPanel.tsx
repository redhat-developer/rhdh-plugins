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
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useApi } from '@backstage/core-plugin-api';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TablePagination from '@mui/material/TablePagination';
import TableSortLabel from '@mui/material/TableSortLabel';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import SearchIcon from '@mui/icons-material/Search';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import RefreshIcon from '@mui/icons-material/Refresh';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ChatOutlinedIcon from '@mui/icons-material/ChatOutlined';
import { useTheme, alpha } from '@mui/material/styles';
import type {
  KagentiAgentSummary,
  ChatAgent,
} from '@red-hat-developer-hub/backstage-plugin-augment-common';
import HubOutlinedIcon from '@mui/icons-material/HubOutlined';
import AddIcon from '@mui/icons-material/Add';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { augmentApiRef } from '../../../api';
import { getErrorMessage } from '../../../utils';
import { AgentsPanel } from '../AgentsPanel';
import { ConfirmDialog } from '../shared/ConfirmDialog';
import { AgentCreateIntentDialog } from './AgentCreateIntentDialog';
import { CreateAgentWizard } from './CreateAgentWizard';
import { KagentiAgentDetailView } from './KagentiAgentDetailView';
import { OrchAgentDetailView } from './OrchAgentDetailView';
import { statusChipColor, formatDateTime } from './kagentiDisplayUtils';
import type { DeploymentMethod } from './agentWizardTypes';
import {
  CONTENT_MAX_WIDTH,
  PAGE_TITLE_SX,
  PAGE_SUBTITLE_SX,
  TABLE_HEADER_CELL_SX,
  tableContainerSx,
  emptyStateSx,
} from '../shared/commandCenterStyles';

interface AgentRow {
  id: string;
  name: string;
  namespace?: string;
  description: string;
  status: string;
  labels: { protocol?: string | string[]; framework?: string };
  workloadType?: string;
  createdAt?: string;
  source: 'kagenti' | 'orchestration';
  agentRole?: string;
  kagentiAgent?: KagentiAgentSummary;
}

type SortField = 'name' | 'status' | 'workloadType' | 'createdAt';
type SortDir = 'asc' | 'desc';

function compareRows(a: AgentRow, b: AgentRow, field: SortField): number {
  if (field === 'createdAt') {
    const tA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const tB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return tA - tB;
  }
  const valA = a[field] ?? '';
  const valB = b[field] ?? '';
  return String(valA).localeCompare(String(valB));
}

function kagentiToRow(a: KagentiAgentSummary): AgentRow {
  return {
    id: `${a.namespace}/${a.name}`,
    name: a.name,
    namespace: a.namespace,
    description: a.description,
    status: a.status,
    labels: a.labels,
    workloadType: a.workloadType,
    createdAt: a.createdAt,
    source: 'kagenti',
    kagentiAgent: a,
  };
}

function orchAgentToRow(a: ChatAgent): AgentRow {
  return {
    id: a.id,
    name: a.name,
    description: a.description ?? '',
    status: a.status,
    labels: { framework: a.framework },
    workloadType: 'config',
    source: 'orchestration',
    agentRole: a.agentRole,
  };
}

const TH_STYLE = TABLE_HEADER_CELL_SX;

export interface AgentPanelTourControl {
  openIntent: () => void;
  closeIntent: () => void;
  selectIntent: (cardId: string) => void;
  closeWizard: () => void;
  setWizardStep: (step: number) => void;
  setDeployMethod: (method: string) => void;
}

export interface KagentiAgentsPanelProps {
  namespace?: string;
  onChatWithAgent?: (agentId: string) => void;
  autoOpenIntent?: boolean;
  onIntentOpened?: () => void;
  onFullScreenChange?: (fullScreen: boolean) => void;
  initialAgentName?: string;
  onFocusConsumed?: () => void;
  tourControlRef?: React.MutableRefObject<AgentPanelTourControl | null>;
}

export function KagentiAgentsPanel({
  namespace,
  onChatWithAgent,
  autoOpenIntent,
  onIntentOpened,
  onFullScreenChange,
  initialAgentName,
  onFocusConsumed,
  tourControlRef,
}: KagentiAgentsPanelProps) {
  const theme = useTheme();
  const api = useApi(augmentApiRef);
  const [rows, setRows] = useState<AgentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [intentOpen, setIntentOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [initialDeployMethod, setInitialDeployMethod] = useState<
    DeploymentMethod | undefined
  >(undefined);
  const wizardStepRef = useRef<((step: number) => void) | null>(null);
  const deployMethodRef = useRef<((method: string) => void) | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<KagentiAgentSummary | null>(
    null,
  );

  const [selectedAgent, setSelectedAgent] =
    useState<KagentiAgentSummary | null>(null);
  const [selectedOrchAgent, setSelectedOrchAgent] =
    useState<ChatAgent | null>(null);
  const [showOrchestration, setShowOrchestration] = useState(false);
  const [orchFocusKey, setOrchFocusKey] = useState<string | undefined>();
  const [autoCreateAgent, setAutoCreateAgent] = useState(false);
  const [createType, setCreateType] = useState<'single' | 'multi' | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const loadAgents = useCallback(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      api.listKagentiAgents(namespace || undefined).catch(() => ({ agents: [] as KagentiAgentSummary[] })),
      api.listAgents().catch(() => [] as ChatAgent[]),
    ]).then(([kagentiRes, allAgents]) => {
      const kagentiRows = (kagentiRes.agents ?? []).map(kagentiToRow);
      const orchRows = allAgents
        .filter(a => a.source === 'orchestration')
        .map(orchAgentToRow);
      setRows([...kagentiRows, ...orchRows]);
    }).catch(e => setError(getErrorMessage(e)))
      .finally(() => setLoading(false));
  }, [api, namespace]);

  useEffect(() => {
    loadAgents();
  }, [loadAgents]);

  useEffect(() => {
    if (autoOpenIntent) {
      setIntentOpen(true);
      onIntentOpened?.();
    }
  }, [autoOpenIntent, onIntentOpened]);

  useEffect(() => {
    if (tourControlRef) {
      tourControlRef.current = {
        openIntent: () => setIntentOpen(true),
        closeIntent: () => setIntentOpen(false),
        selectIntent: (cardId: string) => {
          if (cardId === 'deploy') {
            setIntentOpen(false);
            setCreateOpen(true);
          } else if (cardId === 'develop') {
            const card = document.querySelector('[data-tour="intent-develop"]');
            if (card instanceof HTMLElement) {
              card.click();
            }
          } else if (cardId === 'configure') {
            const card = document.querySelector('[data-tour="intent-configure"]');
            if (card instanceof HTMLElement) {
              card.click();
            }
          } else if (cardId === 'configure-single') {
            const card = document.querySelector('[data-tour="intent-configure-single"]');
            if (card instanceof HTMLElement) {
              card.click();
            }
          } else if (cardId === 'configure-multi') {
            const card = document.querySelector('[data-tour="intent-configure-multi"]');
            if (card instanceof HTMLElement) {
              card.click();
            }
          }
        },
        closeWizard: () => {
          setCreateOpen(false);
          setInitialDeployMethod(undefined);
        },
        setWizardStep: (step: number) => {
          wizardStepRef.current?.(step);
        },
        setDeployMethod: (method: string) => {
          deployMethodRef.current?.(method);
        },
      };
    }
    return () => {
      if (tourControlRef) {
        tourControlRef.current = null;
      }
    };
  }, [tourControlRef]);

  useEffect(() => {
    if (initialAgentName && !loading && rows.length > 0) {
      const match = rows.find(r => r.name === initialAgentName && r.kagentiAgent);
      if (match?.kagentiAgent) {
        setSelectedAgent(match.kagentiAgent);
      }
      onFocusConsumed?.();
    }
  }, [initialAgentName, loading, rows, onFocusConsumed]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setError(null);
    try {
      await api.deleteKagentiAgent(deleteTarget.namespace, deleteTarget.name);
      setDeleteTarget(null);
      loadAgents();
    } catch (e) {
      setError(getErrorMessage(e));
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const visibleRows = useMemo(() => {
    let list = rows;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        r =>
          r.name.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q),
      );
    }
    const sorted = [...list].sort((a, b) => compareRows(a, b, sortField));
    return sortDir === 'desc' ? sorted.reverse() : sorted;
  }, [rows, search, sortField, sortDir]);

  const paginatedRows = useMemo(
    () =>
      visibleRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [visibleRows, page, rowsPerPage],
  );

  useEffect(() => {
    setPage(0);
  }, [search]);

  if (selectedAgent) {
    return (
      <KagentiAgentDetailView
        agent={selectedAgent}
        onBack={() => {
          setSelectedAgent(null);
          loadAgents();
        }}
        onChatWithAgent={onChatWithAgent}
      />
    );
  }

  if (selectedOrchAgent) {
    return (
      <OrchAgentDetailView
        agent={selectedOrchAgent}
        onBack={() => {
          setSelectedOrchAgent(null);
          loadAgents();
        }}
        onEditConfig={(agentKey) => {
          setSelectedOrchAgent(null);
          setOrchFocusKey(agentKey);
          setShowOrchestration(true);
        }}
        onChatWithAgent={onChatWithAgent}
      />
    );
  }

  if (showOrchestration) {
    const title = orchFocusKey
      ? 'Edit Agent'
      : createType === 'multi'
        ? 'Create Agent Team'
        : 'Create Agent';
    return (
      <Box sx={{ maxWidth: CONTENT_MAX_WIDTH }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
          <IconButton
            size="small"
            onClick={() => {
              setShowOrchestration(false);
              setOrchFocusKey(undefined);
              setAutoCreateAgent(false);
              setCreateType(null);
              loadAgents();
              onFullScreenChange?.(false);
            }}
            aria-label="Back to agents"
          >
            <ArrowBackIcon fontSize="small" />
          </IconButton>
          <Typography variant="h5" sx={PAGE_TITLE_SX}>
            {title}
          </Typography>
        </Box>
        <AgentsPanel
          focusAgentKey={orchFocusKey}
          autoCreate={autoCreateAgent}
          createType={createType}
          onSaved={() => {
            const savedType = createType;
            setShowOrchestration(false);
            setOrchFocusKey(undefined);
            setAutoCreateAgent(false);
            setCreateType(null);
            loadAgents();
            onFullScreenChange?.(false);
            setSuccessToast(
              savedType
                ? savedType === 'multi'
                  ? 'Agent team created and registered — ready to publish.'
                  : 'Agent created and registered — ready to publish.'
                : 'Agent configuration saved.',
            );
          }}
        />
      </Box>
    );
  }

  const sortableHead = (field: SortField, label: string, align?: 'right') => (
    <TableCell
      align={align}
      sx={TH_STYLE}
      sortDirection={sortField === field ? sortDir : false}
    >
      <TableSortLabel
        active={sortField === field}
        direction={sortField === field ? sortDir : 'asc'}
        onClick={() => handleSort(field)}
      >
        {label}
      </TableSortLabel>
    </TableCell>
  );

  return (
    <Box sx={{ maxWidth: CONTENT_MAX_WIDTH }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          mb: 3,
          flexWrap: 'wrap',
          gap: 1,
        }}
      >
        <Box>
          <Typography variant="h5" sx={PAGE_TITLE_SX}>
            Agents
          </Typography>
          <Typography variant="body2" sx={PAGE_SUBTITLE_SX}>
            Deploy, manage, and monitor your AI agents.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            size="small"
            startIcon={<RefreshIcon />}
            onClick={loadAgents}
            disabled={loading}
            sx={{ textTransform: 'none' }}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            size="small"
            data-tour="new-agent-btn"
            startIcon={<AddIcon />}
            onClick={() => setIntentOpen(true)}
            sx={{ textTransform: 'none' }}
          >
            New Agent
          </Button>
        </Box>
      </Box>

      {!loading && rows.length > 0 && (
        <TextField
          size="small"
          data-tour="agents-search"
          placeholder="Search agents by name or description…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          sx={{ mb: 2, maxWidth: 400 }}
          fullWidth
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon
                  fontSize="small"
                  sx={{ color: theme.palette.text.disabled }}
                />
              </InputAdornment>
            ),
          }}
        />
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress size={32} />
        </Box>
      )}
      {!loading && rows.length === 0 && (
        <Box sx={emptyStateSx(theme)}>
          <HubOutlinedIcon
            sx={{ fontSize: 48, color: theme.palette.text.disabled }}
          />
          <Typography
            variant="body1"
            sx={{ fontWeight: 600, color: theme.palette.text.secondary }}
          >
            No agents found
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: theme.palette.text.disabled,
              textAlign: 'center',
              maxWidth: 400,
            }}
          >
            Create your first agent to get started. Agents can be deployed as
            Kubernetes workloads or configured as multi-agent teams.
          </Typography>
          <Button
            variant="outlined"
            size="small"
            data-tour="new-agent-btn"
            startIcon={<AddIcon />}
            onClick={() => setIntentOpen(true)}
            sx={{ textTransform: 'none', mt: 1 }}
          >
            New Agent
          </Button>
        </Box>
      )}
      {!loading && rows.length > 0 && (
        <>
          <TableContainer data-tour="agents-table" sx={tableContainerSx(theme)}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  {sortableHead('name', 'Name')}
                  <TableCell sx={TH_STYLE}>Description</TableCell>
                  {sortableHead('status', 'Status')}
                  <TableCell sx={TH_STYLE}>Labels</TableCell>
                  <TableCell sx={TH_STYLE}>Source</TableCell>
                  {sortableHead('createdAt', 'Created')}
                  <TableCell sx={TH_STYLE} align="right">
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedRows.map(row => (
                  <TableRow
                    key={row.id}
                    hover
                    sx={{ cursor: 'pointer' }}
                    onClick={() => {
                      if (row.source === 'orchestration') {
                        const orchAgent = rows.find(r => r.id === row.id);
                        if (orchAgent) {
                          const chatAgent: ChatAgent = {
                            id: orchAgent.id,
                            name: orchAgent.name,
                            description: orchAgent.description || undefined,
                            status: orchAgent.status,
                            providerType: 'orchestration',
                            source: 'orchestration',
                            agentRole: orchAgent.agentRole as ChatAgent['agentRole'],
                          };
                          setSelectedOrchAgent(chatAgent);
                        }
                      } else if (row.kagentiAgent) {
                        setSelectedAgent(row.kagentiAgent);
                      }
                    }}
                  >
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          color: theme.palette.text.primary,
                          fontSize: '0.875rem',
                        }}
                      >
                        {row.name}
                      </Typography>
                      {row.namespace && (
                        <Typography variant="caption" color="text.secondary">
                          {row.namespace}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell sx={{ maxWidth: 260 }}>
                      <Typography
                        variant="body2"
                        noWrap
                        sx={{
                          color: theme.palette.text.secondary,
                          fontSize: '0.875rem',
                        }}
                      >
                        {row.description || '—'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={row.status}
                        size="small"
                        color={statusChipColor(row.status)}
                        sx={{ height: 24 }}
                      />
                    </TableCell>
                    <TableCell>
                      <Box
                        sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}
                      >
                        {row.agentRole && (
                          <Chip
                            label={row.agentRole.charAt(0).toUpperCase() + row.agentRole.slice(1)}
                            size="small"
                            color="secondary"
                            variant="filled"
                            sx={{ height: 24, fontSize: '0.75rem' }}
                          />
                        )}
                        {row.labels?.protocol && (
                          <Chip
                            label={[row.labels.protocol]
                              .flat()
                              .join(', ')
                              .toUpperCase()}
                            size="small"
                            color="primary"
                            variant="filled"
                            sx={{ height: 24, fontSize: '0.75rem' }}
                          />
                        )}
                        {row.labels?.framework && (
                          <Chip
                            label={row.labels.framework}
                            size="small"
                            color="info"
                            variant="filled"
                            sx={{ height: 24, fontSize: '0.75rem' }}
                          />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={row.source === 'orchestration' ? 'Responses API' : 'Kagenti'}
                        size="small"
                        variant="outlined"
                        sx={{
                          height: 24,
                          fontSize: '0.75rem',
                          borderColor: row.source === 'orchestration'
                            ? alpha(theme.palette.info.main, 0.5)
                            : undefined,
                          color: row.source === 'orchestration'
                            ? theme.palette.info.main
                            : undefined,
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">
                        {formatDateTime(row.createdAt)}
                      </Typography>
                    </TableCell>
                    <TableCell
                      align="right"
                      onClick={e => e.stopPropagation()}
                    >
                      {onChatWithAgent && (
                        <Tooltip title="Chat with agent">
                          <IconButton
                            size="small"
                            aria-label="Chat with agent"
                            onClick={() => onChatWithAgent(row.id)}
                          >
                            <ChatOutlinedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      {row.source === 'kagenti' && (
                        <Tooltip title="Delete agent">
                          <IconButton
                            size="small"
                            color="error"
                            aria-label="Delete agent"
                            onClick={() => {
                              if (row.kagentiAgent) setDeleteTarget(row.kagentiAgent);
                            }}
                          >
                            <DeleteOutlineIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          {visibleRows.length > rowsPerPage && (
            <TablePagination
              component="div"
              count={visibleRows.length}
              page={page}
              onPageChange={(_e, p) => setPage(p)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={e => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
              rowsPerPageOptions={[5, 10, 25]}
              sx={{ borderTop: 1, borderColor: 'divider' }}
            />
          )}
        </>
      )}

      <AgentCreateIntentDialog
        open={intentOpen}
        onClose={() => setIntentOpen(false)}
        onSelectDeploy={method => {
          setIntentOpen(false);
          setInitialDeployMethod(method);
          setCreateOpen(true);
        }}
        onSelectConfigure={(type) => {
          setIntentOpen(false);
          setOrchFocusKey(undefined);
          setShowOrchestration(true);
          setAutoCreateAgent(true);
          setCreateType(type === 'multi' ? 'multi' : 'single');
          if (type === 'single') onFullScreenChange?.(true);
        }}
      />

      <CreateAgentWizard
        open={createOpen}
        namespace={namespace}
        initialDeploymentMethod={initialDeployMethod}
        onClose={() => {
          setCreateOpen(false);
          setInitialDeployMethod(undefined);
        }}
        onCreated={loadAgents}
        onStepControl={setter => {
          wizardStepRef.current = setter;
        }}
        onDeployMethodControl={setter => {
          deployMethodRef.current = setter;
        }}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete agent"
        message={
          deleteTarget
            ? `Delete agent ${deleteTarget.namespace}/${deleteTarget.name}?`
            : ''
        }
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <Snackbar
        open={!!successToast}
        autoHideDuration={5000}
        onClose={() => setSuccessToast(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        {successToast ? (
          <Alert
            onClose={() => setSuccessToast(null)}
            severity="success"
            variant="filled"
            sx={{ width: '100%' }}
          >
            {successToast}
          </Alert>
        ) : undefined}
      </Snackbar>
    </Box>
  );
}
