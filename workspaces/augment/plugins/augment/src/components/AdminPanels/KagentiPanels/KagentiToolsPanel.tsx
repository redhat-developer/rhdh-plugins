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
import { useState } from 'react';
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
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import LinkIcon from '@mui/icons-material/Link';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchIcon from '@mui/icons-material/Search';
import BuildIcon from '@mui/icons-material/Build';
import AddIcon from '@mui/icons-material/Add';
import InputAdornment from '@mui/material/InputAdornment';
import { useTheme, alpha } from '@mui/material/styles';
import type { KagentiToolSummary } from '@red-hat-developer-hub/backstage-plugin-augment-common';
import { augmentApiRef } from '../../../api';
import { getErrorMessage } from '../../../utils';
import { ConfirmDialog } from '../shared/ConfirmDialog';
import { KagentiToolDetailDrawer } from './KagentiToolDetailDrawer';
import { CreateToolWizard } from './CreateToolWizard';
import {
  statusChipColor as toolStatusColor,
  formatDateTime,
} from './kagentiDisplayUtils';
import { ToolConnectDialog } from './ToolConnectDialog';
import { ToolInvokeDialog } from './ToolInvokeDialog';
import { useKagentiToolsList, type SortField } from './useKagentiToolsList';
import { useToolInvoke } from './useToolInvoke';

export interface KagentiToolsPanelProps {
  namespace?: string;
}

export function KagentiToolsPanel({ namespace }: KagentiToolsPanelProps) {
  const theme = useTheme();
  const api = useApi(augmentApiRef);
  const {
    tools,
    loading,
    error: listError,
    setError: setListError,
    loadTools,
    search,
    setSearch,
    sortField,
    sortDir,
    handleSort,
    sortedTools,
  } = useKagentiToolsList(api, namespace);

  const toolInvoke = useToolInvoke(api);

  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<KagentiToolSummary | null>(
    null,
  );
  const [actionError, setActionError] = useState<string | null>(null);

  const [connectOpen, setConnectOpen] = useState(false);
  const [connectTool, setConnectTool] = useState<KagentiToolSummary | null>(
    null,
  );

  const [detailTool, setDetailTool] = useState<KagentiToolSummary | null>(null);

  const displayError = listError || actionError;

  const toolKey = (t: KagentiToolSummary) => `${t.namespace}/${t.name}`;

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.deleteKagentiTool(deleteTarget.namespace, deleteTarget.name);
      setDeleteTarget(null);
      setActionError(null);
      loadTools();
    } catch (e) {
      setActionError(getErrorMessage(e));
    }
  };

  const openConnect = (t: KagentiToolSummary) => {
    setConnectTool(t);
    setConnectOpen(true);
  };

  const thStyle = {
    fontWeight: 600,
    fontSize: '0.75rem',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  } as const;

  const sortableHead = (field: SortField, label: string, align?: 'right') => (
    <TableCell align={align} sx={thStyle}>
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
    <Box sx={{ maxWidth: 1200 }}>
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
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Tools
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: theme.palette.text.secondary, mt: 0.25 }}
          >
            Register and manage MCP tool servers for your agents.
          </Typography>
        </Box>
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
            startIcon={<AddIcon />}
            onClick={() => setCreateOpen(true)}
            sx={{ textTransform: 'none' }}
          >
            Create Tool
          </Button>
        </Box>
      </Box>

      {!loading && tools.length > 0 && (
        <TextField
          size="small"
          placeholder="Search tools by name or description…"
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

      {displayError && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          onClose={() => {
            setListError(null);
            setActionError(null);
          }}
        >
          {displayError}
        </Alert>
      )}

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress size={32} />
        </Box>
      )}
      {!loading && tools.length === 0 && (
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
          <BuildIcon
            sx={{ fontSize: 48, color: theme.palette.text.disabled }}
          />
          <Typography
            variant="body1"
            sx={{ fontWeight: 600, color: theme.palette.text.secondary }}
          >
            No tools found
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: theme.palette.text.disabled,
              textAlign: 'center',
              maxWidth: 400,
            }}
          >
            Create your first MCP tool to give your agents additional
            capabilities.
          </Typography>
          <Button
            variant="outlined"
            size="small"
            startIcon={<AddIcon />}
            onClick={() => setCreateOpen(true)}
            sx={{ textTransform: 'none', mt: 1 }}
          >
            Create Tool
          </Button>
        </Box>
      )}
      {!loading && tools.length > 0 && (
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
                {sortableHead('name', 'Name')}
                <TableCell sx={thStyle}>Description</TableCell>
                {sortableHead('status', 'Status')}
                <TableCell sx={thStyle}>Labels</TableCell>
                {sortableHead('workloadType', 'Workload')}
                {sortableHead('createdAt', 'Created')}
                <TableCell sx={thStyle} align="right">
                  Actions
                </TableCell>
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
                    <Typography variant="caption" color="text.secondary">
                      {t.namespace}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        maxWidth: 220,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {t.description || '—'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={t.status}
                      size="small"
                      color={toolStatusColor(t.status)}
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {t.labels?.protocol && (
                        <Chip
                          label={[t.labels.protocol]
                            .flat()
                            .join(', ')
                            .toUpperCase()}
                          size="small"
                          variant="outlined"
                        />
                      )}
                      {t.labels?.framework && (
                        <Chip
                          label={t.labels.framework}
                          size="small"
                          variant="outlined"
                        />
                      )}
                    </Box>
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
                          toolInvoke.openInvoke(t);
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

      <ToolConnectDialog
        open={connectOpen}
        tool={connectTool}
        onClose={() => setConnectOpen(false)}
        onInvoke={(toolName, inputSchema) => {
          if (connectTool) {
            toolInvoke.openInvokePrefilled(connectTool, toolName, inputSchema);
          }
          setConnectOpen(false);
        }}
        api={api}
      />

      <ToolInvokeDialog invoke={toolInvoke} />

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
    </Box>
  );
}
