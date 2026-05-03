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
import React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import CircularProgress from '@mui/material/CircularProgress';
import Tooltip from '@mui/material/Tooltip';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { useTheme } from '@mui/material/styles';
import { SELECT_MENU_PROPS } from '../shared/selectMenuProps';
import type { AgentFormData } from './agentValidation';
import { MIN_TURNS, MAX_TURNS } from './useAgentEditor';

interface AgentEditorToolbarProps {
  agents: Record<string, AgentFormData>;
  agentKeys: string[];
  defaultAgentKey: string;
  maxTurns: number;
  agentsSource: string;
  agentsSaving: boolean;
  resetting: boolean;
  saving: boolean;
  saveSuccess: boolean;
  validationErrors: string[];
  onSetDefaultAgentKey: (key: string) => void;
  onSetMaxTurns: (turns: number) => void;
  onReset: () => void;
  onNewAgent: () => void;
  onSave: () => void;
}

export const AgentEditorToolbar = React.memo(function AgentEditorToolbar({
  agents,
  agentKeys,
  defaultAgentKey,
  maxTurns,
  agentsSource,
  agentsSaving,
  resetting,
  saving,
  saveSuccess,
  validationErrors,
  onSetDefaultAgentKey,
  onSetMaxTurns,
  onReset,
  onNewAgent,
  onSave,
}: AgentEditorToolbarProps) {
  const theme = useTheme();

  return (
    <Box
      data-tour="orch-toolbar"
      sx={{
        px: 2,
        py: 1,
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        borderBottom: `1px solid ${theme.palette.divider}`,
        flexShrink: 0,
        flexWrap: 'wrap',
      }}
    >
      {agentKeys.length > 1 && (
        <>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel sx={{ fontSize: '0.8rem' }}>Starting Agent</InputLabel>
            <Select
              value={defaultAgentKey}
              label="Starting Agent"
              onChange={e => onSetDefaultAgentKey(e.target.value)}
              sx={{ fontSize: '0.8rem' }}
              MenuProps={SELECT_MENU_PROPS}
            >
              {agentKeys.map(k => (
                <MenuItem key={k} value={k} sx={{ fontSize: '0.8rem' }}>{agents[k].name || k}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            size="small"
            type="number"
            label="Max Turns"
            value={maxTurns}
            onChange={e =>
              onSetMaxTurns(Math.max(MIN_TURNS, parseInt(e.target.value, 10) || MIN_TURNS))
            }
            inputProps={{ min: MIN_TURNS, max: MAX_TURNS }}
            sx={{ width: 85, '& input': { fontSize: '0.8rem' } }}
          />
        </>
      )}

      <Box sx={{ flex: 1 }} />

      {agentsSource === 'database' && (
        <Button
          size="small"
          color="warning"
          onClick={onReset}
          disabled={agentsSaving || resetting}
          sx={{ textTransform: 'none', fontSize: '0.75rem' }}
        >
          Reset
        </Button>
      )}
      <Button
        variant="outlined"
        size="small"
        startIcon={<AddIcon sx={{ fontSize: 16 }} />}
        onClick={onNewAgent}
        sx={{ textTransform: 'none', fontSize: '0.8rem' }}
      >
        New Agent
      </Button>
      <Tooltip
        title={
          validationErrors.length > 0
            ? `Fix errors before saving: ${validationErrors[0]}`
            : ''
        }
      >
        <span>
          <Button
            variant="contained"
            size="small"
            startIcon={
              saving ? (
                <CircularProgress size={14} />
              ) : saveSuccess ? (
                <CheckCircleOutlineIcon sx={{ fontSize: 16 }} />
              ) : (
                <SaveIcon sx={{ fontSize: 16 }} />
              )
            }
            onClick={onSave}
            disabled={saving || validationErrors.length > 0 || agentKeys.length === 0}
            color={saveSuccess ? 'success' : 'primary'}
            sx={{ textTransform: 'none', minWidth: 68, fontWeight: 600 }}
          >
            {saveSuccess ? 'Saved' : 'Save'}
          </Button>
        </span>
      </Tooltip>
    </Box>
  );
});
