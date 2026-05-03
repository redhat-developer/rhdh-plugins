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
import React, { useCallback } from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Chip from '@mui/material/Chip';
import type { AgentWizardFormData, AgentRole } from '../types';
import { nameToKey } from '../validation';

interface IdentityStepProps {
  formData: AgentWizardFormData;
  updateField: <K extends keyof AgentWizardFormData>(
    field: K,
    value: AgentWizardFormData[K],
  ) => void;
  getFieldError: (field: string) => string | undefined;
}

const ROLE_OPTIONS: Array<{
  value: AgentRole;
  label: string;
  description: string;
}> = [
  {
    value: 'standalone',
    label: 'Standalone',
    description: 'Works independently, no handoffs',
  },
  {
    value: 'router',
    label: 'Router',
    description: 'Triages and routes to specialist agents',
  },
  {
    value: 'specialist',
    label: 'Specialist',
    description: 'Handles a specific domain, receives handoffs',
  },
];

export function IdentityStep({
  formData,
  updateField,
  getFieldError,
}: IdentityStepProps) {
  const handleNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newName = e.target.value;
      updateField('name', newName);
      if (!formData.key || formData.key === nameToKey(formData.name)) {
        updateField('key', nameToKey(newName));
      }
    },
    [formData.name, formData.key, updateField],
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Typography variant="h6" gutterBottom>
        Agent Identity
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        Define who this agent is and what role it plays in your system.
      </Typography>

      <TextField
        label="Agent Name"
        required
        fullWidth
        value={formData.name}
        onChange={handleNameChange}
        error={!!getFieldError('name')}
        helperText={getFieldError('name') || 'A human-readable name for the agent'}
        placeholder="e.g. Billing Support Agent"
      />

      <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
        <TextField
          label="Agent Key"
          required
          fullWidth
          value={formData.key}
          onChange={e => updateField('key', e.target.value)}
          error={!!getFieldError('key')}
          helperText={
            getFieldError('key') ||
            'Unique identifier (DNS-1123 format: lowercase, alphanumeric, hyphens)'
          }
          placeholder="e.g. billing-support"
          sx={{ flex: 1 }}
        />
        <Chip
          label={`Key: ${formData.key || '—'}`}
          size="small"
          variant="outlined"
          sx={{ mt: 1.5 }}
        />
      </Box>

      <TextField
        label="Description"
        fullWidth
        multiline
        rows={2}
        value={formData.description}
        onChange={e => updateField('description', e.target.value)}
        helperText="Optional description shown to other agents for routing decisions"
        placeholder="e.g. Handles billing inquiries, refunds, and payment issues"
      />

      <Box>
        <Typography variant="subtitle2" gutterBottom>
          Agent Role
        </Typography>
        <ToggleButtonGroup
          value={formData.role}
          exclusive
          onChange={(_, value) => {
            if (value) updateField('role', value as AgentRole);
          }}
          fullWidth
          sx={{ mb: 1 }}
        >
          {ROLE_OPTIONS.map(option => (
            <ToggleButton
              key={option.value}
              value={option.value}
              sx={{
                textTransform: 'none',
                flexDirection: 'column',
                py: 2,
              }}
            >
              <Typography variant="subtitle2">{option.label}</Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mt: 0.5 }}
              >
                {option.description}
              </Typography>
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>
    </Box>
  );
}
