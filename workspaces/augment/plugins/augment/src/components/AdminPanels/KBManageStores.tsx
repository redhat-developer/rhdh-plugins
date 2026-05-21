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
import { type ReactElement, useState, useCallback, useMemo } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Snackbar from '@mui/material/Snackbar';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DescriptionIcon from '@mui/icons-material/Description';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import RefreshIcon from '@mui/icons-material/Refresh';
import LinkIcon from '@mui/icons-material/Link';
import StorageIcon from '@mui/icons-material/Storage';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import { StoresTable } from './StoresTable';
import { KBStoreDetail } from './KBStoreDetail';
import { IngestDropZone } from './IngestDropZone';
import { DocumentsTable } from './DocumentsTable';
import { DeleteStoreDialog } from './DeleteStoreDialog';
import { useStoreDocuments } from './useStoreDocuments';
import type { ActiveVectorStore } from '../../hooks';

interface Props {
  stores: ActiveVectorStore[];
  unconnectedStores?: ActiveVectorStore[];
  selectedStoreId: string | null;
  onSelectStore: (id: string) => void;
  onRefresh: () => void;
  onRemoveStore: (id: string, permanent?: boolean) => Promise<void>;
  onConnectStore?: (id: string) => Promise<void>;
  onUpdateStore?: (
    id: string,
    updates: { name?: string; metadata?: Record<string, string> },
  ) => Promise<void>;
}

const STATUS_ICON: Record<string, ReactElement> = {
  completed: <CheckCircleIcon sx={{ fontSize: 14, color: 'success.main' }} />,
  in_progress: (
    <HourglassEmptyIcon sx={{ fontSize: 14, color: 'warning.main' }} />
  ),
  failed: <ErrorOutlineIcon sx={{ fontSize: 14, color: 'error.main' }} />,
};

function StoreDetailHeader({
  store,
  fileCount,
}: {
  store: ActiveVectorStore;
  fileCount: number;
}) {
  const displayName = store.name !== store.id ? store.name : store.id;
  const shortId =
    store.id.length > 20
      ? `${store.id.slice(0, 8)}...${store.id.slice(-8)}`
      : store.id;

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        px: 1.5,
        pt: 1.5,
        pb: 1,
        flexWrap: 'wrap',
      }}
    >
      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
        <Typography variant="subtitle1" fontWeight={600} noWrap>
          {displayName}
        </Typography>
        {store.name !== store.id && (
          <Tooltip title={store.id}>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontFamily: 'monospace', fontSize: '0.6875rem' }}
              noWrap
            >
              {shortId}
            </Typography>
          </Tooltip>
        )}
      </Box>
      <Box
        sx={{
          display: 'flex',
          gap: 0.75,
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        <Chip
          icon={STATUS_ICON[store.status] || undefined}
          label={store.status || 'unknown'}
          size="small"
          variant="outlined"
          color={
            // eslint-disable-next-line no-nested-ternary
            store.status === 'completed'
              ? 'success'
              : store.status === 'failed'
                ? 'error'
                : 'default'
          }
          sx={{ height: 22, fontSize: '0.6875rem' }}
        />
        <Chip
          label={`${fileCount} file${fileCount !== 1 ? 's' : ''}`}
          size="small"
          variant="outlined"
          sx={{ height: 22, fontSize: '0.6875rem' }}
        />
        {store.embeddingModel && (
          <Tooltip title={store.embeddingModel}>
            <Chip
              label={store.embeddingModel.split('/').pop()}
              size="small"
              variant="outlined"
              color="info"
              sx={{ height: 22, fontSize: '0.6875rem' }}
            />
          </Tooltip>
        )}
        {store.providerType && (
          <Chip
            icon={<StorageIcon />}
            label={store.providerType}
            size="small"
            variant="outlined"
            sx={{
              height: 22,
              fontSize: '0.6875rem',
              '& .MuiChip-icon': { fontSize: 12 },
            }}
          />
        )}
      </Box>
    </Box>
  );
}

const COLLAPSED_LIMIT = 5;

function UnconnectedStoresSection({
  stores,
  connectInProgress,
  onConnect,
}: {
  stores: ActiveVectorStore[];
  connectInProgress: string | null;
  onConnect: (id: string) => Promise<void>;
}) {
  const [expanded, setExpanded] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);
  const hasMore = stores.length > COLLAPSED_LIMIT;
  const visibleStores = useMemo(
    () => (expanded ? stores : stores.slice(0, COLLAPSED_LIMIT)),
    [stores, expanded],
  );
  const hiddenCount = stores.length - COLLAPSED_LIMIT;

  return (
    <Paper variant="outlined" sx={{ mb: 1.5 }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          px: 2,
          pt: 1.5,
          pb: 0.5,
        }}
      >
        <Typography variant="subtitle2" sx={{ flexGrow: 1 }}>
          Available Stores on Server
        </Typography>
        <Chip
          label={`${stores.length} available`}
          size="small"
          variant="outlined"
          color="info"
        />
      </Box>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ px: 2, pb: 1, display: 'block' }}
      >
        These vector stores exist on the server. Connect one to start managing
        files and using it for RAG queries.
      </Typography>
      {connectError && (
        <Alert
          severity="error"
          sx={{ mx: 2, mb: 1 }}
          onClose={() => setConnectError(null)}
        >
          {connectError}
        </Alert>
      )}
      <TableContainer
        sx={{
          maxHeight: expanded ? 400 : undefined,
          overflow: expanded ? 'auto' : undefined,
        }}
      >
        <Table size="small" stickyHeader={expanded}>
          <TableHead>
            <TableRow
              sx={{
                '& th': {
                  fontWeight: 600,
                  py: 0.5,
                  fontSize: '0.6875rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: 'text.secondary',
                  bgcolor: 'background.paper',
                },
              }}
            >
              <TableCell>ID</TableCell>
              <TableCell>Model</TableCell>
              <TableCell>Provider</TableCell>
              <TableCell align="center">Files</TableCell>
              <TableCell align="right" sx={{ width: 80 }} />
            </TableRow>
          </TableHead>
          <TableBody>
            {visibleStores.map(s => (
              <TableRow
                key={s.id}
                hover
                sx={{ '&:last-child td': { borderBottom: 0 } }}
              >
                <TableCell sx={{ py: 0.5 }}>
                  <Typography
                    variant="caption"
                    sx={{ fontFamily: 'monospace', fontSize: '0.6875rem' }}
                    noWrap
                  >
                    {s.name !== s.id ? s.name : s.id}
                  </Typography>
                  {s.name !== s.id && (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      display="block"
                      sx={{ fontFamily: 'monospace', fontSize: '0.625rem' }}
                      noWrap
                    >
                      {s.id}
                    </Typography>
                  )}
                </TableCell>
                <TableCell sx={{ py: 0.5 }}>
                  {s.embeddingModel ? (
                    <Tooltip title={s.embeddingModel}>
                      <Typography
                        variant="caption"
                        sx={{ fontFamily: 'monospace', fontSize: '0.6875rem' }}
                        noWrap
                      >
                        {s.embeddingModel.split('/').pop()}
                      </Typography>
                    </Tooltip>
                  ) : (
                    <Typography variant="caption" color="textDisabled">
                      -
                    </Typography>
                  )}
                  {s.embeddingDimension && (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      display="block"
                    >
                      {s.embeddingDimension}d
                    </Typography>
                  )}
                </TableCell>
                <TableCell sx={{ py: 0.5 }}>
                  {s.providerType ? (
                    <Chip
                      icon={<StorageIcon />}
                      label={s.providerType}
                      size="small"
                      variant="outlined"
                      sx={{
                        height: 18,
                        fontSize: '0.625rem',
                        '& .MuiChip-icon': { fontSize: 12 },
                      }}
                    />
                  ) : (
                    <Typography variant="caption" color="textDisabled">
                      -
                    </Typography>
                  )}
                </TableCell>
                <TableCell align="center" sx={{ py: 0.5 }}>
                  <Typography variant="caption">{s.fileCount}</Typography>
                </TableCell>
                <TableCell align="right" sx={{ py: 0.5 }}>
                  <Tooltip title="Connect this store">
                    <IconButton
                      size="small"
                      color="primary"
                      aria-label={`Connect store ${s.name !== s.id ? s.name : s.id}`}
                      disabled={connectInProgress !== null}
                      onClick={() => {
                        setConnectError(null);
                        onConnect(s.id).catch(err => {
                          setConnectError(
                            err instanceof Error
                              ? err.message
                              : 'Failed to connect store',
                          );
                        });
                      }}
                    >
                      {connectInProgress === s.id ? (
                        <CircularProgress size={14} />
                      ) : (
                        <LinkIcon fontSize="small" />
                      )}
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      {hasMore && (
        <Box
          sx={{
            textAlign: 'center',
            py: 0.75,
            borderTop: 1,
            borderColor: 'divider',
          }}
        >
          <Button
            size="small"
            onClick={() => setExpanded(prev => !prev)}
            endIcon={expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            sx={{ textTransform: 'none', fontSize: '0.75rem' }}
          >
            {expanded ? 'Show less' : `Show ${hiddenCount} more`}
          </Button>
        </Box>
      )}
    </Paper>
  );
}

export const KBManageStores = ({
  stores,
  unconnectedStores = [],
  selectedStoreId,
  onSelectStore,
  onRefresh,
  onRemoveStore,
  onConnectStore,
  onUpdateStore,
}: Props) => {
  const selectedStore = stores.find(s => s.id === selectedStoreId) ?? null;
  const [removeInProgress, setRemoveInProgress] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    storeId: string;
    storeName: string;
    storeStatus?: string;
  } | null>(null);
  const [detailTab, setDetailTab] = useState(0);
  const [ingestResult, setIngestResult] = useState<string | null>(null);
  const [connectInProgress, setConnectInProgress] = useState<string | null>(
    null,
  );

  const {
    documents,
    docsLoading,
    docsError,
    refreshDocs,
    deleteInProgress,
    deleteError,
    handleDelete,
  } = useStoreDocuments({
    selectedStoreId,
    onRefresh,
  });

  const confirmDeleteStore = useCallback(async () => {
    if (!deleteConfirm) return;
    const { storeId, storeStatus } = deleteConfirm;
    const permanent = storeStatus !== 'unknown';
    setDeleteConfirm(null);
    setRemoveInProgress(storeId);
    try {
      await onRemoveStore(storeId, permanent);
      refreshDocs();
    } finally {
      setRemoveInProgress(null);
    }
  }, [deleteConfirm, onRemoveStore, refreshDocs]);

  const handleRenameStore = useCallback(
    async (storeId: string, newName: string) => {
      if (onUpdateStore) {
        await onUpdateStore(storeId, { name: newName });
      }
    },
    [onUpdateStore],
  );

  const hasStores = stores.length > 0;

  return (
    <>
      <Snackbar
        open={ingestResult !== null}
        autoHideDuration={5000}
        onClose={() => setIngestResult(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity="success"
          variant="filled"
          onClose={() => setIngestResult(null)}
        >
          {ingestResult}
        </Alert>
      </Snackbar>

      <Snackbar
        open={deleteError !== null}
        autoHideDuration={6000}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="error" variant="filled">
          {deleteError}
        </Alert>
      </Snackbar>

      <StoresTable
        stores={stores}
        selectedStoreId={selectedStoreId}
        onSelectStore={id => {
          onSelectStore(id);
          setDetailTab(0);
        }}
        onDeleteStore={store =>
          setDeleteConfirm({
            storeId: store.id,
            storeName: store.name !== store.id ? store.name : store.id,
            storeStatus: store.status,
          })
        }
        onRenameStore={onUpdateStore ? handleRenameStore : undefined}
        deleteInProgress={removeInProgress}
      />

      {selectedStore && (
        <Paper variant="outlined" sx={{ mb: 1.5 }}>
          <StoreDetailHeader
            store={selectedStore}
            fileCount={documents.length}
          />

          <Tabs
            value={detailTab}
            onChange={(_, v) => setDetailTab(v)}
            sx={{
              px: 1.5,
              borderBottom: 1,
              borderColor: 'divider',
              minHeight: 36,
              '& .MuiTab-root': {
                minHeight: 36,
                textTransform: 'none',
                fontSize: '0.8125rem',
                px: 2,
                mr: 0.5,
              },
            }}
          >
            <Tab
              label="Overview"
              icon={<InfoOutlinedIcon />}
              iconPosition="start"
            />
            <Tab
              label="Files"
              icon={<DescriptionIcon />}
              iconPosition="start"
            />
            <Tab
              label="Ingest"
              icon={<CloudUploadIcon />}
              iconPosition="start"
            />
          </Tabs>

          <Box sx={{ p: 1.5 }}>
            {detailTab === 0 && <KBStoreDetail store={selectedStore} />}

            {detailTab === 1 && (
              <>
                {docsError && (
                  <Alert severity="warning" sx={{ mb: 1 }}>
                    Could not load documents: {docsError}
                  </Alert>
                )}
                {/* eslint-disable-next-line no-nested-ternary */}
                {docsLoading ? (
                  <Box sx={{ textAlign: 'center', py: 2 }}>
                    <CircularProgress size={20} />
                  </Box>
                ) : documents.length === 0 && !docsError ? (
                  <Box sx={{ textAlign: 'center', py: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      No documents yet.
                    </Typography>
                    <Button
                      size="small"
                      sx={{ mt: 0.5, textTransform: 'none' }}
                      onClick={() => setDetailTab(2)}
                    >
                      Ingest your first document
                    </Button>
                  </Box>
                ) : (
                  <DocumentsTable
                    documents={documents}
                    deleteInProgress={deleteInProgress}
                    onDelete={handleDelete}
                  />
                )}
              </>
            )}

            {detailTab === 2 && (
              <IngestDropZone
                vectorStoreId={selectedStoreId}
                onUploadComplete={message => {
                  setIngestResult(message);
                  setDetailTab(1);
                  refreshDocs();
                  onRefresh();
                }}
              />
            )}
          </Box>
        </Paper>
      )}

      {hasStores && !selectedStore && (
        <Alert severity="info" variant="outlined" sx={{ mb: 1 }}>
          Select a store above to view or ingest documents.
        </Alert>
      )}

      {unconnectedStores.length > 0 && onConnectStore && (
        <UnconnectedStoresSection
          stores={unconnectedStores}
          connectInProgress={connectInProgress}
          onConnect={async id => {
            setConnectInProgress(id);
            try {
              await onConnectStore(id);
            } finally {
              setConnectInProgress(null);
            }
          }}
        />
      )}

      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Tooltip title="Refresh">
          <IconButton size="small" onClick={onRefresh}>
            <RefreshIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      <DeleteStoreDialog
        deleteConfirm={deleteConfirm}
        onConfirm={confirmDeleteStore}
        onCancel={() => setDeleteConfirm(null)}
      />
    </>
  );
};
