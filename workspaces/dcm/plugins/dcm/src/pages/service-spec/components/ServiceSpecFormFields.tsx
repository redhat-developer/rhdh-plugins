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
  Checkbox,
  FormControl,
  FormControlLabel,
  FormGroup,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@material-ui/core';
import { useDcmStyles } from '../../../components/dcmStyles';
import { useDcmPolicyPacks } from '../../../hooks/useDcmPolicyPacks';
import { SERVICE_SPEC_ENV_OPTIONS } from '../../../data/service-specs';
import type { SpecFormState } from './specFormTypes';

type Props = Readonly<{
  form: SpecFormState;
  setForm: React.Dispatch<React.SetStateAction<SpecFormState>>;
  idPrefix: string;
  togglePolicyPack: (
    setForm: React.Dispatch<React.SetStateAction<SpecFormState>>,
    pack: string,
  ) => void;
}>;

export function ServiceSpecFormFields({
  form,
  setForm,
  idPrefix,
  togglePolicyPack,
}: Props) {
  const classes = useDcmStyles();
  const policyPackOptions = useDcmPolicyPacks();
  const envLabelId = `${idPrefix}-env-label`;
  return (
    <>
      <TextField
        fullWidth
        required
        label="Name"
        value={form.name}
        onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
        variant="outlined"
      />
      <TextField
        fullWidth
        required
        label="CPU"
        value={form.cpu}
        onChange={e => setForm(prev => ({ ...prev, cpu: e.target.value }))}
        type="number"
        inputProps={{ min: 0, step: 1 }}
        InputProps={{
          endAdornment: <InputAdornment position="end">vCPU</InputAdornment>,
        }}
        variant="outlined"
        className={classes.registerFormTypeField}
      />
      <TextField
        fullWidth
        required
        label="RAM"
        value={form.ram}
        onChange={e => setForm(prev => ({ ...prev, ram: e.target.value }))}
        type="number"
        inputProps={{ min: 0, step: 1 }}
        InputProps={{
          endAdornment: <InputAdornment position="end">GB</InputAdornment>,
        }}
        variant="outlined"
        className={classes.registerFormTypeField}
      />
      <TextField
        fullWidth
        label="Max instances (quota)"
        value={form.maxQuota}
        onChange={e => setForm(prev => ({ ...prev, maxQuota: e.target.value }))}
        variant="outlined"
        className={classes.registerFormTypeField}
      />
      <FormControl
        fullWidth
        required
        variant="outlined"
        className={classes.registerFormTypeField}
      >
        <InputLabel id={envLabelId}>Environment</InputLabel>
        <Select
          labelId={envLabelId}
          id={`${envLabelId}-select`}
          label="Environment"
          value={form.environment}
          onChange={e =>
            setForm(prev => ({
              ...prev,
              environment: e.target.value as string,
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
          {SERVICE_SPEC_ENV_OPTIONS.map(e => (
            <MenuItem key={e} value={e}>
              {e}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <Box className={classes.serviceSpecComplianceSection}>
        <Typography
          component="p"
          variant="body2"
          className={classes.serviceSpecComplianceTitle}
        >
          Compliance (policy packs)
        </Typography>
        <FormGroup className={classes.serviceSpecCheckboxGroup}>
          {policyPackOptions.map(pack => (
            <FormControlLabel
              key={pack}
              control={
                <Checkbox
                  color="primary"
                  size="small"
                  checked={form.policyPacks.includes(pack)}
                  onChange={() => togglePolicyPack(setForm, pack)}
                />
              }
              label={pack}
            />
          ))}
        </FormGroup>
      </Box>
    </>
  );
}
