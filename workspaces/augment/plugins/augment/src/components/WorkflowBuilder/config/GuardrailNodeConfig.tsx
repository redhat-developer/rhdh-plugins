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

export function GuardrailNodeConfig({ nodeData, update }: NodeConfigProps) {
  return (
    <>
      <FormControl variant="standard" size="small" fullWidth sx={{ mb: 1.5 }}>
        <InputLabel>Guard Type</InputLabel>
        <Select
          value={(nodeData.guardType as string) || 'input'}
          label="Guard Type"
          onChange={e => update('guardType', e.target.value)}
        >
          <MenuItem value="input">Input</MenuItem>
          <MenuItem value="output">Output</MenuItem>
        </Select>
      </FormControl>
      <FormControl variant="standard" size="small" fullWidth sx={{ mb: 1.5 }}>
        <InputLabel>On Failure</InputLabel>
        <Select
          value={(nodeData.onFailure as string) || 'block'}
          label="On Failure"
          onChange={e => update('onFailure', e.target.value)}
        >
          <MenuItem value="block">Block</MenuItem>
          <MenuItem value="warn">Warn</MenuItem>
          <MenuItem value="fallback">Fallback</MenuItem>
        </Select>
      </FormControl>
      {nodeData.onFailure === 'fallback' && (
        <TextField
          variant="standard"
          label="Fallback Message"
          size="small"
          fullWidth
          multiline
          minRows={2}
          value={(nodeData.fallbackMessage as string) || ''}
          onChange={e => update('fallbackMessage', e.target.value)}
          sx={{ mb: 1.5 }}
        />
      )}
    </>
  );
}
