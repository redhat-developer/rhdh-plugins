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
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import type { NodeConfigProps } from './types';

export function ToolNodeConfig({ nodeData, update }: NodeConfigProps) {
  return (
    <>
      <TextField
        variant="standard"
        label="Label"
        size="small"
        fullWidth
        value={(nodeData.label as string) || ''}
        onChange={e => update('label', e.target.value)}
        sx={{ mb: 1.5 }}
      />
      <FormControl variant="standard" size="small" fullWidth sx={{ mb: 1.5 }}>
        <InputLabel>Kind</InputLabel>
        <Select
          value={(nodeData.kind as string) || 'mcp_server'}
          label="Kind"
          onChange={e => update('kind', e.target.value)}
        >
          <MenuItem value="mcp_server">MCP Server</MenuItem>
          <MenuItem value="file_search">File Search</MenuItem>
          <MenuItem value="web_search">Web Search</MenuItem>
          <MenuItem value="code_interpreter">Code Interpreter</MenuItem>
          <MenuItem value="custom_function">Custom Function</MenuItem>
        </Select>
      </FormControl>
      {nodeData.kind === 'mcp_server' && (
        <TextField
          variant="standard"
          label="MCP Server ID"
          size="small"
          fullWidth
          value={(nodeData.mcpServerId as string) || ''}
          onChange={e => update('mcpServerId', e.target.value)}
          sx={{ mb: 1.5 }}
        />
      )}
    </>
  );
}
