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
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import FormControlLabel from '@mui/material/FormControlLabel';
import { ToggleSwitch as Switch } from './shared/ToggleSwitch';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import SearchIcon from '@mui/icons-material/Search';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import StorageIcon from '@mui/icons-material/Storage';
import CircularProgress from '@mui/material/CircularProgress';
import type { ActiveVectorStore } from '../../hooks';
import type { RagTestMode } from './KBRagTest';
import { SELECT_MENU_PROPS } from './shared/selectMenuProps';

const MAX_RESULTS_OPTIONS = [3, 5, 10, 15, 20];

export interface RagQueryFormProps {
  ragQuery: string;
  onRagQueryChange: (value: string) => void;
  maxResults: number;
  onMaxResultsChange: (value: number) => void;
  searchAllStores: boolean;
  onSearchAllStoresChange: (value: boolean) => void;
  queryHistory: string[];
  onSearch: () => void;
  onHistoryClick: (query: string) => void;
  loading: boolean;
  stores: ActiveVectorStore[];
  selectedStore: ActiveVectorStore | null;
  onSelectStore?: (storeId: string) => void;
  mode: RagTestMode;
  onModeChange: (mode: RagTestMode) => void;
}

export function RagQueryForm({
  ragQuery,
  onRagQueryChange,
  maxResults,
  onMaxResultsChange,
  searchAllStores,
  onSearchAllStoresChange,
  queryHistory,
  onSearch,
  onHistoryClick,
  loading,
  stores,
  selectedStore,
  onSelectStore,
  mode,
  onModeChange,
}: RagQueryFormProps) {
  const isGenerate = mode === 'generate';

  const searchContextLabel = (() => {
    if (searchAllStores) {
      return (
        <>
          Searching{' '}
          <strong>
            all {stores.length} store
            {stores.length !== 1 ? 's' : ''}
          </strong>
        </>
      );
    }
    if (selectedStore) {
      const storeLabel =
        selectedStore.name !== selectedStore.id
          ? selectedStore.name
          : selectedStore.id;
      const fileSuffix = selectedStore.fileCount !== 1 ? 's' : '';
      const fileCountLabel =
        selectedStore.fileCount > 0
          ? ` (${selectedStore.fileCount} file${fileSuffix})`
          : ' (empty)';
      return (
        <>
          Searching <strong>{storeLabel}</strong>
          {fileCountLabel}
        </>
      );
    }
    return null;
  })();

  return (
    <>
      {/* Mode toggle + store context bar */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          mb: 1.5,
          flexWrap: 'wrap',
        }}
      >
        <ToggleButtonGroup
          value={mode}
          exclusive
          onChange={(_, v) => {
            if (v) onModeChange(v);
          }}
          size="small"
          sx={{ mr: 1 }}
        >
          <ToggleButton
            value="search"
            sx={{
              textTransform: 'none',
              px: 1.5,
              py: 0.25,
              fontSize: '0.75rem',
            }}
          >
            <SearchIcon sx={{ fontSize: 14, mr: 0.5 }} />
            Search
          </ToggleButton>
          <ToggleButton
            value="generate"
            sx={{
              textTransform: 'none',
              px: 1.5,
              py: 0.25,
              fontSize: '0.75rem',
            }}
          >
            <AutoAwesomeIcon sx={{ fontSize: 14, mr: 0.5 }} />
            Generate Answer
          </ToggleButton>
        </ToggleButtonGroup>

        <StorageIcon sx={{ fontSize: 16, color: 'primary.main' }} />
        {!searchAllStores && stores.length > 1 && onSelectStore ? (
          <TextField
            select
            size="small"
            value={selectedStore?.id ?? ''}
            onChange={e => onSelectStore(e.target.value)}
            sx={{ minWidth: 160, flexGrow: 1 }}
            SelectProps={{
              displayEmpty: true,
              MenuProps: SELECT_MENU_PROPS,
            }}
          >
            {stores.map(s => (
              <MenuItem key={s.id} value={s.id}>
                {s.name !== s.id ? s.name : s.id}
                {s.fileCount > 0
                  ? ` (${s.fileCount} file${s.fileCount !== 1 ? 's' : ''})`
                  : ' (empty)'}
              </MenuItem>
            ))}
          </TextField>
        ) : (
          <Typography
            variant="body2"
            color="textSecondary"
            sx={{ flexGrow: 1 }}
          >
            {searchContextLabel}
          </Typography>
        )}
        {stores.length > 1 && (
          <FormControlLabel
            control={
              <Switch
                checked={searchAllStores}
                onChange={(_, v) => onSearchAllStoresChange(v)}
              />
            }
            label={<Typography variant="caption">All stores</Typography>}
          />
        )}
      </Box>

      {/* Search controls */}
      <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
        <TextField
          fullWidth
          size="small"
          placeholder={
            isGenerate ? 'Ask a question...' : 'Enter a test query...'
          }
          value={ragQuery}
          onChange={e => onRagQueryChange(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') onSearch();
          }}
          inputProps={{ maxLength: 2000 }}
        />
        <TextField
          select
          size="small"
          label="Results"
          value={maxResults}
          onChange={e => onMaxResultsChange(Number(e.target.value))}
          sx={{ minWidth: 88 }}
          SelectProps={{ MenuProps: SELECT_MENU_PROPS }}
        >
          {MAX_RESULTS_OPTIONS.map(n => (
            <MenuItem key={n} value={n}>
              {n}
            </MenuItem>
          ))}
        </TextField>
        <Button
          variant="contained"
          size="small"
          color={isGenerate ? 'secondary' : 'primary'}
          startIcon={
            // eslint-disable-next-line no-nested-ternary
            loading ? (
              <CircularProgress size={14} />
            ) : isGenerate ? (
              <AutoAwesomeIcon />
            ) : (
              <SearchIcon />
            )
          }
          onClick={onSearch}
          disabled={
            loading ||
            !ragQuery.trim() ||
            (!searchAllStores && selectedStore?.fileCount === 0)
          }
          sx={{ whiteSpace: 'nowrap', minWidth: 120, textTransform: 'none' }}
        >
          {isGenerate ? 'Generate' : 'Search'}
        </Button>
      </Box>

      {/* Query history */}
      {queryHistory.length > 0 && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            mb: 1.5,
            flexWrap: 'wrap',
          }}
        >
          <Typography variant="caption" color="textSecondary" sx={{ mr: 0.5 }}>
            Recent:
          </Typography>
          {queryHistory.map(q => (
            <Chip
              key={q}
              label={q.length > 30 ? `${q.slice(0, 30)}\u2026` : q}
              size="small"
              variant="outlined"
              onClick={() => onHistoryClick(q)}
              sx={{
                fontSize: '0.7rem',
                height: 22,
                cursor: 'pointer',
                '&:hover': {
                  bgcolor: 'action.hover',
                  borderColor: 'primary.main',
                },
              }}
            />
          ))}
        </Box>
      )}
    </>
  );
}
