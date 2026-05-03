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
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import type { AgentWizardFormData } from '../types';

interface ConnectionsStepProps {
  formData: AgentWizardFormData;
  updateField: <K extends keyof AgentWizardFormData>(
    field: K,
    value: AgentWizardFormData[K],
  ) => void;
  existingAgentKeys: string[];
}

export function ConnectionsStep({
  formData,
  updateField,
  existingAgentKeys,
}: ConnectionsStepProps) {
  const isStandalone = formData.role === 'standalone';

  if (isStandalone) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <Typography variant="h6" gutterBottom>
          Agent Connections
        </Typography>
        <Alert severity="info">
          This agent is configured as <strong>Standalone</strong>. Standalone
          agents do not have handoff or delegation connections. Change the role
          on the Identity step to enable handoffs and delegation.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Typography variant="h6" gutterBottom>
        Agent Connections
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        Define how this agent connects to other agents in your system.
      </Typography>

      <TextField
        label="Handoff Description"
        fullWidth
        multiline
        rows={2}
        value={formData.handoffDescription}
        onChange={e => updateField('handoffDescription', e.target.value)}
        helperText="Description other agents see when deciding to route to this agent"
        placeholder="e.g. Expert in billing questions, refund processing, and payment disputes"
      />

      <Box>
        <Typography variant="subtitle2" gutterBottom>
          Can Transfer To (Handoffs)
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
          Agents this agent can hand off conversations to
        </Typography>
        <Autocomplete
          multiple
          options={existingAgentKeys}
          value={formData.handoffs}
          onChange={(_, value) => updateField('handoffs', value)}
          renderTags={(value, getTagProps) =>
            value.map((option, index) => {
              const { key, ...rest } = getTagProps({ index });
              return (
                <Chip key={key} label={option} size="small" color="primary" variant="outlined" {...rest} />
              );
            })
          }
          renderInput={params => (
            <TextField {...params} placeholder="Select agents..." size="small" />
          )}
        />
      </Box>

      <Box>
        <Typography variant="subtitle2" gutterBottom>
          Can Delegate To (Agent-as-Tool)
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
          Agents this agent can call as sub-agents for specific tasks
        </Typography>
        <Autocomplete
          multiple
          options={existingAgentKeys}
          value={formData.asTools}
          onChange={(_, value) => updateField('asTools', value)}
          renderTags={(value, getTagProps) =>
            value.map((option, index) => {
              const { key, ...rest } = getTagProps({ index });
              return (
                <Chip key={key} label={option} size="small" color="secondary" variant="outlined" {...rest} />
              );
            })
          }
          renderInput={params => (
            <TextField {...params} placeholder="Select agents..." size="small" />
          )}
        />
      </Box>

      {(formData.handoffs.length > 0 || formData.asTools.length > 0) && (
        <Alert severity="info" sx={{ mt: 1 }}>
          This agent connects to{' '}
          {[
            formData.handoffs.length > 0
              ? `${formData.handoffs.length} handoff target(s)`
              : '',
            formData.asTools.length > 0
              ? `${formData.asTools.length} delegation target(s)`
              : '',
          ]
            .filter(Boolean)
            .join(' and ')}
        </Alert>
      )}
    </Box>
  );
}
