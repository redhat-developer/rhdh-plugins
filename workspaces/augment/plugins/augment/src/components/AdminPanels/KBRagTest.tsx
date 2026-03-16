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
import { useState, useCallback, useEffect } from 'react';
import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Chip from '@mui/material/Chip';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import Typography from '@mui/material/Typography';
import {
  useRagTest,
  useRagGenerate,
  type ActiveVectorStore,
} from '../../hooks';
import type { RagTestResult } from '@red-hat-developer-hub/backstage-plugin-augment-common';
import { RagQueryForm } from './RagQueryForm';
import { RagResultsTable } from './RagResultsTable';
import { GeneratedAnswerCard } from './GeneratedAnswerCard';

const MAX_HISTORY = 8;

export type RagTestMode = 'search' | 'generate';

interface Props {
  stores: ActiveVectorStore[];
  selectedStoreId: string | null;
  onSelectStore?: (storeId: string) => void;
}

export const KBRagTest = ({
  stores,
  selectedStoreId,
  onSelectStore,
}: Props) => {
  const {
    search,
    loading: searchLoading,
    error: searchError,
    result: searchResult,
    searchTimeMs,
    clearResult: clearSearchResult,
    clearError: clearSearchError,
  } = useRagTest();

  const {
    generate,
    loading: generateLoading,
    error: generateError,
    result: generateResult,
    generateTimeMs,
    clearResult: clearGenerateResult,
    clearError: clearGenerateError,
  } = useRagGenerate();

  const [ragQuery, setRagQuery] = useState('');
  const [maxResults, setMaxResults] = useState(5);
  const [searchAllStores, setSearchAllStores] = useState(false);
  const [queryHistory, setQueryHistory] = useState<string[]>([]);
  const [expandedChunks, setExpandedChunks] = useState<Set<number>>(new Set());
  const [scoreThreshold, setScoreThreshold] = useState(0);
  const [mode, setMode] = useState<RagTestMode>('search');

  const loading = mode === 'search' ? searchLoading : generateLoading;
  const error = mode === 'search' ? searchError : generateError;
  const clearError = mode === 'search' ? clearSearchError : clearGenerateError;
  const result = mode === 'search' ? searchResult : generateResult;
  const timeMs = mode === 'search' ? searchTimeMs : generateTimeMs;

  const selectedStore = stores.find(s => s.id === selectedStoreId) ?? null;
  const hasStores = stores.length > 0;

  const addToHistory = useCallback((query: string) => {
    setQueryHistory(prev => {
      const filtered = prev.filter(q => q !== query);
      return [query, ...filtered].slice(0, MAX_HISTORY);
    });
  }, []);

  const handleSearch = useCallback(async () => {
    const trimmed = ragQuery.trim();
    if (!trimmed) return;
    clearError();
    setExpandedChunks(new Set());
    addToHistory(trimmed);

    const storeIds = searchAllStores ? stores.map(s => s.id) : undefined;
    const storeId = searchAllStores
      ? undefined
      : (selectedStoreId ?? undefined);

    if (mode === 'generate') {
      await generate(trimmed, maxResults, storeId, storeIds).catch(() => {});
    } else {
      await search(trimmed, maxResults, storeId, storeIds).catch(() => {});
    }
  }, [
    ragQuery,
    maxResults,
    search,
    generate,
    clearError,
    selectedStoreId,
    searchAllStores,
    stores,
    addToHistory,
    mode,
  ]);

  const handleHistoryClick = useCallback(
    (query: string) => {
      setRagQuery(query);
      clearError();
      setExpandedChunks(new Set());
      addToHistory(query);

      const storeIds = searchAllStores ? stores.map(s => s.id) : undefined;
      const storeId = searchAllStores
        ? undefined
        : (selectedStoreId ?? undefined);

      if (mode === 'generate') {
        void generate(query, maxResults, storeId, storeIds).catch(() => {});
      } else {
        void search(query, maxResults, storeId, storeIds).catch(() => {});
      }
    },
    [
      search,
      generate,
      maxResults,
      selectedStoreId,
      searchAllStores,
      stores,
      clearError,
      addToHistory,
      mode,
    ],
  );

  const toggleChunk = useCallback((index: number) => {
    setExpandedChunks(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }, []);

  const handleExpandCollapseAll = useCallback(() => {
    if (!result) return;
    const CHUNK_PREVIEW_LENGTH = 300;
    const longIndices = result.chunks
      .map((c, i) => (c.text.length > CHUNK_PREVIEW_LENGTH ? i : -1))
      .filter(i => i >= 0);
    const allExpanded = longIndices.every(i => expandedChunks.has(i));
    setExpandedChunks(allExpanded ? new Set() : new Set(longIndices));
  }, [result, expandedChunks]);

  useEffect(() => {
    clearSearchResult();
    clearGenerateResult();
    clearSearchError();
    clearGenerateError();
    setExpandedChunks(new Set());
  }, [
    selectedStoreId,
    searchAllStores,
    clearSearchResult,
    clearGenerateResult,
    clearSearchError,
    clearGenerateError,
  ]);

  // Clear results when switching mode
  useEffect(() => {
    setExpandedChunks(new Set());
  }, [mode]);

  if (!hasStores) {
    return (
      <Alert severity="info" variant="outlined">
        Create a vector store and ingest documents before testing RAG queries.
      </Alert>
    );
  }

  if (!searchAllStores && !selectedStore) {
    return (
      <Alert severity="info" variant="outlined">
        Select a store below, or enable <strong>Search all stores</strong>.
        {stores.length > 0 && (
          <Box sx={{ mt: 1.5, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {stores.map(s => (
              <Chip
                key={s.id}
                label={s.name !== s.id ? s.name : s.id}
                size="small"
                variant="outlined"
                onClick={() => onSelectStore?.(s.id)}
                sx={{
                  cursor: 'pointer',
                  '&:hover': {
                    bgcolor: 'action.hover',
                    borderColor: 'primary.main',
                  },
                }}
              />
            ))}
            {stores.length > 1 && (
              <FormControlLabel
                control={
                  <Switch
                    size="small"
                    checked={searchAllStores}
                    onChange={(_, v) => setSearchAllStores(v)}
                  />
                }
                label={
                  <Typography variant="caption">
                    Search all {stores.length} stores
                  </Typography>
                }
              />
            )}
          </Box>
        )}
      </Alert>
    );
  }

  return (
    <>
      <RagQueryForm
        ragQuery={ragQuery}
        onRagQueryChange={setRagQuery}
        maxResults={maxResults}
        onMaxResultsChange={setMaxResults}
        searchAllStores={searchAllStores}
        onSearchAllStoresChange={setSearchAllStores}
        queryHistory={queryHistory}
        onSearch={handleSearch}
        onHistoryClick={handleHistoryClick}
        loading={loading}
        stores={stores}
        selectedStore={selectedStore}
        onSelectStore={onSelectStore}
        mode={mode}
        onModeChange={setMode}
      />

      {!searchAllStores && selectedStore && selectedStore.fileCount === 0 && (
        <Alert severity="warning" variant="outlined" sx={{ mb: 1.5 }}>
          This store has no documents. Ingest files first to test retrieval.
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 1.5 }} onClose={clearError}>
          {error}
        </Alert>
      )}

      {mode === 'generate' && generateResult && (
        <GeneratedAnswerCard
          answer={generateResult.answer}
          model={generateResult.model}
          timeMs={generateTimeMs}
        />
      )}

      {result && (
        <RagResultsTable
          result={result as RagTestResult}
          searchTimeMs={timeMs}
          searchAllStores={searchAllStores}
          stores={stores}
          expandedChunks={expandedChunks}
          onToggleChunk={toggleChunk}
          onExpandCollapseAll={handleExpandCollapseAll}
          scoreThreshold={scoreThreshold}
          onScoreThresholdChange={setScoreThreshold}
        />
      )}
    </>
  );
};
