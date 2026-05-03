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
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import CircularProgress from '@mui/material/CircularProgress';
import RefreshIcon from '@mui/icons-material/Refresh';
import type { VectorStoreConfig } from '../../types';

export interface CreateStoreFormProps {
  localConfig: Partial<VectorStoreConfig>;
  embeddingModels: string[];
  modelsLoading: boolean;
  defaultEmbeddingModel?: string;
  onUpdate: <K extends keyof VectorStoreConfig>(
    key: K,
    value: VectorStoreConfig[K],
  ) => void;
  onRefreshModels: () => void;
}

/**
 * Form fields for vector store name, embedding model, and dimension.
 */
export function CreateStoreForm({
  localConfig,
  embeddingModels,
  modelsLoading,
  defaultEmbeddingModel,
  onUpdate,
  onRefreshModels,
}: Readonly<CreateStoreFormProps>) {
  const nameValid = (localConfig.vectorStoreName ?? '').trim().length > 0;

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
        gap: 1.5,
        overflow: 'hidden',
      }}
    >
      <TextField
        label="Vector Store Name"
        size="small"
        required
        value={localConfig.vectorStoreName ?? ''}
        onChange={e => onUpdate('vectorStoreName', e.target.value)}
        error={!nameValid}
        helperText={nameValid ? 'Unique name' : 'Name is required'}
        sx={{ minWidth: 0 }}
      />
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
        <Autocomplete
          freeSolo
          options={embeddingModels}
          value={localConfig.embeddingModel ?? ''}
          onInputChange={(_e, newValue) => onUpdate('embeddingModel', newValue)}
          getOptionLabel={opt => (typeof opt === 'string' ? opt : '')}
          loading={modelsLoading}
          renderOption={(props, option) => (
            <li {...props} key={option}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  width: '100%',
                }}
              >
                <Typography variant="body2" sx={{ flex: 1 }}>
                  {option}
                </Typography>
                {option === defaultEmbeddingModel && (
                  <Typography
                    variant="caption"
                    sx={{
                      color: 'success.main',
                      fontWeight: 600,
                      flexShrink: 0,
                    }}
                  >
                    default
                  </Typography>
                )}
              </Box>
            </li>
          )}
          renderInput={params => (
            <TextField
              {...params}
              label="Embedding Model"
              size="small"
              helperText={
                embeddingModels.length > 0
                  ? 'Select an embedding model or type a custom identifier'
                  : 'No embedding models found on server — type a model identifier'
              }
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {modelsLoading ? <CircularProgress size={16} /> : null}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
          sx={{ flex: 1 }}
        />
        <Tooltip title="Refresh model list">
          <IconButton
            size="small"
            onClick={onRefreshModels}
            disabled={modelsLoading}
            sx={{ mt: 0.5 }}
          >
            <RefreshIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
      <TextField
        label="Dimension"
        size="small"
        type="number"
        value={localConfig.embeddingDimension ?? ''}
        onChange={e => {
          const parsed = Number.parseInt(e.target.value, 10);
          if (Number.isFinite(parsed) && parsed > 0) {
            onUpdate('embeddingDimension', parsed);
          }
        }}
        error={
          localConfig.embeddingDimension !== undefined &&
          !Number.isFinite(localConfig.embeddingDimension)
        }
        helperText="384, 768, etc."
      />
    </Box>
  );
}
