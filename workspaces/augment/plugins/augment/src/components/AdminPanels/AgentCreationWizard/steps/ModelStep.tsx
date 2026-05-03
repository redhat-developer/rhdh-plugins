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
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Autocomplete from '@mui/material/Autocomplete';
import Slider from '@mui/material/Slider';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import type { AgentWizardFormData } from '../types';

interface ModelStepProps {
  formData: AgentWizardFormData;
  updateField: <K extends keyof AgentWizardFormData>(
    field: K,
    value: AgentWizardFormData[K],
  ) => void;
  getFieldError: (field: string) => string | undefined;
  availableModels: Array<{ id: string; owned_by?: string }>;
  loadingModels: boolean;
}

export function ModelStep({
  formData,
  updateField,
  getFieldError,
  availableModels,
  loadingModels,
}: ModelStepProps) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Typography variant="h6" gutterBottom>
        Model Configuration
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        Choose the LLM and tune its behavior for this agent.
      </Typography>

      <Autocomplete
        options={availableModels.map(m => m.id)}
        value={formData.model || null}
        onChange={(_, value) => updateField('model', value ?? '')}
        loading={loadingModels}
        freeSolo
        renderInput={params => (
          <TextField
            {...params}
            label="Model"
            required
            error={!!getFieldError('model')}
            helperText={
              getFieldError('model') ||
              'Select from available LlamaStack models or enter a custom model ID'
            }
            placeholder="Select or type a model name..."
          />
        )}
      />

      <Box>
        <Typography variant="subtitle2" gutterBottom>
          Temperature: {formData.temperature.toFixed(2)}
        </Typography>
        <Slider
          value={formData.temperature}
          onChange={(_, value) => updateField('temperature', value as number)}
          min={0}
          max={2}
          step={0.05}
          marks={[
            { value: 0, label: '0' },
            { value: 0.7, label: '0.7' },
            { value: 1, label: '1' },
            { value: 2, label: '2' },
          ]}
          valueLabelDisplay="auto"
          sx={{ maxWidth: 500 }}
        />
        <Typography variant="caption" color="text.secondary">
          Lower values make output more deterministic; higher values more creative
        </Typography>
      </Box>

      <TextField
        label="Max Output Tokens"
        type="number"
        value={formData.maxOutputTokens}
        onChange={e =>
          updateField('maxOutputTokens', parseInt(e.target.value, 10) || 4096)
        }
        helperText="Maximum number of tokens the model can generate per response"
        inputProps={{ min: 1, max: 128000 }}
        sx={{ maxWidth: 300 }}
      />

      <Box>
        <Typography variant="subtitle2" gutterBottom>
          Tool Choice Strategy
        </Typography>
        <ToggleButtonGroup
          value={formData.toolChoice}
          exclusive
          onChange={(_, value) => {
            if (value) updateField('toolChoice', value);
          }}
          size="small"
        >
          <ToggleButton value="auto" sx={{ textTransform: 'none' }}>
            Auto
          </ToggleButton>
          <ToggleButton value="required" sx={{ textTransform: 'none' }}>
            Required
          </ToggleButton>
          <ToggleButton value="none" sx={{ textTransform: 'none' }}>
            None
          </ToggleButton>
        </ToggleButtonGroup>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
          Auto: model decides; Required: must use a tool; None: no tool use
        </Typography>
      </Box>

      <Box>
        <Typography variant="subtitle2" gutterBottom>
          Reasoning Effort
        </Typography>
        <ToggleButtonGroup
          value={formData.reasoningEffort}
          exclusive
          onChange={(_, value) => {
            if (value) updateField('reasoningEffort', value);
          }}
          size="small"
        >
          <ToggleButton value="low" sx={{ textTransform: 'none' }}>
            Low
          </ToggleButton>
          <ToggleButton value="medium" sx={{ textTransform: 'none' }}>
            Medium
          </ToggleButton>
          <ToggleButton value="high" sx={{ textTransform: 'none' }}>
            High
          </ToggleButton>
        </ToggleButtonGroup>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
          Higher reasoning effort produces more thorough analysis at the cost of speed
        </Typography>
      </Box>

      <TextField
        label="Max Tool Calls"
        type="number"
        value={formData.maxToolCalls}
        onChange={e =>
          updateField('maxToolCalls', parseInt(e.target.value, 10) || 10)
        }
        helperText="Maximum number of tool calls per response cycle"
        inputProps={{ min: 1, max: 100 }}
        sx={{ maxWidth: 300 }}
      />
    </Box>
  );
}
