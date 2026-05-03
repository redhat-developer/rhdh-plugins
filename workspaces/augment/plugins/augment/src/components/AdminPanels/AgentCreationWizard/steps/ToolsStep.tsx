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
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import Chip from '@mui/material/Chip';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import type { AgentWizardFormData } from '../types';

interface ToolsStepProps {
  formData: AgentWizardFormData;
  updateField: <K extends keyof AgentWizardFormData>(
    field: K,
    value: AgentWizardFormData[K],
  ) => void;
  availableMcpServers: Array<{ id: string; name?: string }>;
  availableVectorStores: Array<{ id: string; name?: string }>;
}

export function ToolsStep({
  formData,
  updateField,
  availableMcpServers,
  availableVectorStores,
}: ToolsStepProps) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Typography variant="h6" gutterBottom>
        Tools and Capabilities
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        Configure what tools and capabilities this agent has access to.
      </Typography>

      <Box>
        <Typography variant="subtitle2" gutterBottom>
          MCP Servers
        </Typography>
        <Autocomplete
          multiple
          options={availableMcpServers.map(s => s.id)}
          value={formData.mcpServers}
          onChange={(_, value) => updateField('mcpServers', value)}
          renderTags={(value, getTagProps) =>
            value.map((option, index) => {
              const { key, ...rest } = getTagProps({ index });
              return (
                <Chip key={key} label={option} size="small" {...rest} />
              );
            })
          }
          renderInput={params => (
            <TextField
              {...params}
              placeholder="Select MCP servers..."
              helperText="MCP servers provide tools the agent can use"
            />
          )}
        />
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Typography variant="subtitle2">Built-in Capabilities</Typography>

        <FormControlLabel
          control={
            <Switch
              checked={formData.enableRAG}
              onChange={e => updateField('enableRAG', e.target.checked)}
            />
          }
          label={
            <Box>
              <Typography variant="body2">Knowledge Base (RAG)</Typography>
              <Typography variant="caption" color="text.secondary">
                Search uploaded documents to ground responses in your data
              </Typography>
            </Box>
          }
        />

        {formData.enableRAG && availableVectorStores.length > 0 && (
          <Autocomplete
            multiple
            options={availableVectorStores.map(v => v.id)}
            value={formData.vectorStoreIds}
            onChange={(_, value) => updateField('vectorStoreIds', value)}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => {
                const { key, ...rest } = getTagProps({ index });
                return (
                  <Chip key={key} label={option} size="small" {...rest} />
                );
              })
            }
            renderInput={params => (
              <TextField
                {...params}
                placeholder="Select vector stores..."
                helperText="Choose which knowledge bases this agent can search"
                size="small"
              />
            )}
            sx={{ ml: 6 }}
          />
        )}

        <FormControlLabel
          control={
            <Switch
              checked={formData.enableWebSearch}
              onChange={e => updateField('enableWebSearch', e.target.checked)}
            />
          }
          label={
            <Box>
              <Typography variant="body2">Web Search</Typography>
              <Typography variant="caption" color="text.secondary">
                Allow the agent to search the web for current information
              </Typography>
            </Box>
          }
        />

        <FormControlLabel
          control={
            <Switch
              checked={formData.enableCodeInterpreter}
              onChange={e =>
                updateField('enableCodeInterpreter', e.target.checked)
              }
            />
          }
          label={
            <Box>
              <Typography variant="body2">Code Interpreter</Typography>
              <Typography variant="caption" color="text.secondary">
                Execute code to perform calculations and data analysis
              </Typography>
            </Box>
          }
        />
      </Box>
    </Box>
  );
}
