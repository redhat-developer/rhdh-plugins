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
import { useEffect, useMemo, useRef, useState } from 'react';
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
import { ToolCreateIntentDialog } from './ToolCreateIntentDialog';
import {
  statusChipColor as toolStatusColor,
  formatDateTime,
} from './kagentiDisplayUtils';
import { ToolConnectDialog } from './ToolConnectDialog';
import { ToolInvokeDialog } from './ToolInvokeDialog';
import { useKagentiToolsList, type SortField } from './useKagentiToolsList';
import { useToolInvoke } from './useToolInvoke';
import {
  CONTENT_MAX_WIDTH,
  PAGE_TITLE_SX,
  PAGE_SUBTITLE_SX,
  TABLE_HEADER_CELL_SX,
  tableContainerSx,
  emptyStateSx,
} from '../shared/commandCenterStyles';

export interface ToolPanelTourControl {
  openIntent: () => void;
  closeIntent: () => void;
  selectDeploy: () => void;
  closeWizard: () => void;
  setWizardStep: (step: number) => void;
}

export interface KagentiToolsPanelProps {
  namespace?: string;
  initialToolName?: string;
  onFocusConsumed?: () => void;
  tourControlRef?: React.MutableRefObject<ToolPanelTourControl | null>;
}

export function KagentiToolsPanel({
  namespace,
  initialToolName,
  onFocusConsumed,
  tourControlRef,
}: KagentiToolsPanelProps) {
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

  const [intentOpen, setIntentOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const wizardStepRef = useRef<((step: number) => void) | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<KagentiToolSummary | null>(
    null,
  );
  const [actionError, setActionError] = useState<string | null>(null);

  const [connectOpen, setConnectOpen] = useState(false);
  const [connectTool, setConnectTool] = useState<KagentiToolSummary | null>(
    null,
  );

  const [detailTool, setDetailTool] = useState<KagentiToolSummary | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const paginatedTools = useMemo(
    () =>
      sortedTools.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [sortedTools, page, rowsPerPage],
  );

  useEffect(() => {
    setPage(0);
  }, [search]);

  useEffect(() => {
    if (initialToolName && !loading && tools.length > 0) {
      const match = tools.find(t => t.name === initialToolName);
      if (match) {
        setDetailTool(match);
      }
      onFocusConsumed?.();
    }
  }, [initialToolName, loading, tools, onFocusConsumed]);

  useEffect(() => {
    if (tourControlRef) {
      tourControlRef.current = {
        openIntent: () => setIntentOpen(true),
        closeIntent: () => setIntentOpen(false),
        selectDeploy: () => {
          setIntentOpen(false);
          setCreateOpen(true);
        },
        closeWizard: () => setCreateOpen(false),
        setWizardStep: (step: number) => {
          wizardStepRef.current?.(step);
        },
      };
    }
    return () => {
      if (tourControlRef) {
        tourControlRef.current = null;
      }
    };
  }, [tourControlRef]);

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

  const thStyle = TABLE_HEADER_CELL_SX;

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
    <Box sx={{ maxWidth: CONTENT_MAX_WIDTH, width: '100%', minWidth: 0 }}>
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
            Tools
          </Typography>
          <Typography variant="body2" sx={PAGE_SUBTITLE_SX}>
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
            data-tour="new-tool-btn"
            startIcon={<AddIcon />}
            onClick={() => setIntentOpen(true)}
            sx={{ textTransform: 'none' }}
          >
            New Tool
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
        <Box sx={emptyStateSx(theme)}>
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
            data-tour="new-tool-btn"
            startIcon={<AddIcon />}
            onClick={() => setIntentOpen(true)}
            sx={{ textTransform: 'none', mt: 1 }}
          >
            New Tool
          </Button>
        </Box>
      )}
      {!loading && tools.length > 0 && (
        <>
          <TableContainer
            data-tour="tools-table"
            sx={{ ...tableContainerSx(theme), overflowX: 'auto' }}
          >
            <Table size="small">
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
                {paginatedTools.map(t => (
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
          {sortedTools.length > rowsPerPage && (
            <TablePagination
              component="div"
              count={sortedTools.length}
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

      <ToolCreateIntentDialog
        open={intentOpen}
        onClose={() => setIntentOpen(false)}
        onSelectDeploy={() => {
          setIntentOpen(false);
          setCreateOpen(true);
        }}
      />

      <CreateToolWizard
        open={createOpen}
        namespace={namespace}
        onClose={() => setCreateOpen(false)}
        onCreated={loadTools}
        onStepControl={setter => {
          wizardStepRef.current = setter;
        }}
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
