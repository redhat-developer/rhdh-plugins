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
  FormHelperText,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Select,
  TextField,
} from '@material-ui/core';
import type { ServiceType } from '@red-hat-developer-hub/backstage-plugin-dcm-common';
import {
  KNOWN_OPERATIONS,
  ProviderForm,
  validateProviderForm,
} from '../providerFormTypes';

type TouchedMap = Partial<Record<keyof ProviderForm, boolean>>;

export type ProviderFormFieldsProps = Readonly<{
  form: ProviderForm;
  setForm: React.Dispatch<React.SetStateAction<ProviderForm>>;
  serviceTypes: ServiceType[];
  touched: TouchedMap;
  setTouched: React.Dispatch<React.SetStateAction<TouchedMap>>;
}>;

export function ProviderFormFields({
  form,
  setForm,
  serviceTypes,
  touched,
  setTouched,
}: ProviderFormFieldsProps) {
  const errors = validateProviderForm(form);

  const touch = (field: keyof ProviderForm) =>
    setTouched(prev => ({ ...prev, [field]: true }));

  const err = (field: keyof ProviderForm) =>
    touched[field] ? errors[field] : undefined;

  return (
    <Box display="flex" flexDirection="column" gridGap={16}>
      <TextField
        label="Name *"
        helperText={
          err('name') ??
          'Unique slug identifier — only lowercase letters, numbers, and hyphens'
        }
        error={Boolean(err('name'))}
        value={form.name}
        onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
        onBlur={() => touch('name')}
        fullWidth
        variant="outlined"
        size="small"
        placeholder="e.g. my-k8s-provider"
      />

      <TextField
        label="Endpoint *"
        helperText={
          err('endpoint') ??
          'Full URL of the provider API (e.g. https://api.example.com)'
        }
        error={Boolean(err('endpoint'))}
        value={form.endpoint}
        onChange={e => setForm(prev => ({ ...prev, endpoint: e.target.value }))}
        onBlur={() => touch('endpoint')}
        fullWidth
        variant="outlined"
        size="small"
        placeholder="https://api.example.com"
      />

      <FormControl
        variant="outlined"
        size="small"
        fullWidth
        error={Boolean(err('service_type'))}
      >
        <InputLabel shrink>Service type *</InputLabel>
        <Select
          value={form.service_type}
          onChange={e => {
            setForm(prev => ({
              ...prev,
              service_type: e.target.value as string,
            }));
            touch('service_type');
          }}
          onBlur={() => touch('service_type')}
          displayEmpty
          input={<OutlinedInput notched label="Service type *" />}
        >
          <MenuItem value="" disabled>
            <em>
              {serviceTypes.length === 0
                ? 'No service types available'
                : 'Select a service type\u2026'}
            </em>
          </MenuItem>
          {serviceTypes.map(st => (
            <MenuItem key={st.uid ?? st.service_type} value={st.service_type}>
              {st.service_type}
            </MenuItem>
          ))}
        </Select>
        <FormHelperText>
          {err('service_type') ??
            (serviceTypes.length === 0
              ? 'Create a service type first in the Service types tab'
              : 'Select from registered service types')}
        </FormHelperText>
      </FormControl>

      <TextField
        label="Schema version *"
        helperText={
          err('schema_version') ??
          'e.g. v1, v1alpha1, v2beta2 — only v<number>[alpha|beta][number]'
        }
        error={Boolean(err('schema_version'))}
        value={form.schema_version}
        onChange={e =>
          setForm(prev => ({ ...prev, schema_version: e.target.value }))
        }
        onBlur={() => touch('schema_version')}
        fullWidth
        variant="outlined"
        size="small"
      />

      <FormControl variant="outlined" size="small" fullWidth>
        <InputLabel>Operations</InputLabel>
        <Select
          multiple
          value={form.operations}
          label="Operations"
          onChange={e =>
            setForm(prev => ({
              ...prev,
              operations: e.target.value as string[],
            }))
          }
        >
          {KNOWN_OPERATIONS.map(op => (
            <MenuItem key={op} value={op}>
              {op}
            </MenuItem>
          ))}
        </Select>
        <FormHelperText>
          Select the operations this provider supports
        </FormHelperText>
      </FormControl>
    </Box>
  );
}
