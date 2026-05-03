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
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import Chip from '@mui/material/Chip';
import type { AgentWizardFormData } from '../types';

interface GuardrailsStepProps {
  formData: AgentWizardFormData;
  updateField: <K extends keyof AgentWizardFormData>(
    field: K,
    value: AgentWizardFormData[K],
  ) => void;
  availableShields: Array<{ identifier: string; provider_id?: string }>;
  loadingShields: boolean;
}

export function GuardrailsStep({
  formData,
  updateField,
  availableShields,
  loadingShields,
}: GuardrailsStepProps) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Typography variant="h6" gutterBottom>
        Safety and Guardrails
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        Configure safety shields and behavioral guardrails for this agent.
      </Typography>

      <Box>
        <Typography variant="subtitle2" gutterBottom>
          Safety Shields
        </Typography>
        <Autocomplete
          multiple
          options={availableShields.map(s => s.identifier)}
          value={formData.guardrails}
          onChange={(_, value) => updateField('guardrails', value)}
          loading={loadingShields}
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
              placeholder="Select shields..."
              helperText="Safety shields from LlamaStack that filter input/output"
            />
          )}
        />
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Typography variant="subtitle2">Behavioral Controls</Typography>

        <FormControlLabel
          control={
            <Switch
              checked={formData.resetToolChoice}
              onChange={e =>
                updateField('resetToolChoice', e.target.checked)
              }
            />
          }
          label={
            <Box>
              <Typography variant="body2">Reset Tool Choice</Typography>
              <Typography variant="caption" color="text.secondary">
                Reset tool choice to &quot;auto&quot; after each tool call cycle
              </Typography>
            </Box>
          }
        />

        <FormControlLabel
          control={
            <Switch
              checked={formData.nestHandoffHistory}
              onChange={e =>
                updateField('nestHandoffHistory', e.target.checked)
              }
            />
          }
          label={
            <Box>
              <Typography variant="body2">Nest Handoff History</Typography>
              <Typography variant="caption" color="text.secondary">
                Include conversation history from previous agents in handoff context
              </Typography>
            </Box>
          }
        />
      </Box>
    </Box>
  );
}
