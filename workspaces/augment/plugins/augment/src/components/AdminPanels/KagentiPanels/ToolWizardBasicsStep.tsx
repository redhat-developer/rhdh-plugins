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
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';

interface ToolWizardBasicsStepProps {
  name: string;
  setName: (v: string) => void;
  namespace: string;
  setNamespace: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  protocol: string;
  setProtocol: (v: string) => void;
  framework: string;
  setFramework: (v: string) => void;
  nameError: string | undefined;
  availableNamespaces: string[];
}

export const ToolWizardBasicsStep: FC<ToolWizardBasicsStepProps> = ({
  name,
  setName,
  namespace,
  setNamespace,
  description,
  setDescription,
  protocol,
  setProtocol,
  framework,
  setFramework,
  nameError,
  availableNamespaces,
}) => (
  <Stack spacing={2}>
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
    {availableNamespaces.length > 0 ? (
      <FormControl size="small" fullWidth required>
        <InputLabel>Namespace</InputLabel>
        <Select
          label="Namespace"
          value={namespace}
          onChange={e => setNamespace(e.target.value)}
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
        helperText="Target Kubernetes namespace for the tool."
      />
    )}
    <TextField
      label="Description"
      value={description}
      onChange={e => setDescription(e.target.value)}
      fullWidth
      multiline
      minRows={3}
      size="small"
      helperText="Describe what this MCP tool does."
    />
    <FormControl size="small" fullWidth>
      <InputLabel>Protocol</InputLabel>
      <Select
        label="Protocol"
        value={protocol}
        onChange={e => setProtocol(e.target.value)}
      >
        <MenuItem value="streamable_http">Streamable HTTP</MenuItem>
        <MenuItem value="mcp">MCP</MenuItem>
        <MenuItem value="http">HTTP</MenuItem>
        <MenuItem value="grpc">gRPC</MenuItem>
      </Select>
    </FormControl>
    <FormControl size="small" fullWidth>
      <InputLabel>Framework</InputLabel>
      <Select
        label="Framework"
        value={framework}
        onChange={e => setFramework(e.target.value)}
      >
        <MenuItem value="Python">Python</MenuItem>
        <MenuItem value="nodejs">Node.js</MenuItem>
        <MenuItem value="">Other</MenuItem>
      </Select>
    </FormControl>
  </Stack>
);
