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
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Chip from '@mui/material/Chip';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import LinkIcon from '@mui/icons-material/Link';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useTheme, alpha } from '@mui/material/styles';
import type {
  KagentiMcpToolSchema,
  KagentiToolSummary,
} from '@red-hat-developer-hub/backstage-plugin-augment-common';
import { augmentApiRef } from '../../../api';
import { getErrorMessage } from '../../../utils';
import { ConfirmDialog } from '../shared/ConfirmDialog';
import { McpToolCatalog } from './McpToolCatalog';
import { KagentiToolDetailDrawer } from './KagentiToolDetailDrawer';
import { CreateToolWizard } from './CreateToolWizard';

type SortField = 'name' | 'namespace' | 'status' | 'workloadType' | 'createdAt';
type SortDir = 'asc' | 'desc';

function statusChipColor(
  status: string | undefined,
): 'success' | 'info' | 'error' | 'warning' | 'default' {
  if (!status) return 'default';
  const s = status.toLowerCase();
  if (s === 'ready' || s === 'running' || s === 'active') return 'success';
  if (s === 'building' || s === 'pending') return 'info';
  if (s === 'error' || s === 'failed') return 'error';
  if (s === 'warning' || s === 'degraded') return 'warning';
  return 'default';
}

function formatDateTime(iso?: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString();
}

function compareTools(a: KagentiToolSummary, b: KagentiToolSummary, field: SortField): number {
  const valA = a[field] ?? '';
  const valB = b[field] ?? '';
  if (field === 'createdAt') {
    return new Date(valA || 0).getTime() - new Date(valB || 0).getTime();
  }
  return String(valA).localeCompare(String(valB));
}

export interface KagentiToolsPanelProps {
  namespace?: string;
}

export function KagentiToolsPanel({ namespace }: KagentiToolsPanelProps) {
  const theme = useTheme();
  const api = useApi(augmentApiRef);
  const [tools, setTools] = useState<KagentiToolSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<KagentiToolSummary | null>(null);

  const [connectOpen, setConnectOpen] = useState(false);
  const [connectTool, setConnectTool] = useState<KagentiToolSummary | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [connectedSchemas, setConnectedSchemas] = useState<KagentiMcpToolSchema[] | null>(null);

  const [invokeOpen, setInvokeOpen] = useState(false);
  const [invokeTarget, setInvokeTarget] = useState<KagentiToolSummary | null>(null);
  const [invokeName, setInvokeName] = useState('');
  const [invokeArgsJson, setInvokeArgsJson] = useState('{}');
  const [invoking, setInvoking] = useState(false);
  const [invokeResult, setInvokeResult] = useState<string | null>(null);

  const [detailTool, setDetailTool] = useState<KagentiToolSummary | null>(null);

  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const loadTools = useCallback(() => {
    setLoading(true);
    setError(null);
    api
      .listKagentiTools(namespace || undefined)
      .then(res => setTools(res.tools ?? []))
      .catch(e => setError(getErrorMessage(e)))
      .finally(() => setLoading(false));
  }, [api, namespace]);

  useEffect(() => {
    loadTools();
  }, [loadTools]);

  const sortedTools = useMemo(() => {
    const sorted = [...tools].sort((a, b) => compareTools(a, b, sortField));
    return sortDir === 'desc' ? sorted.reverse() : sorted;
  }, [tools, sortField, sortDir]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const toolKey = (t: KagentiToolSummary) => `${t.namespace}/${t.name}`;

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.deleteKagentiTool(deleteTarget.namespace, deleteTarget.name);
      setDeleteTarget(null);
      loadTools();
    } catch (e) {
      setError(getErrorMessage(e));
    }
  };

  const openConnect = (t: KagentiToolSummary) => {
    setConnectTool(t);
    setConnectedSchemas(null);
    setConnectOpen(true);
  };

  const runConnect = async () => {
    if (!connectTool) return;
    setConnecting(true);
    setError(null);
    try {
      const res = await api.connectKagentiTool(connectTool.namespace, connectTool.name);
      setConnectedSchemas(res.tools ?? []);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setConnecting(false);
    }
  };

  const openInvokeFromConnect = (toolName: string) => {
    if (!connectTool) return;
    setInvokeTarget(connectTool);
    setInvokeName(toolName);
    setInvokeArgsJson('{}');
    setInvokeResult(null);
    setConnectOpen(false);
    setInvokeOpen(true);
  };

  const openInvoke = (t: KagentiToolSummary) => {
    setInvokeTarget(t);
    setInvokeName('');
    setInvokeArgsJson('{}');
    setInvokeResult(null);
    setInvokeOpen(true);
  };

  const runInvoke = async () => {
    if (!invokeTarget || !invokeName.trim()) return;
    let args: Record<string, unknown> = {};
    try {
      args = JSON.parse(invokeArgsJson || '{}') as Record<string, unknown>;
    } catch {
      setError('Arguments must be valid JSON');
      return;
    }
    setInvoking(true);
    setError(null);
    try {
      const res = await api.invokeKagentiTool(
        invokeTarget.namespace,
        invokeTarget.name,
        invokeName.trim(),
        args,
      );
      setInvokeResult(JSON.stringify(res, null, 2));
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setInvoking(false);
    }
  };

  const sortableHead = (field: SortField, label: string, align?: 'right') => (
    <TableCell align={align}>
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
            Kagenti tools
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              size="small"
              startIcon={<RefreshIcon />}
              onClick={loadTools}
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
              Create tool
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
        ) : tools.length === 0 ? (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              py: 6,
              px: 2,
              border: 1,
              borderColor: 'divider',
              borderRadius: 1,
              bgcolor: alpha(theme.palette.background.paper, 0.5),
            }}
          >
            <Typography variant="body2" color="textSecondary" textAlign="center">
              No tools found. Create a tool to get started.
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
                  {sortableHead('name', 'Name')}
                  {sortableHead('namespace', 'Namespace')}
                  {sortableHead('status', 'Status')}
                  {sortableHead('workloadType', 'Workload')}
                  {sortableHead('createdAt', 'Created')}
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedTools.map(t => (
                  <TableRow
                    key={toolKey(t)}
                    hover
                    sx={{ cursor: 'pointer' }}
                    onClick={() => setDetailTool(t)}
                  >
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {t.name}
                      </Typography>
                    </TableCell>
                    <TableCell>{t.namespace}</TableCell>
                    <TableCell>
                      <Chip
                        label={t.status}
                        size="small"
                        color={statusChipColor(t.status)}
                      />
                    </TableCell>
                    <TableCell>{t.workloadType ?? '—'}</TableCell>
                    <TableCell>{formatDateTime(t.createdAt)}</TableCell>
                    <TableCell align="right">
                      <Tooltip title="Discover MCP tools">
                        <IconButton
                          size="small"
                          aria-label="Connect tool"
                          onClick={e => {
                            e.stopPropagation();
                            openConnect(t);
                          }}
                        >
                          <LinkIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Invoke tool">
                        <IconButton
                          size="small"
                          aria-label="Invoke tool"
                          onClick={e => {
                            e.stopPropagation();
                            openInvoke(t);
                          }}
                        >
                          <PlayCircleOutlineIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete tool">
                        <IconButton
                          size="small"
                          color="error"
                          aria-label="Delete tool"
                          onClick={e => {
                            e.stopPropagation();
                            setDeleteTarget(t);
                          }}
                        >
                          <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        <CreateToolWizard
          open={createOpen}
          namespace={namespace}
          onClose={() => setCreateOpen(false)}
          onCreated={loadTools}
        />

        <Dialog
          open={connectOpen}
          onClose={() => !connecting && setConnectOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            Discover MCP tools — {connectTool ? `${connectTool.namespace}/${connectTool.name}` : ''}
          </DialogTitle>
          <DialogContent>
            <Button
              variant="outlined"
              size="small"
              onClick={runConnect}
              disabled={connecting}
              sx={{ textTransform: 'none', mb: 2 }}
            >
              {connecting ? <CircularProgress size={20} /> : 'Discover MCP tools'}
            </Button>
            {connectedSchemas !== null && (
              <McpToolCatalog
                tools={connectedSchemas}
                onInvoke={openInvokeFromConnect}
              />
            )}
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => setConnectOpen(false)}
              sx={{ textTransform: 'none' }}
            >
              Close
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog
          open={invokeOpen}
          onClose={() => !invoking && setInvokeOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            Invoke {invokeTarget ? `${invokeTarget.namespace}/${invokeTarget.name}` : ''}
          </DialogTitle>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Tool name"
              size="small"
              value={invokeName}
              onChange={e => setInvokeName(e.target.value)}
              fullWidth
              required
            />
            <TextField
              label="Arguments (JSON)"
              size="small"
              value={invokeArgsJson}
              onChange={e => setInvokeArgsJson(e.target.value)}
              fullWidth
              multiline
              minRows={4}
            />
            {invokeResult && (
              <TextField
                label="Result"
                size="small"
                value={invokeResult}
                fullWidth
                multiline
                minRows={6}
                InputProps={{ readOnly: true }}
              />
            )}
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => setInvokeOpen(false)}
              disabled={invoking}
              sx={{ textTransform: 'none' }}
            >
              Close
            </Button>
            <Button
              variant="contained"
              onClick={runInvoke}
              disabled={invoking || !invokeName.trim()}
              sx={{ textTransform: 'none' }}
            >
              {invoking ? <CircularProgress size={20} /> : 'Invoke'}
            </Button>
          </DialogActions>
        </Dialog>

        <ConfirmDialog
          open={!!deleteTarget}
          title="Delete tool"
          message={
            deleteTarget
              ? `Delete tool ${deleteTarget.namespace}/${deleteTarget.name}?`
              : ''
          }
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />

        <KagentiToolDetailDrawer
          open={!!detailTool}
          tool={detailTool}
          onClose={() => setDetailTool(null)}
        />
      </CardContent>
    </Card>
  );
}
