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

import { useMemo, useRef } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Select,
  TextField,
  Tooltip,
} from '@material-ui/core';
import CloudUploadIcon from '@material-ui/icons/CloudUpload';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles(() => ({
  hiddenInput: {
    display: 'none',
  },
  monoInput: {
    fontFamily: 'monospace',
    fontSize: 13,
  },
}));
import type { CatalogItemInstance } from '@red-hat-developer-hub/backstage-plugin-dcm-common';
import { ResourceForm, validateResourceForm } from '../resourceFormTypes';

type TouchedMap = Partial<Record<keyof ResourceForm, boolean>>;

export type ResourceFormFieldsProps = Readonly<{
  form: ResourceForm;
  setForm: React.Dispatch<React.SetStateAction<ResourceForm>>;
  touched: TouchedMap;
  setTouched: React.Dispatch<React.SetStateAction<TouchedMap>>;
  instances: CatalogItemInstance[];
}>;

export function ResourceFormFields({
  form,
  setForm,
  touched,
  setTouched,
  instances,
}: ResourceFormFieldsProps) {
  const classes = useStyles();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const errors = useMemo(() => validateResourceForm(form), [form]);

  const set =
    (field: keyof ResourceForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm(prev => ({ ...prev, [field]: e.target.value }));
      setTouched(prev => ({ ...prev, [field]: true }));
    };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    const text = await file.text();
    try {
      const parsed = JSON.parse(text);
      setForm(prev => ({ ...prev, spec: JSON.stringify(parsed, null, 2) }));
    } catch {
      setForm(prev => ({ ...prev, spec: text }));
    }
    setTouched(prev => ({ ...prev, spec: true }));
  };

  return (
    <Box display="flex" flexDirection="column" gridGap={16}>
      <FormControl
        variant="outlined"
        size="small"
        fullWidth
        error={Boolean(
          touched.catalog_item_instance_id && errors.catalog_item_instance_id,
        )}
      >
        <InputLabel shrink>Catalog item instance *</InputLabel>
        <Select
          value={form.catalog_item_instance_id}
          onChange={e => {
            setForm(prev => ({
              ...prev,
              catalog_item_instance_id: e.target.value as string,
            }));
            setTouched(prev => ({ ...prev, catalog_item_instance_id: true }));
          }}
          displayEmpty
          input={<OutlinedInput notched label="Catalog item instance *" />}
        >
          <MenuItem value="" disabled>
            <em>Select an instance…</em>
          </MenuItem>
          {instances.map(inst => (
            <MenuItem key={inst.uid} value={inst.uid ?? ''}>
              <Tooltip
                title={inst.uid ?? ''}
                placement="right"
                enterDelay={400}
              >
                <Box component="span">{inst.display_name || inst.uid}</Box>
              </Tooltip>
            </MenuItem>
          ))}
        </Select>
        {touched.catalog_item_instance_id &&
          errors.catalog_item_instance_id && (
            <FormHelperText>{errors.catalog_item_instance_id}</FormHelperText>
          )}
      </FormControl>

      <TextField
        label="Spec (JSON) *"
        helperText={
          touched.spec && errors.spec
            ? errors.spec
            : 'Service specification — must be a JSON object with at least one property'
        }
        error={Boolean(touched.spec && errors.spec)}
        value={form.spec}
        onChange={set('spec')}
        onBlur={() => setTouched(prev => ({ ...prev, spec: true }))}
        fullWidth
        variant="outlined"
        multiline
        minRows={6}
        placeholder={'{\n  "cpu": 2,\n  "memory": "4Gi"\n}'}
        inputProps={{ className: classes.monoInput }}
      />
      <Box>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          className={classes.hiddenInput}
          onChange={handleFileUpload}
        />
        <Button
          variant="outlined"
          size="small"
          startIcon={<CloudUploadIcon />}
          onClick={() => fileInputRef.current?.click()}
        >
          Upload Spec File
        </Button>
      </Box>

      <TextField
        label="Resource ID (optional)"
        helperText={
          touched.id && errors.id
            ? errors.id
            : 'Leave blank to let the server generate one. 1\u201363 lowercase alphanumeric / hyphens.'
        }
        error={Boolean(touched.id && errors.id)}
        value={form.id}
        onChange={set('id')}
        onBlur={() => setTouched(prev => ({ ...prev, id: true }))}
        fullWidth
        variant="outlined"
        size="small"
        placeholder="e.g. my-resource-01"
      />
    </Box>
  );
}
