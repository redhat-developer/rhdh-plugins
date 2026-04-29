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

import type { FC } from 'react';
import Box from '@mui/material/Box';
import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import { SELECT_MENU_PROPS } from '../shared/selectMenuProps';

interface AgentWizardBasicsStepProps {
  name: string;
  setName: (v: string) => void;
  namespace: string;
  setNamespace: (v: string) => void;
  protocol: string;
  setProtocol: (v: string) => void;
  framework: string;
  setFramework: (v: string) => void;
  nameError: string | undefined;
  availableNamespaces: string[];
}

export const AgentWizardBasicsStep: FC<AgentWizardBasicsStepProps> = ({
  name,
  setName,
  namespace,
  setNamespace,
  protocol,
  setProtocol,
  framework,
  setFramework,
  nameError,
  availableNamespaces,
}) => (
  <Stack spacing={2}>
    <Box data-tour="agent-name">
      <TextField
        label="Name"
        value={name}
        onChange={e => setName(e.target.value)}
        fullWidth
        required
        size="small"
        error={!!nameError}
        helperText={
          nameError ?? 'Lowercase alphanumeric and hyphens (max 63 chars).'
        }
      />
    </Box>
    {availableNamespaces.length > 0 ? (
      <FormControl size="small" fullWidth required>
        <InputLabel>Namespace</InputLabel>
        <Select
          label="Namespace"
          value={namespace}
          onChange={e => setNamespace(e.target.value)}
          MenuProps={SELECT_MENU_PROPS}
        >
          {availableNamespaces.map(ns => (
            <MenuItem key={ns} value={ns}>
              {ns}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    ) : (
      <TextField
        label="Namespace"
        value={namespace}
        onChange={e => setNamespace(e.target.value)}
        fullWidth
        required
        size="small"
        helperText="Target Kubernetes namespace for the agent."
      />
    )}
    <FormControl size="small" fullWidth data-tour="agent-protocol">
      <InputLabel>Protocol</InputLabel>
      <Select
        label="Protocol"
        value={protocol}
        onChange={e => setProtocol(e.target.value)}
        MenuProps={SELECT_MENU_PROPS}
      >
        <MenuItem value="a2a">A2A</MenuItem>
        <MenuItem value="mcp">MCP</MenuItem>
        <MenuItem value="http">HTTP</MenuItem>
      </Select>
      <FormHelperText>
        A2A = Agent-to-Agent. MCP = Model Context Protocol. HTTP = standard
        REST.
      </FormHelperText>
    </FormControl>
    <FormControl size="small" fullWidth>
      <InputLabel>Framework</InputLabel>
      <Select
        label="Framework"
        value={framework}
        onChange={e => setFramework(e.target.value)}
        MenuProps={SELECT_MENU_PROPS}
      >
        <MenuItem value="LangGraph">LangGraph</MenuItem>
        <MenuItem value="CrewAI">CrewAI</MenuItem>
        <MenuItem value="ADK">Google ADK</MenuItem>
        <MenuItem value="LlamaIndex">LlamaIndex</MenuItem>
        <MenuItem value="Semantic Kernel">Semantic Kernel</MenuItem>
        <MenuItem value="Autogen">Autogen</MenuItem>
        <MenuItem value="custom">Custom</MenuItem>
      </Select>
      <FormHelperText>
        Agent framework. Defaults to LangGraph if omitted.
      </FormHelperText>
    </FormControl>
  </Stack>
);
