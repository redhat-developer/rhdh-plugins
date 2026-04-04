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
import { useCallback, useEffect, useState } from 'react';
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
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Chip from '@mui/material/Chip';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useTheme, alpha } from '@mui/material/styles';
import type {
  KagentiAgentSummary,
  KagentiBuildInfo,
  KagentiCreateAgentRequest,
} from '@red-hat-developer-hub/backstage-plugin-augment-common';
import { augmentApiRef } from '../../../api';
import { getErrorMessage } from '../../../utils';
import { ConfirmDialog } from '../shared/ConfirmDialog';
import { SELECT_MENU_PROPS } from '../shared/selectMenuProps';

export interface KagentiAgentsPanelProps {
  namespace?: string;
}

export function KagentiAgentsPanel({ namespace }: KagentiAgentsPanelProps) {
  const theme = useTheme();
  const api = useApi(augmentApiRef);
  const [agents, setAgents] = useState<KagentiAgentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<KagentiAgentSummary | null>(
    null,
  );
  const [buildInfo, setBuildInfo] = useState<Record<string, KagentiBuildInfo>>(
    {},
  );
  const [buildLoading, setBuildLoading] = useState<string | null>(null);
  const [triggerLoading, setTriggerLoading] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '',
    ns: namespace ?? '',
    protocol: '',
    framework: '',
    workloadType: '' as KagentiCreateAgentRequest['workloadType'] | '',
    gitUrl: '',
  });

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

  useEffect(() => {
    setForm(f => ({ ...f, ns: namespace ?? f.ns }));
  }, [namespace]);

  const agentKey = (a: KagentiAgentSummary) => `${a.namespace}/${a.name}`;

  const fetchBuildInfo = async (a: KagentiAgentSummary) => {
    const key = agentKey(a);
    setBuildLoading(key);
    try {
      const info = await api.getKagentiBuildInfo(a.namespace, a.name);
      setBuildInfo(prev => ({ ...prev, [key]: info }));
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setBuildLoading(null);
    }
  };

  const handleTriggerBuild = async (a: KagentiAgentSummary) => {
    const key = agentKey(a);
    setTriggerLoading(key);
    try {
      await api.triggerKagentiBuild(a.namespace, a.name);
      await fetchBuildInfo(a);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setTriggerLoading(null);
    }
  };

  const handleCreate = async () => {
    if (!form.name.trim() || !form.ns.trim()) return;
    const body: KagentiCreateAgentRequest = {
      name: form.name.trim(),
      namespace: form.ns.trim(),
      protocol: form.protocol || undefined,
      framework: form.framework || undefined,
      workloadType: form.workloadType || undefined,
      gitUrl: form.gitUrl || undefined,
      deploymentMethod: form.gitUrl ? 'source' : undefined,
    };
    setCreating(true);
    setError(null);
    try {
      await api.createKagentiAgent(body);
      setCreateOpen(false);
      setForm({
        name: '',
        ns: namespace ?? '',
        protocol: '',
        framework: '',
        workloadType: '',
        gitUrl: '',
      });
      loadAgents();
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setCreating(false);
    }
  };

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

  return (
    <Card variant="outlined">
      <CardContent>
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
          <Typography variant="h6" sx={{ fontSize: '1rem' }}>
            Kagenti agents
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
              onClick={() => setCreateOpen(true)}
              sx={{ textTransform: 'none' }}
            >
              Create agent
            </Button>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={32} />
          </Box>
        ) : agents.length === 0 ? (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              py: 6,
              border: 1,
              borderColor: 'divider',
              borderRadius: 1,
              bgcolor: alpha(theme.palette.background.paper, 0.5),
            }}
          >
            <Typography variant="body2" color="textSecondary">
              No agents found in this namespace.
            </Typography>
          </Box>
        ) : (
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
                  <TableCell>Name</TableCell>
                  <TableCell>Namespace</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Protocol</TableCell>
                  <TableCell>Framework</TableCell>
                  <TableCell>Workload</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell>Build</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {agents.map(a => {
                  const key = agentKey(a);
                  const info = buildInfo[key];
                  return (
                    <TableRow key={key}>
                      <TableCell>{a.name}</TableCell>
                      <TableCell>{a.namespace}</TableCell>
                      <TableCell>
                        <Chip label={a.status} size="small" />
                      </TableCell>
                      <TableCell>{a.labels?.protocol ?? '—'}</TableCell>
                      <TableCell>{a.labels?.framework ?? '—'}</TableCell>
                      <TableCell>{a.workloadType ?? '—'}</TableCell>
                      <TableCell>
                        {a.createdAt
                          ? new Date(a.createdAt).toLocaleString()
                          : '—'}
                      </TableCell>
                      <TableCell>
                        <Box
                          sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 0.5,
                            maxWidth: 220,
                          }}
                        >
                          {info ? (
                            <Typography variant="caption" color="textSecondary">
                              {info.buildRunPhase ?? info.buildMessage ?? '—'}
                            </Typography>
                          ) : (
                            <Typography variant="caption" color="textSecondary">
                              —
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Load build info">
                          <span>
                            <IconButton
                              size="small"
                              aria-label="Load build info"
                              onClick={() => fetchBuildInfo(a)}
                              disabled={buildLoading === key}
                            >
                              {buildLoading === key ? (
                                <CircularProgress size={18} />
                              ) : (
                                <RefreshIcon fontSize="small" />
                              )}
                            </IconButton>
                          </span>
                        </Tooltip>
                        <Tooltip title="Trigger build">
                          <span>
                            <IconButton
                              size="small"
                              aria-label="Trigger build"
                              onClick={() => handleTriggerBuild(a)}
                              disabled={triggerLoading === key}
                            >
                              {triggerLoading === key ? (
                                <CircularProgress size={18} />
                              ) : (
                                <PlayArrowIcon fontSize="small" />
                              )}
                            </IconButton>
                          </span>
                        </Tooltip>
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

        <Dialog
          open={createOpen}
          onClose={() => !creating && setCreateOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Create agent</DialogTitle>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Name"
              size="small"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              fullWidth
              required
            />
            <TextField
              label="Namespace"
              size="small"
              value={form.ns}
              onChange={e => setForm(f => ({ ...f, ns: e.target.value }))}
              fullWidth
              required
            />
            <TextField
              label="Protocol"
              size="small"
              value={form.protocol}
              onChange={e => setForm(f => ({ ...f, protocol: e.target.value }))}
              fullWidth
            />
            <TextField
              label="Framework"
              size="small"
              value={form.framework}
              onChange={e => setForm(f => ({ ...f, framework: e.target.value }))}
              fullWidth
            />
            <FormControl size="small" fullWidth>
              <InputLabel>Workload type</InputLabel>
              <Select
                label="Workload type"
                value={form.workloadType}
                onChange={e =>
                  setForm(f => ({
                    ...f,
                    workloadType: e.target.value as typeof f.workloadType,
                  }))
                }
                MenuProps={SELECT_MENU_PROPS}
              >
                <MenuItem value="">
                  <em>Default</em>
                </MenuItem>
                <MenuItem value="deployment">deployment</MenuItem>
                <MenuItem value="statefulset">statefulset</MenuItem>
                <MenuItem value="job">job</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Git URL (optional)"
              size="small"
              value={form.gitUrl}
              onChange={e => setForm(f => ({ ...f, gitUrl: e.target.value }))}
              fullWidth
            />
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => setCreateOpen(false)}
              disabled={creating}
              sx={{ textTransform: 'none' }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleCreate}
              disabled={creating || !form.name.trim() || !form.ns.trim()}
              sx={{ textTransform: 'none' }}
            >
              {creating ? <CircularProgress size={20} /> : 'Create'}
            </Button>
          </DialogActions>
        </Dialog>

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
      </CardContent>
    </Card>
  );
}
