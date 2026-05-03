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
import React, { useMemo } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Alert from '@mui/material/Alert';
import { ToggleSwitch } from '../shared/ToggleSwitch';
import FormControlLabel from '@mui/material/FormControlLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import Autocomplete from '@mui/material/Autocomplete';
import CircularProgress from '@mui/material/CircularProgress';
import Tooltip from '@mui/material/Tooltip';
import RefreshIcon from '@mui/icons-material/Refresh';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import DnsIcon from '@mui/icons-material/Dns';
import { useTheme } from '@mui/material/styles';
import { SELECT_MENU_PROPS } from '../shared/selectMenuProps';
import { SECTION_LABEL_SX } from '../shared/commandCenterStyles';
import type { AgentFormData } from './agentValidation';

interface VectorStore {
  id: string;
  name?: string;
}

interface CapabilitiesTabProps {
  agent: AgentFormData;
  agentKey: string;
  modelOptions: string[];
  modelsLoading: boolean;
  availableMcpServers: { id: string; name: string }[];
  vectorStores: VectorStore[];
  onUpdateAgent: (key: string, field: keyof AgentFormData, value: unknown) => void;
  onRefreshModels: () => void;
}

export const CapabilitiesTab = React.memo(function CapabilitiesTab({
  agent,
  agentKey,
  modelOptions,
  modelsLoading,
  availableMcpServers,
  vectorStores,
  onUpdateAgent,
  onRefreshModels,
}: CapabilitiesTabProps) {
  const theme = useTheme();

  const staleMcpIds = useMemo(() => {
    const availableIds = new Set(availableMcpServers.map(s => s.id));
    return agent.mcpServers.filter(id => !availableIds.has(id));
  }, [agent.mcpServers, availableMcpServers]);

  const cleanMcpSelection = () => {
    const availableIds = new Set(availableMcpServers.map(s => s.id));
    onUpdateAgent(agentKey, 'mcpServers', agent.mcpServers.filter(id => availableIds.has(id)));
  };

  return (
    <Box data-tour="orch-capabilities">
      {/* Model Override */}
      <Typography sx={SECTION_LABEL_SX}>Model</Typography>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5, mt: 1, mb: 3 }}>
        <Autocomplete
          freeSolo
          options={modelOptions}
          value={agent.model || ''}
          onInputChange={(_e, newValue) => onUpdateAgent(agentKey, 'model', newValue)}
          getOptionLabel={opt => typeof opt === 'string' ? opt : ''}
          loading={modelsLoading}
          renderInput={params => (
            <TextField
              {...params}
              label="Model Override"
              size="small"
              placeholder="Leave empty for global model"
              helperText="Select from available models or leave empty for global default"
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
          sx={{ flex: 1, maxWidth: 480 }}
        />
        <Tooltip title="Refresh model list">
          <IconButton size="small" onClick={onRefreshModels} disabled={modelsLoading} sx={{ mt: 0.5 }}>
            <RefreshIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      {/* MCP Servers */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
        <DnsIcon sx={{ fontSize: 16, color: theme.palette.text.secondary }} />
        <Typography sx={SECTION_LABEL_SX}>MCP Servers</Typography>
      </Box>
      <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontSize: '0.75rem', mb: 1.5 }}>
        Select which MCP tool servers this agent can access. Servers are configured in Platform Config.
      </Typography>

      {availableMcpServers.length > 0 ? (
        <Box sx={{ mb: 1 }}>
          <FormControl size="small" fullWidth sx={{ maxWidth: 480 }}>
            <InputLabel>MCP Servers</InputLabel>
            <Select
              multiple
              value={agent.mcpServers.filter(id => availableMcpServers.some(s => s.id === id))}
              label="MCP Servers"
              onChange={e => onUpdateAgent(agentKey, 'mcpServers', e.target.value as string[])}
              MenuProps={SELECT_MENU_PROPS}
              renderValue={vals => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {(vals as string[]).map(v => (
                    <Chip
                      key={v}
                      label={availableMcpServers.find(s => s.id === v)?.name || v}
                      size="small"
                      sx={{ height: 22, fontSize: '0.75rem' }}
                    />
                  ))}
                </Box>
              )}
            >
              {availableMcpServers.map(s => (
                <MenuItem key={s.id} value={s.id}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography sx={{ fontSize: '0.85rem' }}>{s.name}</Typography>
                    {s.name !== s.id && (
                      <Typography sx={{ fontSize: '0.7rem', color: theme.palette.text.disabled, fontFamily: 'monospace' }}>
                        {s.id}
                      </Typography>
                    )}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {agent.mcpServers.length === 0 && (
            <Typography sx={{ fontSize: '0.7rem', color: theme.palette.text.secondary, mt: 0.5, ml: 0.5 }}>
              No servers selected — agent will not have access to external MCP tools
            </Typography>
          )}
          {staleMcpIds.length > 0 && (
            <Alert
              severity="warning"
              icon={<WarningAmberIcon sx={{ fontSize: 16 }} />}
              action={
                <Chip
                  label="Remove invalid"
                  size="small"
                  onClick={cleanMcpSelection}
                  sx={{ fontSize: '0.7rem', cursor: 'pointer' }}
                />
              }
              sx={{ mt: 1, py: 0.25, fontSize: '0.75rem' }}
            >
              {staleMcpIds.length === 1
                ? `Server "${staleMcpIds[0]}" is no longer available in Platform Config.`
                : `${staleMcpIds.length} servers are no longer available: ${staleMcpIds.join(', ')}`}
            </Alert>
          )}
        </Box>
      ) : (
        <Alert
          severity="info"
          variant="outlined"
          sx={{ mb: 2, fontSize: '0.8rem' }}
        >
          No MCP servers configured yet. Add servers in <strong>Platform Config → Model & Tools</strong> to
          enable external tool access for this agent.
        </Alert>
      )}

      {/* Built-in Tools */}
      <Typography sx={{ ...SECTION_LABEL_SX, mt: 2.5 }}>Built-in Tools</Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1.5 }}>
        <FormControlLabel
          control={<ToggleSwitch checked={agent.enableRAG} onChange={e => onUpdateAgent(agentKey, 'enableRAG', e.target.checked)} />}
          label={
            <Box>
              <Typography sx={{ fontSize: '0.8rem' }}>Knowledge Base</Typography>
              <Typography sx={{ fontSize: '0.7rem', color: theme.palette.text.secondary }}>Search uploaded documents for context</Typography>
            </Box>
          }
        />
        {agent.enableRAG && vectorStores.length > 0 && (
          <FormControl size="small" sx={{ ml: 4, mt: 0.5, mb: 0.5 }}>
            <InputLabel sx={{ fontSize: '0.8rem' }} id={`vs-label-${agentKey}`}>Vector Stores</InputLabel>
            <Select
              multiple
              labelId={`vs-label-${agentKey}`}
              value={agent.vectorStoreIds}
              label="Vector Stores"
              onChange={e => onUpdateAgent(agentKey, 'vectorStoreIds', e.target.value as string[])}
              MenuProps={SELECT_MENU_PROPS}
              renderValue={vals => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {(vals as string[]).map(v => (<Chip key={v} label={vectorStores.find(s => s.id === v)?.name || v} size="small" sx={{ height: 22, fontSize: '0.75rem' }} />))}
                </Box>
              )}
            >
              {vectorStores.map(s => (<MenuItem key={s.id} value={s.id}>{s.name || s.id}</MenuItem>))}
            </Select>
            <Typography sx={{ fontSize: '0.65rem', color: theme.palette.text.secondary, mt: 0.5, ml: 0.5 }}>
              Leave empty to use global vector stores
            </Typography>
          </FormControl>
        )}
        <FormControlLabel
          control={<ToggleSwitch checked={agent.enableWebSearch} onChange={e => onUpdateAgent(agentKey, 'enableWebSearch', e.target.checked)} />}
          label={
            <Box>
              <Typography sx={{ fontSize: '0.8rem' }}>Web Search</Typography>
              <Typography sx={{ fontSize: '0.7rem', color: theme.palette.text.secondary }}>Search the web for current information</Typography>
            </Box>
          }
        />
        <FormControlLabel
          control={<ToggleSwitch checked={agent.enableCodeInterpreter} onChange={e => onUpdateAgent(agentKey, 'enableCodeInterpreter', e.target.checked)} />}
          label={
            <Box>
              <Typography sx={{ fontSize: '0.8rem' }}>Code Interpreter</Typography>
              <Typography sx={{ fontSize: '0.7rem', color: theme.palette.text.secondary }}>Execute code to answer questions</Typography>
            </Box>
          }
        />
      </Box>
    </Box>
  );
});
