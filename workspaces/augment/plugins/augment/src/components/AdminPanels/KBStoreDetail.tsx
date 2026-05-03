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
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import LinearProgress from '@mui/material/LinearProgress';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Collapse from '@mui/material/Collapse';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import DescriptionIcon from '@mui/icons-material/Description';
import StorageIcon from '@mui/icons-material/Storage';
import MemoryIcon from '@mui/icons-material/Memory';
import SearchIcon from '@mui/icons-material/Search';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import type { ActiveVectorStore } from '../../hooks';
import { useRagTest } from '../../hooks';

function formatBytes(bytes: number | undefined): string {
  if (bytes === undefined || bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let unitIndex = 0;
  let value = bytes;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }
  return `${value.toFixed(unitIndex > 0 ? 1 : 0)} ${units[unitIndex]}`;
}

function formatTimestamp(epochSeconds: number | undefined): string {
  if (!epochSeconds) return 'N/A';
  return new Date(epochSeconds * 1000).toLocaleString();
}

function MetadataRow({
  label,
  value,
  mono,
  copyable,
}: {
  label: string;
  value: string | undefined;
  mono?: boolean;
  copyable?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  if (!value) return null;

  const handleCopy = () => {
    window.navigator.clipboard.writeText(value).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      },
      () => {
        /* clipboard may not be available in all contexts */
      },
    );
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        py: 0.5,
        '&:not(:last-child)': { borderBottom: 1, borderColor: 'divider' },
      }}
    >
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ minWidth: 120 }}
      >
        {label}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <Typography
          variant="caption"
          sx={{
            fontFamily: mono ? 'monospace' : 'inherit',
            fontWeight: mono ? 500 : 400,
            fontSize: '0.75rem',
            maxWidth: 300,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {value}
        </Typography>
        {copyable && (
          <Tooltip title={copied ? 'Copied' : 'Copy'}>
            <IconButton
              size="small"
              aria-label={`Copy ${label}`}
              onClick={handleCopy}
              sx={{ p: 0.25 }}
            >
              {copied ? (
                <CheckCircleIcon sx={{ fontSize: 12, color: 'success.main' }} />
              ) : (
                <ContentCopyIcon sx={{ fontSize: 12 }} />
              )}
            </IconButton>
          </Tooltip>
        )}
      </Box>
    </Box>
  );
}

function FileCountsBreakdown({
  fileCounts,
}: {
  fileCounts: NonNullable<ActiveVectorStore['fileCounts']>;
}) {
  const { completed, inProgress, failed, cancelled, total } = fileCounts;
  if (total === 0) return null;

  const completedPct = (completed / total) * 100;
  let barColor: 'error' | 'warning' | 'success' = 'success';
  if (failed > 0) barColor = 'error';
  else if (inProgress > 0) barColor = 'warning';

  return (
    <Box sx={{ mt: 1 }}>
      <Box sx={{ display: 'flex', gap: 1.5, mb: 0.5, flexWrap: 'wrap' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <CheckCircleIcon sx={{ fontSize: 14, color: 'success.main' }} />
          <Typography variant="caption">{completed} completed</Typography>
        </Box>
        {inProgress > 0 && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <HourglassEmptyIcon sx={{ fontSize: 14, color: 'warning.main' }} />
            <Typography variant="caption">{inProgress} processing</Typography>
          </Box>
        )}
        {failed > 0 && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <ErrorOutlineIcon sx={{ fontSize: 14, color: 'error.main' }} />
            <Typography variant="caption">{failed} failed</Typography>
          </Box>
        )}
        {cancelled > 0 && (
          <Typography variant="caption" color="text.secondary">
            {cancelled} cancelled
          </Typography>
        )}
      </Box>
      <LinearProgress
        variant="determinate"
        value={completedPct}
        color={barColor}
        sx={{
          height: 6,
          borderRadius: 3,
          bgcolor: 'action.hover',
          '& .MuiLinearProgress-bar': {
            borderRadius: 3,
          },
        }}
      />
    </Box>
  );
}

interface QuickSearchProps {
  vectorStoreId: string;
}

function QuickSearch({ vectorStoreId }: QuickSearchProps) {
  const {
    search,
    loading,
    error,
    result,
    searchTimeMs,
    clearError,
    clearResult,
  } = useRagTest();
  const [query, setQuery] = useState('');

  const handleSearch = useCallback(async () => {
    const trimmed = query.trim();
    if (!trimmed) return;
    clearError();
    await search(trimmed, 3, vectorStoreId).catch(() => {});
  }, [query, vectorStoreId, search, clearError]);

  return (
    <Box sx={{ mt: 1.5 }}>
      <Typography
        variant="caption"
        color="text.secondary"
        fontWeight={600}
        sx={{
          mb: 0.5,
          display: 'block',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}
      >
        Quick Search
      </Typography>
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
        <TextField
          size="small"
          placeholder="Test a query against this store..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') void handleSearch();
          }}
          fullWidth
          sx={{ '& .MuiInputBase-input': { fontSize: '0.8125rem' } }}
        />
        <Button
          variant="outlined"
          size="small"
          onClick={handleSearch}
          disabled={loading || !query.trim()}
          startIcon={loading ? <CircularProgress size={14} /> : <SearchIcon />}
          sx={{ textTransform: 'none', minWidth: 90, whiteSpace: 'nowrap' }}
        >
          Search
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mt: 1, py: 0 }} onClose={clearError}>
          <Typography variant="caption">{error}</Typography>
        </Alert>
      )}

      {result !== null && result.chunks.length === 0 && !error && (
        <Box sx={{ mt: 1, textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            No results found for &ldquo;{query}&rdquo;
          </Typography>
        </Box>
      )}

      <Collapse in={result !== null && result.chunks.length > 0}>
        {result && (
          <Box sx={{ mt: 1 }}>
            <Box
              sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}
            >
              <Typography variant="caption" color="text.secondary">
                {result.totalResults} chunk
                {result.totalResults !== 1 ? 's' : ''} found
              </Typography>
              {searchTimeMs !== null && (
                <Typography variant="caption" color="text.secondary">
                  in {searchTimeMs}ms
                </Typography>
              )}
              <Box sx={{ flexGrow: 1 }} />
              <Button
                size="small"
                onClick={clearResult}
                sx={{
                  textTransform: 'none',
                  fontSize: '0.6875rem',
                  minWidth: 0,
                  p: 0.25,
                }}
              >
                Clear
              </Button>
            </Box>
            {result.chunks.slice(0, 3).map((chunk, i) => (
              <Paper
                key={i}
                variant="outlined"
                sx={{
                  p: 1,
                  mb: 0.5,
                  bgcolor: 'action.hover',
                  '&:last-child': { mb: 0 },
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    mb: 0.25,
                  }}
                >
                  {chunk.score !== undefined && (
                    <Chip
                      label={`${(chunk.score * 100).toFixed(1)}%`}
                      size="small"
                      // eslint-disable-next-line no-nested-ternary
                      color={
                        chunk.score > 0.7
                          ? 'success'
                          : chunk.score > 0.4
                            ? 'warning'
                            : 'default'
                      }
                      sx={{ height: 18, fontSize: '0.625rem' }}
                    />
                  )}
                  {chunk.fileName && (
                    <Typography variant="caption" color="text.secondary" noWrap>
                      {chunk.fileName}
                    </Typography>
                  )}
                </Box>
                <Typography
                  variant="caption"
                  sx={{
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    fontSize: '0.6875rem',
                    lineHeight: 1.5,
                  }}
                >
                  {chunk.text}
                </Typography>
              </Paper>
            ))}
          </Box>
        )}
      </Collapse>
    </Box>
  );
}

interface KBStoreDetailProps {
  store: ActiveVectorStore;
}

export const KBStoreDetail = ({ store }: KBStoreDetailProps) => {
  const displayName = store.name !== store.id ? store.name : null;

  return (
    <Box>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
          gap: 1.5,
        }}
      >
        {/* Left column: Identity & Configuration */}
        <Paper variant="outlined" sx={{ p: 1.5 }}>
          <Typography
            variant="caption"
            color="text.secondary"
            fontWeight={600}
            sx={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}
          >
            Store Configuration
          </Typography>
          <Box sx={{ mt: 1 }}>
            <MetadataRow label="Store ID" value={store.id} mono copyable />
            {displayName && <MetadataRow label="Name" value={displayName} />}
            <MetadataRow label="Status" value={store.status} />
            <MetadataRow
              label="Embedding Model"
              value={store.embeddingModel}
              mono
            />
            <MetadataRow
              label="Dimension"
              value={store.embeddingDimension?.toString()}
            />
            <MetadataRow label="Provider" value={store.providerType} />
            <MetadataRow
              label="Created"
              value={formatTimestamp(store.createdAt)}
            />
            <MetadataRow
              label="Last Active"
              value={formatTimestamp(store.lastActiveAt)}
            />
          </Box>
        </Paper>

        {/* Right column: Storage & Files */}
        <Paper variant="outlined" sx={{ p: 1.5 }}>
          <Typography
            variant="caption"
            color="text.secondary"
            fontWeight={600}
            sx={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}
          >
            Storage & Files
          </Typography>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 1.5,
              mt: 1.5,
            }}
          >
            <Paper
              variant="outlined"
              sx={{
                p: 1.5,
                textAlign: 'center',
                bgcolor: 'action.hover',
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 0.5,
                  mb: 0.5,
                }}
              >
                <DescriptionIcon fontSize="small" color="action" />
              </Box>
              <Typography variant="h5" sx={{ fontSize: '1.25rem', fontWeight: 700, color: 'text.primary' }}>
                {store.fileCount}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Total Files
              </Typography>
            </Paper>

            <Paper
              variant="outlined"
              sx={{
                p: 1.5,
                textAlign: 'center',
                bgcolor: 'action.hover',
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 0.5,
                  mb: 0.5,
                }}
              >
                <StorageIcon fontSize="small" color="action" />
              </Box>
              <Typography variant="h5" sx={{ fontSize: '1.25rem', fontWeight: 700, color: 'text.primary' }}>
                {formatBytes(store.usageBytes)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Storage Used
              </Typography>
            </Paper>
          </Box>

          {store.fileCounts && store.fileCounts.total > 0 && (
            <>
              <Divider sx={{ my: 1.5 }} />
              <Typography
                variant="caption"
                color="text.secondary"
                fontWeight={600}
                sx={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}
              >
                Processing Status
              </Typography>
              <FileCountsBreakdown fileCounts={store.fileCounts} />
            </>
          )}

          {store.embeddingModel && (
            <>
              <Divider sx={{ my: 1.5 }} />
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <MemoryIcon fontSize="small" color="action" />
                <Box>
                  <Typography variant="caption" fontWeight={500}>
                    {store.embeddingModel}
                  </Typography>
                  {store.embeddingDimension && (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      display="block"
                    >
                      {store.embeddingDimension} dimensions
                    </Typography>
                  )}
                </Box>
              </Box>
            </>
          )}
        </Paper>
      </Box>

      {/* Quick Search */}
      <QuickSearch vectorStoreId={store.id} />
    </Box>
  );
};
