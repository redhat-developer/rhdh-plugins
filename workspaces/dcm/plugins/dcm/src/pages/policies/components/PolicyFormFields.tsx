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

import { useMemo } from 'react';
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
import { makeStyles } from '@material-ui/core/styles';
import type { PolicyType } from '@red-hat-developer-hub/backstage-plugin-dcm-common';
import {
  PolicyForm,
  validatePolicyForm,
  validateRegoCode,
} from '../policyFormTypes';
import { useTranslation } from '../../../hooks/useTranslation';

const useStyles = makeStyles(() => ({
  regoInput: {
    fontFamily: 'monospace',
    fontSize: 13,
  },
}));

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
  const classes = useStyles();
  const { t } = useTranslation();
  const errors = useMemo(() => validatePolicyForm(form, t), [form, t]);

  const touch = (field: keyof PolicyForm) =>
    setTouched(prev => ({ ...prev, [field]: true }));

  const err = (field: keyof PolicyForm) =>
    touched[field] ? errors[field] : undefined;

  // Rego structural errors are computed directly — not through Yup — to
  // avoid a Yup v1 quirk where custom .test() results are dropped from
  // err.inner when the total number of schema errors is exactly one.
  const regoErr = useMemo(
    () => validateRegoCode(form.rego_code, t),
    [form.rego_code, t],
  );

  return (
    <Box display="flex" flexDirection="column" gridGap={16}>
      <TextField
        label={t('policies.form.displayNameLabel')}
        helperText={err('display_name') ?? t('policies.form.displayNameHelper')}
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
        label={t('policies.form.descriptionLabel')}
        helperText={err('description') ?? t('policies.form.descriptionHelper')}
        error={Boolean(err('description'))}
        value={form.description}
        onChange={e =>
          setForm(prev => ({ ...prev, description: e.target.value }))
        }
        onBlur={() => touch('description')}
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
        <InputLabel>{t('policies.form.policyTypeLabel')}</InputLabel>
        <Select
          value={form.policy_type}
          label={t('policies.form.policyTypeLabel')}
          onChange={e => {
            setForm(prev => ({
              ...prev,
              policy_type: e.target.value as PolicyType,
            }));
            touch('policy_type');
          }}
          onBlur={() => touch('policy_type')}
        >
          <MenuItem value="GLOBAL">
            {t('policies.form.policyTypeGlobal')}
          </MenuItem>
          <MenuItem value="USER">{t('policies.form.policyTypeUser')}</MenuItem>
        </Select>
        {err('policy_type') && (
          <FormHelperText>{err('policy_type')}</FormHelperText>
        )}
      </FormControl>

      <TextField
        label={t('policies.form.priorityLabel')}
        helperText={err('priority') ?? t('policies.form.priorityHelper')}
        error={Boolean(err('priority'))}
        value={form.priority}
        onChange={e => {
          if (/^\d*$/.test(e.target.value)) {
            setForm(prev => ({ ...prev, priority: e.target.value }));
          }
        }}
        onKeyDown={e => {
          if (e.key === '.' || e.key === 'e' || e.key === 'E') {
            e.preventDefault();
          }
        }}
        onBlur={() => touch('priority')}
        fullWidth
        variant="outlined"
        size="small"
        type="number"
        inputProps={{ min: 1, max: 1000, step: 1 }}
      />

      <TextField
        label={t('policies.form.regoCodeLabel')}
        helperText={regoErr ?? t('policies.form.regoCodeHelper')}
        error={Boolean(regoErr)}
        value={form.rego_code}
        onChange={e =>
          setForm(prev => ({ ...prev, rego_code: e.target.value }))
        }
        onBlur={() => touch('rego_code')}
        fullWidth
        variant="outlined"
        multiline
        rows={8}
        placeholder={t('policies.form.regoCodePlaceholder')}
        inputProps={{ className: classes.regoInput }}
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
        label={t('policies.form.enabledLabel')}
      />
    </Box>
  );
}
