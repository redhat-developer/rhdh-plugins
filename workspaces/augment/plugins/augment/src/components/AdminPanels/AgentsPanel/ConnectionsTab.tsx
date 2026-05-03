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
import Chip from '@mui/material/Chip';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import { useTheme } from '@mui/material/styles';
import { SELECT_MENU_PROPS } from '../shared/selectMenuProps';
import type { AgentFormData, PublishAsRole } from './agentValidation';
import { TopologyGraph, type TopologyEdge } from './TopologyGraph';

interface ConnectionsTabProps {
  agents: Record<string, AgentFormData>;
  agentKeys: string[];
  selectedAgentKey: string;
  selectedAgent: AgentFormData;
  topologyEdges: TopologyEdge[];
  agentRoles: Record<string, PublishAsRole>;
  onUpdateAgent: (key: string, field: keyof AgentFormData, value: unknown) => void;
  onSelectAgent: (key: string) => void;
}

export const ConnectionsTab = React.memo(function ConnectionsTab({
  agents,
  agentKeys,
  selectedAgentKey,
  selectedAgent,
  topologyEdges,
  agentRoles,
  onUpdateAgent,
  onSelectAgent,
}: ConnectionsTabProps) {
  const theme = useTheme();

  if (agentKeys.length <= 1) {
    return (
      <Box data-tour="orch-connections" sx={{ py: 4, textAlign: 'center' }}>
        <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 1 }}>
          No other agents to connect to yet.
        </Typography>
        <Typography variant="caption" sx={{ color: theme.palette.text.disabled, lineHeight: 1.6 }}>
          Create additional agents to enable handoffs (transfer conversation control) and delegation (run as sub-tasks).
        </Typography>
      </Box>
    );
  }

  return (
    <Box data-tour="orch-connections">
      <FormControl fullWidth size="small" sx={{ mb: 0.5 }}>
        <InputLabel>Can Transfer To</InputLabel>
        <Select
          multiple
          value={selectedAgent.handoffs}
          label="Can Transfer To"
          onChange={e => onUpdateAgent(selectedAgentKey, 'handoffs', e.target.value as string[])}
          MenuProps={SELECT_MENU_PROPS}
          renderValue={vals => (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {(vals as string[]).map(v => (<Chip key={v} label={agents[v]?.name || v} size="small" sx={{ height: 22, fontSize: '0.75rem' }} />))}
            </Box>
          )}
        >
          {agentKeys.filter(k => k !== selectedAgentKey).map(k => (<MenuItem key={k} value={k}>{agents[k].name || k}</MenuItem>))}
        </Select>
      </FormControl>
      <Typography variant="caption" sx={{ display: 'block', mb: 2.5, color: theme.palette.text.secondary, fontSize: '0.7rem' }}>
        Target agent takes over the conversation. This agent stops responding.
      </Typography>

      <FormControl fullWidth size="small" sx={{ mb: 0.5 }}>
        <InputLabel>Can Delegate To</InputLabel>
        <Select
          multiple
          value={selectedAgent.asTools}
          label="Can Delegate To"
          onChange={e => onUpdateAgent(selectedAgentKey, 'asTools', e.target.value as string[])}
          MenuProps={SELECT_MENU_PROPS}
          renderValue={vals => (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {(vals as string[]).map(v => (<Chip key={v} label={agents[v]?.name || v} size="small" sx={{ height: 22, fontSize: '0.75rem' }} />))}
            </Box>
          )}
        >
          {agentKeys.filter(k => k !== selectedAgentKey).map(k => (<MenuItem key={k} value={k}>{agents[k].name || k}</MenuItem>))}
        </Select>
      </FormControl>
      <Typography variant="caption" sx={{ display: 'block', mb: 2.5, color: theme.palette.text.secondary, fontSize: '0.7rem' }}>
        Sub-agent runs in the background and returns results. This agent stays in control.
      </Typography>

      <TopologyGraph
        agents={agents}
        edges={topologyEdges}
        agentRoles={agentRoles}
        selectedAgentKey={selectedAgentKey}
        onSelectAgent={onSelectAgent}
      />
    </Box>
  );
});
