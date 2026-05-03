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
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import { useTheme } from '@mui/material/styles';
import { ToggleSwitch } from '../shared/ToggleSwitch';
import { SELECT_MENU_PROPS } from '../shared/selectMenuProps';
import { FieldHelpButton } from './FieldHelpPopover';
import type { AgentFormData } from './agentValidation';

interface AdvancedTabProps {
  agent: AgentFormData;
  agentKey: string;
  onUpdateAgent: (key: string, field: keyof AgentFormData, value: unknown) => void;
}

export const AdvancedTab = React.memo(function AdvancedTab({
  agent,
  agentKey,
  onUpdateAgent,
}: AdvancedTabProps) {
  const theme = useTheme();

  return (
    <Box data-tour="orch-advanced">
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 2 }}>
        <FormControl fullWidth size="small">
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <InputLabel>Tool Choice</InputLabel>
            <FieldHelpButton field="toolChoice" />
          </Box>
          <Select
            value={agent.toolChoice ?? ''}
            label="Tool Choice"
            onChange={e => onUpdateAgent(agentKey, 'toolChoice', (e.target.value as string) || undefined)}
            MenuProps={SELECT_MENU_PROPS}
          >
            <MenuItem value=""><Box><Typography variant="body2" sx={{ fontWeight: 500 }}><em>Default</em></Typography><Typography variant="caption" color="text.secondary">Inherit from platform settings</Typography></Box></MenuItem>
            <MenuItem value="auto"><Box><Typography variant="body2" sx={{ fontWeight: 500 }}>auto</Typography><Typography variant="caption" color="text.secondary">Model decides when to call tools</Typography></Box></MenuItem>
            <MenuItem value="required"><Box><Typography variant="body2" sx={{ fontWeight: 500 }}>required</Typography><Typography variant="caption" color="text.secondary">Always call tools</Typography></Box></MenuItem>
            <MenuItem value="none"><Box><Typography variant="body2" sx={{ fontWeight: 500 }}>none</Typography><Typography variant="caption" color="text.secondary">Never call tools</Typography></Box></MenuItem>
          </Select>
        </FormControl>
        <FormControl fullWidth size="small">
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <InputLabel>Reasoning</InputLabel>
            <FieldHelpButton field="reasoning" />
          </Box>
          <Select
            value={agent.reasoning?.effort ?? ''}
            label="Reasoning"
            onChange={e => {
              const v = e.target.value as string;
              onUpdateAgent(agentKey, 'reasoning', v ? { effort: v as 'low' | 'medium' | 'high' } : undefined);
            }}
            MenuProps={SELECT_MENU_PROPS}
          >
            <MenuItem value=""><em>Default</em></MenuItem>
            <MenuItem value="low">Low</MenuItem>
            <MenuItem value="medium">Medium</MenuItem>
            <MenuItem value="high">High</MenuItem>
          </Select>
        </FormControl>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
            <FieldHelpButton field="temperature" />
          </Box>
          <TextField
            size="small"
            type="number"
            label="Temperature"
            value={agent.temperature ?? ''}
            fullWidth
            onChange={e => {
              const v = parseFloat(e.target.value);
              onUpdateAgent(agentKey, 'temperature', e.target.value === '' || isNaN(v) ? undefined : v);
            }}
            inputProps={{ min: 0, max: 2, step: 0.1 }}
          />
        </Box>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
            <FieldHelpButton field="maxOutputTokens" />
          </Box>
          <TextField
            size="small"
            type="number"
            label="Max Output Tokens"
            value={agent.maxOutputTokens ?? ''}
            fullWidth
            onChange={e => {
              const v = parseInt(e.target.value, 10);
              onUpdateAgent(agentKey, 'maxOutputTokens', e.target.value === '' || isNaN(v) ? undefined : v);
            }}
            inputProps={{ min: 1 }}
          />
        </Box>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
            <FieldHelpButton field="maxToolCalls" />
          </Box>
          <TextField
            size="small"
            type="number"
            label="Max Tool Calls"
            value={agent.maxToolCalls ?? ''}
            fullWidth
            onChange={e => {
              const v = parseInt(e.target.value, 10);
              onUpdateAgent(agentKey, 'maxToolCalls', e.target.value === '' || isNaN(v) ? undefined : v);
            }}
            inputProps={{ min: 1 }}
          />
        </Box>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
            <FieldHelpButton field="guardrails" />
          </Box>
          <TextField
            size="small"
            label="Guardrails"
            value={(agent.guardrails ?? []).join(', ')}
            fullWidth
            onChange={e => {
              const v = e.target.value;
              onUpdateAgent(agentKey, 'guardrails', v ? v.split(',').map(s => s.trim()).filter(Boolean) : undefined);
            }}
            placeholder="shield-id-1, shield-id-2"
          />
        </Box>
      </Box>
      <Box sx={{ display: 'flex', gap: 3, mt: 2.5 }}>
        <FormControlLabel
          control={<ToggleSwitch checked={agent.resetToolChoice ?? false} onChange={e => onUpdateAgent(agentKey, 'resetToolChoice', e.target.checked || undefined)} />}
          label={
            <Box>
              <Typography sx={{ fontSize: '0.8rem' }}>Reset Tool Choice After Use</Typography>
              <Typography sx={{ fontSize: '0.7rem', color: theme.palette.text.secondary }}>After a tool call, reset to &quot;auto&quot;</Typography>
            </Box>
          }
        />
        <FormControlLabel
          control={<ToggleSwitch checked={agent.nestHandoffHistory ?? false} onChange={e => onUpdateAgent(agentKey, 'nestHandoffHistory', e.target.checked || undefined)} />}
          label={
            <Box>
              <Typography sx={{ fontSize: '0.8rem' }}>Summarize History on Handoff</Typography>
              <Typography sx={{ fontSize: '0.7rem', color: theme.palette.text.secondary }}>Compress conversation on transfer</Typography>
            </Box>
          }
        />
      </Box>
    </Box>
  );
});
