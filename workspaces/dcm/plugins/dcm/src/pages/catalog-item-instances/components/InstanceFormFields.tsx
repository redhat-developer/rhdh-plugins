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
  Divider,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Select,
  TextField,
  Typography,
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles(theme => ({
  catalogItemBadge: {
    marginLeft: theme.spacing(1),
  },
  fieldValuesSectionHint: {
    marginLeft: theme.spacing(0.75),
  },
}));

import type { CatalogItem } from '@red-hat-developer-hub/backstage-plugin-dcm-common';
import {
  buildUserValueRows,
  InstanceForm,
  validateInstanceForm,
} from '../instanceFormTypes';
import type { UserValueRow } from '../instanceFormTypes';

type ScalarFields = Omit<InstanceForm, 'user_values'>;
type TouchedMap = Partial<Record<keyof ScalarFields, boolean>>;

export type InstanceFormFieldsProps = Readonly<{
  form: InstanceForm;
  setForm: React.Dispatch<React.SetStateAction<InstanceForm>>;
  catalogItems: CatalogItem[];
  touched: TouchedMap;
  setTouched: React.Dispatch<React.SetStateAction<TouchedMap>>;
}>;

function fieldHelperText(row: UserValueRow): string {
  const parts: string[] = [`path: ${row.path}`];
  if (row.schemaType) parts.push(`type: ${row.schemaType}`);
  if (row.schemaMin !== undefined) parts.push(`min: ${row.schemaMin}`);
  if (row.schemaMax !== undefined) parts.push(`max: ${row.schemaMax}`);
  return parts.join(' · ');
}

export function InstanceFormFields({
  form,
  setForm,
  catalogItems,
  touched,
  setTouched,
}: InstanceFormFieldsProps) {
  const classes = useStyles();
  const errors = useMemo(() => validateInstanceForm(form), [form]);
  const selectedItem = catalogItems.find(ci => ci.uid === form.catalog_item_id);

  const handleCatalogItemChange = (id: string) => {
    const item = catalogItems.find(ci => ci.uid === id);
    setForm(prev => ({
      ...prev,
      catalog_item_id: id,
      user_values: buildUserValueRows(item),
    }));
    setTouched(prev => ({ ...prev, catalog_item_id: true }));
  };

  const setUserValue = (index: number, value: string) =>
    setForm(prev => {
      const updated = [...prev.user_values];
      updated[index] = { ...updated[index], value };
      return { ...prev, user_values: updated };
    });

  return (
    <Box display="flex" flexDirection="column" gridGap={16}>
      <TextField
        label="Display name *"
        helperText={
          touched.display_name && errors.display_name
            ? errors.display_name
            : 'Human-readable name for this provisioned instance (max 63 characters)'
        }
        error={Boolean(touched.display_name && errors.display_name)}
        value={form.display_name}
        onChange={e => {
          setForm(prev => ({ ...prev, display_name: e.target.value }));
          setTouched(prev => ({ ...prev, display_name: true }));
        }}
        onBlur={() => setTouched(prev => ({ ...prev, display_name: true }))}
        fullWidth
        variant="outlined"
        size="small"
      />

      <FormControl
        variant="outlined"
        size="small"
        fullWidth
        error={Boolean(touched.catalog_item_id && errors.catalog_item_id)}
      >
        <InputLabel shrink>Catalog item *</InputLabel>
        <Select
          value={form.catalog_item_id}
          onChange={e => handleCatalogItemChange(e.target.value as string)}
          displayEmpty
          input={<OutlinedInput notched label="Catalog item *" />}
        >
          <MenuItem value="">
            <em>Select a catalog item…</em>
          </MenuItem>
          {catalogItems.map(ci => (
            <MenuItem key={ci.uid} value={ci.uid ?? ''}>
              {ci.display_name ?? ci.uid}
              {ci.spec?.service_type && (
                <Typography
                  variant="caption"
                  color="textSecondary"
                  className={classes.catalogItemBadge}
                >
                  ({ci.spec.service_type})
                </Typography>
              )}
            </MenuItem>
          ))}
        </Select>
        <FormHelperText>
          {(() => {
            if (touched.catalog_item_id && errors.catalog_item_id)
              return errors.catalog_item_id;
            if (catalogItems.length === 0)
              return 'No catalog items available — create one in the Catalog items tab';
            return 'Choose the catalog item to provision an instance from';
          })()}
        </FormHelperText>
      </FormControl>

      <TextField
        label="API version *"
        helperText={
          touched.api_version && errors.api_version
            ? errors.api_version
            : 'Must follow the pattern v<number>[alpha|beta][number] — e.g. v1, v1alpha1'
        }
        error={Boolean(touched.api_version && errors.api_version)}
        value={form.api_version}
        onChange={e => {
          setForm(prev => ({ ...prev, api_version: e.target.value }));
          setTouched(prev => ({ ...prev, api_version: true }));
        }}
        onBlur={() => setTouched(prev => ({ ...prev, api_version: true }))}
        fullWidth
        variant="outlined"
        size="small"
      />

      {selectedItem && form.user_values.length > 0 && (
        <>
          <Divider />
          <Typography variant="subtitle2">
            Field values
            <Typography
              variant="caption"
              color="textSecondary"
              className={classes.fieldValuesSectionHint}
            >
              (editable fields defined by this catalog item)
            </Typography>
          </Typography>
          {form.user_values.map((row, i) => {
            const helperText = fieldHelperText(row);

            /* Enum field → Select */
            if (row.enumValues && row.enumValues.length > 0) {
              return (
                <FormControl
                  key={row.path}
                  variant="outlined"
                  size="small"
                  fullWidth
                >
                  <InputLabel shrink>{row.displayName}</InputLabel>
                  <Select
                    value={row.value}
                    onChange={e => setUserValue(i, e.target.value as string)}
                    input={<OutlinedInput notched label={row.displayName} />}
                  >
                    {row.enumValues.map(v => (
                      <MenuItem key={v} value={v}>
                        {v}
                      </MenuItem>
                    ))}
                  </Select>
                  <FormHelperText>{helperText}</FormHelperText>
                </FormControl>
              );
            }

            /* Integer / number field → numeric text input */
            if (row.schemaType === 'integer' || row.schemaType === 'number') {
              return (
                <TextField
                  key={row.path}
                  label={row.displayName}
                  helperText={helperText}
                  value={row.value}
                  onChange={e => setUserValue(i, e.target.value)}
                  fullWidth
                  variant="outlined"
                  size="small"
                  type="number"
                  inputProps={{
                    step: row.schemaType === 'integer' ? 1 : 'any',
                    min: row.schemaMin,
                    max: row.schemaMax,
                  }}
                />
              );
            }

            /* Default → plain text */
            return (
              <TextField
                key={row.path}
                label={row.displayName}
                helperText={helperText}
                value={row.value}
                onChange={e => setUserValue(i, e.target.value)}
                fullWidth
                variant="outlined"
                size="small"
              />
            );
          })}
        </>
      )}

      {selectedItem && form.user_values.length === 0 && (
        <Typography variant="caption" color="textSecondary">
          This catalog item has no editable fields.
        </Typography>
      )}
    </Box>
  );
}
