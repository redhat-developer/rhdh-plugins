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
import { useCallback, useEffect, useMemo, useState } from 'react';
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
import TableSortLabel from '@mui/material/TableSortLabel';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import SearchIcon from '@mui/icons-material/Search';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import RefreshIcon from '@mui/icons-material/Refresh';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { useTheme, alpha } from '@mui/material/styles';
import type { KagentiAgentSummary } from '@red-hat-developer-hub/backstage-plugin-augment-common';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import AddIcon from '@mui/icons-material/Add';
import { augmentApiRef } from '../../../api';
import { getErrorMessage } from '../../../utils';
import { ConfirmDialog } from '../shared/ConfirmDialog';
import { CreateAgentWizard } from './CreateAgentWizard';
import { KagentiAgentDetailView } from './KagentiAgentDetailView';

function agentStatusColor(
  status: string | undefined,
): 'success' | 'error' | 'warning' | 'info' | 'default' {
  if (!status) return 'default';
  const s = status.toLowerCase();
  if (s === 'ready' || s === 'running' || s === 'active') return 'success';
  if (s === 'error' || s === 'failed') return 'error';
  if (s === 'building' || s === 'pending') return 'info';
  if (s === 'warning' || s === 'degraded') return 'warning';
  return 'default';
}

type SortField = 'name' | 'status' | 'workloadType';
type SortDir = 'asc' | 'desc';

function compareAgents(
  a: KagentiAgentSummary,
  b: KagentiAgentSummary,
  field: SortField,
): number {
  const valA = a[field] ?? '';
  const valB = b[field] ?? '';
  return String(valA).localeCompare(String(valB));
}

export interface KagentiAgentsPanelProps {
  namespace?: string;
  onChatWithAgent?: (agentId: string) => void;
}

export function KagentiAgentsPanel({
  namespace,
  onChatWithAgent,
}: KagentiAgentsPanelProps) {
  const theme = useTheme();
  const api = useApi(augmentApiRef);
  const [agents, setAgents] = useState<KagentiAgentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<KagentiAgentSummary | null>(
    null,
  );

  const [selectedAgent, setSelectedAgent] =
    useState<KagentiAgentSummary | null>(null);
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const loadAgents = useCallback(() => {
    setLoading(true);
    setError(null);
    api
      .listKagentiAgents(namespace || undefined)
      .then(res => setAgents(res.agents ?? []))
      .catch(e => setError(getErrorMessage(e)))
      .finally(() => setLoading(false));
  }, [api, namespace]);

  useEffect(() => {
    loadAgents();
  }, [loadAgents]);

  const agentKey = (a: KagentiAgentSummary) => `${a.namespace}/${a.name}`;

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

  const visibleAgents = useMemo(() => {
    let list = agents;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        a =>
          a.name.toLowerCase().includes(q) ||
          (a.description ?? '').toLowerCase().includes(q),
      );
    }
    const sorted = [...list].sort((a, b) => compareAgents(a, b, sortField));
    return sortDir === 'desc' ? sorted.reverse() : sorted;
  }, [agents, search, sortField, sortDir]);

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

  return (
    <Box sx={{ maxWidth: 1200 }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 2,
          flexWrap: 'wrap',
          gap: 1,
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Agents
        </Typography>
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
            startIcon={<AddIcon />}
            onClick={() => setCreateOpen(true)}
            sx={{ textTransform: 'none' }}
          >
            Create Agent
          </Button>
        </Box>
      </Box>

      {!loading && agents.length > 0 && (
        <TextField
          size="small"
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
      {!loading && agents.length === 0 && (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            py: 8,
            border: `1px dashed ${alpha(theme.palette.divider, 0.4)}`,
            borderRadius: 2,
            bgcolor: alpha(theme.palette.background.paper, 0.5),
            gap: 2,
          }}
        >
          <SmartToyIcon
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
            Create your first agent to get started. Agents are Kubernetes-native
            AI workloads that you can chat with.
          </Typography>
          <Button
            variant="outlined"
            size="small"
            startIcon={<AddIcon />}
            onClick={() => setCreateOpen(true)}
            sx={{ textTransform: 'none', mt: 1 }}
          >
            Create Agent
          </Button>
        </Box>
      )}
      {!loading && agents.length > 0 && (
        <TableContainer
          sx={{
            border: 1,
            borderColor: 'divider',
            borderRadius: 1,
            bgcolor: alpha(theme.palette.background.paper, 0.5),
          }}
        >
          <Table>
            <TableHead>
              <TableRow>
                <TableCell
                  sortDirection={sortField === 'name' ? sortDir : false}
                >
                  <TableSortLabel
                    active={sortField === 'name'}
                    direction={sortField === 'name' ? sortDir : 'asc'}
                    onClick={() => handleSort('name')}
                  >
                    Name
                  </TableSortLabel>
                </TableCell>
                <TableCell>Description</TableCell>
                <TableCell
                  sortDirection={sortField === 'status' ? sortDir : false}
                >
                  <TableSortLabel
                    active={sortField === 'status'}
                    direction={sortField === 'status' ? sortDir : 'asc'}
                    onClick={() => handleSort('status')}
                  >
                    Status
                  </TableSortLabel>
                </TableCell>
                <TableCell>Labels</TableCell>
                <TableCell
                  sortDirection={sortField === 'workloadType' ? sortDir : false}
                >
                  <TableSortLabel
                    active={sortField === 'workloadType'}
                    direction={sortField === 'workloadType' ? sortDir : 'asc'}
                    onClick={() => handleSort('workloadType')}
                  >
                    Workload
                  </TableSortLabel>
                </TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {visibleAgents.map(a => {
                const key = agentKey(a);
                return (
                  <TableRow
                    key={key}
                    hover
                    sx={{ cursor: 'pointer' }}
                    onClick={() => setSelectedAgent(a)}
                  >
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          color: theme.palette.primary.main,
                        }}
                      >
                        {a.name}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ maxWidth: 300 }}>
                      <Typography
                        variant="body2"
                        sx={{ color: theme.palette.text.secondary }}
                      >
                        {a.description || '—'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={a.status}
                        size="small"
                        color={agentStatusColor(a.status)}
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        {a.labels?.protocol && (
                          <Chip
                            label={[a.labels.protocol]
                              .flat()
                              .join(', ')
                              .toUpperCase()}
                            size="small"
                            color="primary"
                            variant="filled"
                            sx={{ height: 24 }}
                          />
                        )}
                        {a.labels?.framework && (
                          <Chip
                            label={a.labels.framework}
                            size="small"
                            color="info"
                            variant="filled"
                            sx={{ height: 24 }}
                          />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={a.workloadType ?? 'Deployment'}
                        size="small"
                        variant="outlined"
                        sx={{ height: 24 }}
                      />
                    </TableCell>
                    <TableCell align="right" onClick={e => e.stopPropagation()}>
                      <Tooltip title="Delete agent">
                        <IconButton
                          size="small"
                          color="error"
                          aria-label="Delete agent"
                          onClick={() => setDeleteTarget(a)}
                        >
                          <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <CreateAgentWizard
        open={createOpen}
        namespace={namespace}
        onClose={() => setCreateOpen(false)}
        onCreated={loadAgents}
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
    </Box>
  );
}
