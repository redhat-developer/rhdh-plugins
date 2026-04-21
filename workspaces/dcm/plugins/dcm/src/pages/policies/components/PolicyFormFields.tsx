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

import {
  Box,
  FormControl,
  FormControlLabel,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  Switch,
  TextField,
} from '@material-ui/core';
import type { PolicyType } from '@red-hat-developer-hub/backstage-plugin-dcm-common';
import { PolicyForm, validatePolicyForm } from '../policyFormTypes';

type TouchedMap = Partial<Record<keyof PolicyForm, boolean>>;

export type PolicyFormFieldsProps = Readonly<{
  form: PolicyForm;
  setForm: React.Dispatch<React.SetStateAction<PolicyForm>>;
  touched: TouchedMap;
  setTouched: React.Dispatch<React.SetStateAction<TouchedMap>>;
}>;

export function PolicyFormFields({
  form,
  setForm,
  touched,
  setTouched,
}: PolicyFormFieldsProps) {
  const errors = validatePolicyForm(form);

  const touch = (field: keyof PolicyForm) =>
    setTouched(prev => ({ ...prev, [field]: true }));

  const err = (field: keyof PolicyForm) =>
    touched[field] ? errors[field] : undefined;

  return (
    <Box display="flex" flexDirection="column" gridGap={16}>
      <TextField
        label="Display name *"
        helperText={
          err('display_name') ?? 'Human-readable name for this policy'
        }
        error={Boolean(err('display_name'))}
        value={form.display_name}
        onChange={e =>
          setForm(prev => ({ ...prev, display_name: e.target.value }))
        }
        onBlur={() => touch('display_name')}
        fullWidth
        variant="outlined"
        size="small"
      />

      <TextField
        label="Description"
        helperText="Optional — describe the purpose of this policy"
        value={form.description}
        onChange={e =>
          setForm(prev => ({ ...prev, description: e.target.value }))
        }
        fullWidth
        variant="outlined"
        size="small"
        multiline
        rows={2}
      />

      <FormControl
        variant="outlined"
        size="small"
        fullWidth
        error={Boolean(err('policy_type'))}
      >
        <InputLabel>Policy type *</InputLabel>
        <Select
          value={form.policy_type}
          label="Policy type *"
          onChange={e => {
            setForm(prev => ({
              ...prev,
              policy_type: e.target.value as PolicyType,
            }));
            touch('policy_type');
          }}
          onBlur={() => touch('policy_type')}
        >
          <MenuItem value="GLOBAL">GLOBAL — applies to all requests</MenuItem>
          <MenuItem value="USER">USER — applies per user</MenuItem>
        </Select>
        {err('policy_type') && (
          <FormHelperText>{err('policy_type')}</FormHelperText>
        )}
      </FormControl>

      <TextField
        label="Priority"
        helperText={
          err('priority') ?? '1 (highest) – 1000 (lowest), default 500'
        }
        error={Boolean(err('priority'))}
        value={form.priority}
        onChange={e => setForm(prev => ({ ...prev, priority: e.target.value }))}
        onBlur={() => touch('priority')}
        fullWidth
        variant="outlined"
        size="small"
        type="number"
        inputProps={{ min: 1, max: 1000 }}
      />

      <TextField
        label="Rego code *"
        helperText={
          err('rego_code') ??
          'OPA Rego evaluated by the Placement Manager. Must assign selected_provider to the name of a registered provider.'
        }
        error={Boolean(err('rego_code'))}
        value={form.rego_code}
        onChange={e =>
          setForm(prev => ({ ...prev, rego_code: e.target.value }))
        }
        onBlur={() => touch('rego_code')}
        fullWidth
        variant="outlined"
        multiline
        rows={8}
        placeholder={
          'package dcm.placement\n\n# Replace "my-provider-name" with the name of a registered provider.\n# The Placement Manager requires selected_provider to be set.\nselected_provider := "my-provider-name"'
        }
      />

      <FormControlLabel
        control={
          <Switch
            checked={form.enabled}
            onChange={e =>
              setForm(prev => ({ ...prev, enabled: e.target.checked }))
            }
            color="primary"
          />
        }
        label="Enabled"
      />
    </Box>
  );
}
