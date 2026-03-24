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
import React, { useState, useMemo, useCallback } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Alert from '@mui/material/Alert';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Autocomplete from '@mui/material/Autocomplete';
import CircularProgress from '@mui/material/CircularProgress';
import Tooltip from '@mui/material/Tooltip';
import RefreshIcon from '@mui/icons-material/Refresh';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import EditNoteIcon from '@mui/icons-material/EditNote';
import { useTheme } from '@mui/material/styles';
import type { AgentFormData } from './agentValidation';

interface InstructionsTabProps {
  agent: AgentFormData;
  agents: Record<string, AgentFormData>;
  availableMcpServers: Array<{ id: string; name: string }>;
  modelOptions: string[];
  modelsLoading: boolean;
  effectiveModel: string;
  generating: boolean;
  generateError: string | null;
  onUpdateInstructions: (value: string) => void;
  onGenerate: (description: string, model: string | undefined) => Promise<void>;
  onRefreshModels: () => void;
}

export const InstructionsTab = React.memo(function InstructionsTab({
  agent,
  agents,
  availableMcpServers,
  modelOptions,
  modelsLoading,
  effectiveModel,
  generating,
  generateError,
  onUpdateInstructions,
  onGenerate,
  onRefreshModels,
}: InstructionsTabProps) {
  const theme = useTheme();
  const [mode, setMode] = useState<'write' | 'generate'>('write');
  const [description, setDescription] = useState('');
  const [model, setModel] = useState('');

  const configSummary = useMemo(() => {
    const caps: string[] = [];
    if (agent.model) caps.push(`Model: ${agent.model}`);
    if (agent.enableRAG) caps.push('Knowledge Base');
    if (agent.enableWebSearch) caps.push('Web Search');
    if (agent.enableCodeInterpreter) caps.push('Code Interpreter');
    agent.mcpServers.forEach(id => {
      caps.push(availableMcpServers.find(s => s.id === id)?.name || id);
    });
    agent.handoffs
      .filter(k => agents[k])
      .forEach(k => caps.push(`→ ${agents[k].name || k}`));
    agent.asTools
      .filter(k => agents[k])
      .forEach(k => caps.push(`⇢ ${agents[k].name || k}`));
    return caps;
  }, [agent, agents, availableMcpServers]);

  const handleGenerate = useCallback(async () => {
    if (!description.trim()) return;
    try {
      await onGenerate(description, model || undefined);
      setMode('write');
      setDescription('');
    } catch {
      // error surfaced via generateError prop
    }
  }, [description, model, onGenerate]);

  return (
    <Box>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs
          value={mode}
          onChange={(_, v) => setMode(v)}
          aria-label="Instructions input mode"
          sx={{
            minHeight: 32,
            '& .MuiTab-root': {
              minHeight: 32,
              textTransform: 'none',
              fontSize: '0.8125rem',
              px: 2,
              mr: 0.5,
            },
          }}
        >
          <Tab
            icon={<EditNoteIcon sx={{ fontSize: 18 }} />}
            iconPosition="start"
            label="Write"
            value="write"
          />
          <Tab
            icon={<AutoAwesomeIcon sx={{ fontSize: 18 }} />}
            iconPosition="start"
            label="Generate"
            value="generate"
          />
        </Tabs>
      </Box>

      {mode === 'write' && (
        <Box>
          <Typography
            variant="caption"
            sx={{
              display: 'block',
              mb: 1.5,
              color: theme.palette.text.secondary,
              fontSize: '0.75rem',
            }}
          >
            The complete prompt sent to the LLM for this agent. What you write
            here is exactly what the model receives.
          </Typography>
          <TextField
            label="Agent Instructions"
            value={agent.instructions}
            onChange={e => onUpdateInstructions(e.target.value)}
            fullWidth
            multiline
            minRows={6}
            maxRows={18}
            size="small"
            required
          />
        </Box>
      )}

      {mode === 'generate' && (
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Describe what this agent should do. Instructions will be generated
            based on the capabilities, connections, and tools you've configured.
          </Typography>

          <TextField
            fullWidth
            multiline
            minRows={3}
            maxRows={5}
            size="small"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="e.g. Help developers troubleshoot Kubernetes deployments, check pod logs, and suggest fixes..."
            disabled={generating}
            inputProps={{ maxLength: 2000 }}
            sx={{ mb: 2 }}
          />

          {configSummary.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography
                sx={{
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: theme.palette.text.secondary,
                  mb: 0.75,
                }}
              >
                Context included from configuration
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {configSummary.map((c, i) => (
                  <Chip
                    key={`${c}-${i}`}
                    label={c}
                    size="small"
                    variant="outlined"
                    sx={{ fontSize: '0.7rem' }}
                  />
                ))}
              </Box>
            </Box>
          )}

          <Box
            sx={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 1.5,
              flexWrap: 'wrap',
              mb: 0.5,
            }}
          >
            <Box
              sx={{
                flex: 1,
                minWidth: 200,
                maxWidth: 320,
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
              }}
            >
              <Autocomplete
                freeSolo
                size="small"
                options={modelOptions}
                value={model}
                onInputChange={(_e, v) => setModel(v)}
                getOptionLabel={opt => (typeof opt === 'string' ? opt : '')}
                loading={modelsLoading}
                disabled={generating}
                renderInput={params => (
                  <TextField
                    {...params}
                    label="Model for generation"
                    placeholder={effectiveModel || 'Default model'}
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {modelsLoading ? (
                            <CircularProgress size={16} />
                          ) : null}
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
                >
                  <RefreshIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                pt: 0.25,
              }}
            >
              <Button
                variant="contained"
                size="small"
                startIcon={
                  generating ? (
                    <CircularProgress size={16} color="inherit" />
                  ) : (
                    <AutoAwesomeIcon />
                  )
                }
                onClick={handleGenerate}
                disabled={generating || !description.trim()}
                sx={{ textTransform: 'none', whiteSpace: 'nowrap' }}
              >
                {generating ? 'Generating...' : 'Generate Instructions'}
              </Button>
              <Typography variant="caption" color="text.secondary">
                {description.length}/2000
              </Typography>
            </Box>
          </Box>

          {generateError && (
            <Alert severity="error" sx={{ mt: 1.5 }} variant="outlined">
              {generateError}
            </Alert>
          )}
        </Box>
      )}
    </Box>
  );
});
