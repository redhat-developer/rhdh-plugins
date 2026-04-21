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

import React from 'react';
import {
  Box,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from '@material-ui/core';
import { useDcmStyles } from '../../../components/dcmStyles';
import { ENVIRONMENT_TYPES } from '../../../data/environments';
import type { EnvironmentRegisterFormState } from './environmentFormTypes';

type Props = Readonly<{
  form: EnvironmentRegisterFormState;
  setForm: React.Dispatch<React.SetStateAction<EnvironmentRegisterFormState>>;
  /** `register` vs `edit` — selects unique label ids for accessibility */
  mode: 'register' | 'edit';
}>;

export function EnvironmentFormFields({ form, setForm, mode }: Props) {
  const classes = useDcmStyles();
  const typeLabelId =
    mode === 'register' ? 'register-env-type-label' : 'edit-env-type-label';
  return (
    <>
      <TextField
        fullWidth
        required
        label="Name"
        placeholder=""
        value={form.name}
        onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
        helperText="Display name for this environment (e.g. AWS Prod, OpenShift Dev)"
        variant="outlined"
      />
      <FormControl
        fullWidth
        variant="outlined"
        required
        className={classes.registerFormTypeField}
      >
        <InputLabel id={typeLabelId}>Type</InputLabel>
        <Select
          labelId={typeLabelId}
          id={`${typeLabelId}-select`}
          label="Type"
          value={form.type}
          onChange={e =>
            setForm(prev => ({
              ...prev,
              type: e.target.value as string,
            }))
          }
          MenuProps={{
            disablePortal: false,
            style: { zIndex: 1301 },
            getContentAnchorEl: null,
            anchorOrigin: { vertical: 'bottom', horizontal: 'left' },
            transformOrigin: { vertical: 'top', horizontal: 'left' },
          }}
        >
          {ENVIRONMENT_TYPES.map(environmentType => (
            <MenuItem key={environmentType} value={environmentType}>
              {environmentType}
            </MenuItem>
          ))}
        </Select>
        <FormHelperText>
          Environment types and their URLs are configured in the plugin config
          file (app-config.yaml).
        </FormHelperText>
      </FormControl>
      <TextField
        fullWidth
        required
        label="Env label"
        placeholder=""
        value={form.envLabel}
        onChange={e => setForm(prev => ({ ...prev, envLabel: e.target.value }))}
        helperText="Unique label for this environment (used in service spec environment options)"
        variant="outlined"
        className={classes.registerFormTypeField}
      />
      <Box className={classes.quotaRow}>
        <TextField
          fullWidth
          label="Max vCPUs (quota)"
          placeholder="Max vCPUs (quota)"
          value={form.maxVcpus}
          onChange={e =>
            setForm(prev => ({ ...prev, maxVcpus: e.target.value }))
          }
          variant="outlined"
        />
        <TextField
          fullWidth
          label="Max RAM (GB, quota)"
          placeholder="Max RAM (GB, quota)"
          value={form.maxRamGb}
          onChange={e =>
            setForm(prev => ({ ...prev, maxRamGb: e.target.value }))
          }
          variant="outlined"
        />
      </Box>
    </>
  );
}
