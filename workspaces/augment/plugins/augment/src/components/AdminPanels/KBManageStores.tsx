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
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DescriptionIcon from '@mui/icons-material/Description';
import RefreshIcon from '@mui/icons-material/Refresh';
import LinkIcon from '@mui/icons-material/Link';
import { StoresTable } from './StoresTable';
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
}

export const KBManageStores = ({
  stores,
  unconnectedStores = [],
  selectedStoreId,
  onSelectStore,
  onRefresh,
  onRemoveStore,
  onConnectStore,
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
        deleteInProgress={removeInProgress}
      />

      {selectedStore && (
        <Paper variant="outlined" sx={{ mb: 1.5 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              px: 1.5,
              pt: 1,
              pb: 0,
            }}
          >
            <Typography variant="subtitle2" sx={{ flexGrow: 1 }}>
              {selectedStore.name !== selectedStore.id
                ? selectedStore.name
                : selectedStore.id}
            </Typography>
            <Chip
              label={`${documents.length} file${
                documents.length !== 1 ? 's' : ''
              }`}
              size="small"
              variant="outlined"
            />
          </Box>

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
            {detailTab === 0 && (
              <>
                {/* eslint-disable-next-line no-nested-ternary */}
                {docsLoading ? (
                  <Box sx={{ textAlign: 'center', py: 2 }}>
                    <CircularProgress size={20} />
                  </Box>
                ) : documents.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 2 }}>
                    <Typography variant="body2" color="textSecondary">
                      No documents yet.
                    </Typography>
                    <Button
                      size="small"
                      sx={{ mt: 0.5, textTransform: 'none' }}
                      onClick={() => setDetailTab(1)}
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

            {detailTab === 1 && (
              <IngestDropZone
                vectorStoreId={selectedStoreId}
                onUploadComplete={message => {
                  setIngestResult(message);
                  setDetailTab(0);
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
        <Paper variant="outlined" sx={{ p: 2, mb: 1.5 }}>
          <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
            Existing stores on server
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 1.5 }}>
            These vector stores exist on the LlamaStack server but are not
            connected. Click to add one to your active list.
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {unconnectedStores.map(s => (
              <Chip
                key={s.id}
                icon={
                  connectInProgress === s.id ? (
                    <CircularProgress size={14} />
                  ) : (
                    <LinkIcon />
                  )
                }
                label={s.name !== s.id ? s.name : s.id}
                variant="outlined"
                clickable
                disabled={connectInProgress !== null}
                onClick={async () => {
                  setConnectInProgress(s.id);
                  try {
                    await onConnectStore(s.id);
                  } finally {
                    setConnectInProgress(null);
                  }
                }}
              />
            ))}
          </Box>
        </Paper>
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
