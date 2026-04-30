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
import { useState, useCallback } from 'react';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';
import TextField from '@mui/material/TextField';
import LinearProgress from '@mui/material/LinearProgress';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import StorageIcon from '@mui/icons-material/Storage';
import type { ActiveVectorStore } from '../../hooks';

function formatBytes(bytes: number | undefined): string {
  if (bytes === undefined || bytes === 0) return '-';
  const units = ['B', 'KB', 'MB', 'GB'];
  let unitIndex = 0;
  let value = bytes;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }
  return `${value.toFixed(unitIndex > 0 ? 1 : 0)} ${units[unitIndex]}`;
}

function formatRelativeTime(epochSeconds: number | undefined): string {
  if (!epochSeconds) return '-';
  const diff = Date.now() - epochSeconds * 1000;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(epochSeconds * 1000).toLocaleDateString();
}

const STATUS_CONFIG: Record<
  string,
  {
    color: 'success' | 'warning' | 'error' | 'default';
    icon: React.ReactNode;
    label: string;
  }
> = {
  completed: { color: 'success', icon: <CheckCircleIcon />, label: 'Ready' },
  in_progress: {
    color: 'warning',
    icon: <HourglassEmptyIcon />,
    label: 'Processing',
  },
  failed: { color: 'error', icon: <ErrorOutlineIcon />, label: 'Failed' },
  unknown: { color: 'default', icon: <HelpOutlineIcon />, label: 'Unknown' },
};

function FileCountBar({
  fileCounts,
}: {
  fileCounts?: ActiveVectorStore['fileCounts'];
}) {
  if (!fileCounts || fileCounts.total === 0) return null;
  const completedPct = (fileCounts.completed / fileCounts.total) * 100;
  const inProgressPct = (fileCounts.inProgress / fileCounts.total) * 100;

  if (fileCounts.total === fileCounts.completed) return null;

  return (
    <Tooltip
      title={`${fileCounts.completed} ready, ${fileCounts.inProgress} processing, ${fileCounts.failed} failed`}
    >
      <Box
        sx={{
          width: 80,
          display: 'inline-flex',
          alignItems: 'center',
          ml: 0.5,
        }}
      >
        <LinearProgress
          variant="buffer"
          value={completedPct}
          valueBuffer={completedPct + inProgressPct}
          color={fileCounts.failed > 0 ? 'error' : 'primary'}
          sx={{ width: '100%', height: 4, borderRadius: 2 }}
        />
      </Box>
    </Tooltip>
  );
}

export interface StoresTableProps {
  stores: ActiveVectorStore[];
  selectedStoreId: string | null;
  onSelectStore: (id: string) => void;
  onDeleteStore: (store: ActiveVectorStore) => void;
  onRenameStore?: (storeId: string, newName: string) => Promise<void>;
  deleteInProgress: string | null;
  loading?: boolean;
}

export const StoresTable = ({
  stores,
  selectedStoreId,
  onSelectStore,
  onDeleteStore,
  onRenameStore,
  deleteInProgress,
  loading = false,
}: StoresTableProps) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [renaming, setRenaming] = useState(false);
  const [renameError, setRenameError] = useState<string | null>(null);

  const startRename = useCallback(
    (store: ActiveVectorStore, e: React.MouseEvent) => {
      e.stopPropagation();
      setEditingId(store.id);
      setEditName(store.name !== store.id ? store.name : '');
    },
    [],
  );

  const cancelRename = useCallback(() => {
    setEditingId(null);
    setEditName('');
  }, []);

  const confirmRename = useCallback(
    async (storeId: string) => {
      const trimmed = editName.trim();
      if (!trimmed || !onRenameStore) {
        cancelRename();
        return;
      }
      setRenaming(true);
      setRenameError(null);
      try {
        await onRenameStore(storeId, trimmed);
        cancelRename();
      } catch (err) {
        setRenameError(
          err instanceof Error ? err.message : 'Failed to rename store',
        );
      } finally {
        setRenaming(false);
      }
    },
    [editName, onRenameStore, cancelRename],
  );

  if (stores.length === 0) {
    return (
      <Alert severity="info" variant="outlined" sx={{ mb: 1.5 }}>
        No vector stores active. Use the <strong>Create New</strong> tab.
      </Alert>
    );
  }

  return (
    <>
      {renameError && (
        <Alert
          severity="error"
          sx={{ mb: 1 }}
          onClose={() => setRenameError(null)}
        >
          {renameError}
        </Alert>
      )}
      <TableContainer
        component={Paper}
        variant="outlined"
        sx={{ mb: 1.5, maxHeight: 360, overflow: 'auto' }}
      >
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow
              sx={{
                '& th': {
                  fontWeight: 600,
                  py: 0.75,
                  fontSize: '0.75rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: 'text.secondary',
                  bgcolor: 'background.paper',
                },
              }}
            >
              <TableCell>Store</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="center">Files</TableCell>
              <TableCell>Model</TableCell>
              <TableCell>Activity</TableCell>
              <TableCell align="right" sx={{ width: 80 }} />
            </TableRow>
          </TableHead>
          <TableBody>
            {stores.map(store => {
              const statusCfg =
                STATUS_CONFIG[store.status] ?? STATUS_CONFIG.unknown;
              const isEditing = editingId === store.id;
              const displayName = store.name !== store.id ? store.name : '';

              return (
                <TableRow
                  key={store.id}
                  selected={store.id === selectedStoreId}
                  hover
                  tabIndex={0}
                  aria-selected={store.id === selectedStoreId}
                  onClick={() => onSelectStore(store.id)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelectStore(store.id);
                    }
                  }}
                  sx={{
                    cursor: 'pointer',
                    '&:last-child td': { borderBottom: 0 },
                    '&:focus-visible': {
                      outline: '2px solid',
                      outlineColor: 'primary.main',
                      outlineOffset: -2,
                    },
                  }}
                >
                  <TableCell sx={{ py: 0.75, maxWidth: 280 }}>
                    {isEditing ? (
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                        onClick={e => e.stopPropagation()}
                      >
                        <TextField
                          size="small"
                          value={editName}
                          onChange={e => setEditName(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') void confirmRename(store.id);
                            if (e.key === 'Escape') cancelRename();
                          }}
                          // eslint-disable-next-line jsx-a11y/no-autofocus
                          autoFocus
                          disabled={renaming}
                          placeholder="Enter name..."
                          sx={{
                            '& .MuiInputBase-input': {
                              py: 0.5,
                              fontSize: '0.8125rem',
                            },
                          }}
                        />
                        <IconButton
                          size="small"
                          color="primary"
                          aria-label="Confirm rename"
                          onClick={() => void confirmRename(store.id)}
                          disabled={renaming || !editName.trim()}
                        >
                          {renaming ? (
                            <CircularProgress size={14} />
                          ) : (
                            <CheckIcon fontSize="small" />
                          )}
                        </IconButton>
                        <IconButton
                          size="small"
                          aria-label="Cancel rename"
                          onClick={cancelRename}
                          disabled={renaming}
                        >
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    ) : (
                      <>
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                          }}
                        >
                          <Typography variant="body2" fontWeight={500} noWrap>
                            {displayName || (
                              <Typography
                                component="span"
                                variant="body2"
                                sx={{
                                  fontStyle: 'italic',
                                  color: 'text.disabled',
                                }}
                              >
                                Unnamed
                              </Typography>
                            )}
                          </Typography>
                          {onRenameStore && (
                            <Tooltip title="Rename">
                              <IconButton
                                size="small"
                                aria-label={`Rename ${displayName || store.id}`}
                                onClick={e => startRename(store, e)}
                                sx={{
                                  p: 0.25,
                                  opacity: 0.5,
                                  '&:hover': { opacity: 1 },
                                }}
                              >
                                <EditIcon sx={{ fontSize: 14 }} />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                        <Typography
                          variant="caption"
                          color="textSecondary"
                          sx={{
                            fontFamily: 'monospace',
                            fontSize: '0.6875rem',
                          }}
                          noWrap
                        >
                          {store.id}
                        </Typography>
                        {store.providerType && (
                          <Box sx={{ mt: 0.25 }}>
                            <Chip
                              icon={<StorageIcon />}
                              label={store.providerType}
                              size="small"
                              variant="outlined"
                              sx={{
                                height: 18,
                                fontSize: '0.625rem',
                                '& .MuiChip-icon': { fontSize: 12 },
                              }}
                            />
                          </Box>
                        )}
                      </>
                    )}
                  </TableCell>

                  <TableCell sx={{ py: 0.75 }}>
                    <Chip
                      icon={statusCfg.icon as React.ReactElement}
                      label={statusCfg.label}
                      size="small"
                      color={statusCfg.color}
                      sx={{ fontSize: '0.75rem' }}
                    />
                  </TableCell>

                  <TableCell align="center" sx={{ py: 0.75 }}>
                    <Box
                      sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 0.5,
                      }}
                    >
                      <Typography variant="body2">{store.fileCount}</Typography>
                      <FileCountBar fileCounts={store.fileCounts} />
                    </Box>
                    {store.usageBytes !== undefined && store.usageBytes > 0 && (
                      <Typography
                        variant="caption"
                        display="block"
                        color="textSecondary"
                      >
                        {formatBytes(store.usageBytes)}
                      </Typography>
                    )}
                  </TableCell>

                  <TableCell sx={{ py: 0.75 }}>
                    {store.embeddingModel ? (
                      <Tooltip
                        title={`Embedding model: ${store.embeddingModel}`}
                      >
                        <Typography
                          variant="caption"
                          noWrap
                          sx={{
                            maxWidth: 140,
                            display: 'block',
                            fontFamily: 'monospace',
                            fontSize: '0.6875rem',
                          }}
                        >
                          {store.embeddingModel.split('/').pop()}
                        </Typography>
                      </Tooltip>
                    ) : (
                      <Typography variant="caption" color="textDisabled">
                        -
                      </Typography>
                    )}
                    {store.embeddingDimension && (
                      <Typography
                        variant="caption"
                        color="textSecondary"
                        display="block"
                      >
                        {store.embeddingDimension}d
                      </Typography>
                    )}
                  </TableCell>

                  <TableCell sx={{ py: 0.75 }}>
                    <Tooltip
                      title={
                        store.createdAt
                          ? `Created: ${new Date(store.createdAt * 1000).toLocaleString()}`
                          : ''
                      }
                    >
                      <Typography
                        variant="caption"
                        color="textSecondary"
                        display="block"
                      >
                        {formatRelativeTime(
                          store.lastActiveAt || store.createdAt,
                        )}
                      </Typography>
                    </Tooltip>
                  </TableCell>

                  <TableCell align="right" sx={{ py: 0.75 }}>
                    <Tooltip title="Delete store">
                      <IconButton
                        size="small"
                        aria-label={`Delete ${displayName || store.id}`}
                        onClick={e => {
                          e.stopPropagation();
                          onDeleteStore(store);
                        }}
                        disabled={deleteInProgress === store.id || loading}
                        color="error"
                        sx={{ opacity: 0.6, '&:hover': { opacity: 1 } }}
                      >
                        {deleteInProgress === store.id ? (
                          <CircularProgress size={14} />
                        ) : (
                          <DeleteIcon fontSize="small" />
                        )}
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
};
