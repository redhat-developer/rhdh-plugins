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
  Switch,
  TextField,
  Typography,
} from '@material-ui/core';
import type { UserValueRow } from '../pages/catalog-item-instances/instanceFormTypes';

function fieldHelperText(row: UserValueRow): string {
  const parts: string[] = [`path: ${row.path}`];
  if (row.required) parts.push('required');
  if (row.schemaType) parts.push(`type: ${row.schemaType}`);
  if (row.schemaMin !== undefined) parts.push(`min: ${row.schemaMin}`);
  if (row.schemaMax !== undefined) parts.push(`max: ${row.schemaMax}`);
  return parts.join(' · ');
}

export type UserValueFieldsProps = Readonly<{
  rows: UserValueRow[];
  errors: Record<number, string>;
  touchedMap: Record<number, boolean>;
  onValueChange: (index: number, value: string) => void;
  onBlur: (index: number) => void;
}>;

/**
 * Renders a list of user-value fields for one resource. Supports enum select,
 * numeric inputs, boolean switches, and plain text fields.
 * Re-used by InstanceWizardDialog in each per-resource tab.
 */
export function UserValueFields({
  rows,
  errors,
  touchedMap,
  onValueChange,
  onBlur,
}: UserValueFieldsProps) {
  return (
    <Box display="flex" flexDirection="column" gridGap={16}>
      {rows.map((row, i) => {
        const isTouched = Boolean(touchedMap[i]);
        const fieldError = isTouched ? errors[i] : undefined;
        const label = row.required ? `${row.displayName} *` : row.displayName;
        const helperText = fieldError ?? fieldHelperText(row);

        if (row.enumValues && row.enumValues.length > 0) {
          return (
            <FormControl
              key={row.path}
              variant="outlined"
              size="small"
              fullWidth
              error={Boolean(fieldError)}
            >
              <InputLabel shrink>{label}</InputLabel>
              <Select
                value={row.value}
                onChange={e => {
                  onValueChange(i, e.target.value as string);
                  onBlur(i);
                }}
                onBlur={() => onBlur(i)}
                input={<OutlinedInput notched label={label} />}
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

        const schemaType = row.schemaType?.toLowerCase();

        if (schemaType === 'integer' || schemaType === 'number') {
          return (
            <TextField
              key={row.path}
              label={label}
              helperText={helperText}
              error={Boolean(fieldError)}
              value={row.value}
              onChange={e => onValueChange(i, e.target.value)}
              onBlur={() => onBlur(i)}
              fullWidth
              variant="outlined"
              size="small"
              type="number"
              inputProps={{
                step: schemaType === 'integer' ? 1 : 'any',
                min: row.schemaMin,
                max: row.schemaMax,
              }}
            />
          );
        }

        if (schemaType === 'boolean') {
          return (
            <Box
              key={row.path}
              display="flex"
              alignItems="center"
              justifyContent="space-between"
            >
              <Box>
                <Typography variant="body2">{row.displayName}</Typography>
                <Typography variant="caption" color="textSecondary">
                  {helperText}
                </Typography>
              </Box>
              <Switch
                checked={row.value === 'true'}
                onChange={e => onValueChange(i, String(e.target.checked))}
                color="primary"
                size="small"
              />
            </Box>
          );
        }

        return (
          <TextField
            key={row.path}
            label={label}
            helperText={helperText}
            error={Boolean(fieldError)}
            value={row.value}
            onChange={e => onValueChange(i, e.target.value)}
            onBlur={() => onBlur(i)}
            fullWidth
            variant="outlined"
            size="small"
          />
        );
      })}
    </Box>
  );
}
