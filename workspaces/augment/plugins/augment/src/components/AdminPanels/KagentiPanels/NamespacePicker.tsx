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
import { useEffect, useState } from 'react';
import { useApi } from '@backstage/core-plugin-api';
import Box from '@mui/material/Box';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Skeleton from '@mui/material/Skeleton';
import Alert from '@mui/material/Alert';
import { useTheme, alpha } from '@mui/material/styles';
import { augmentApiRef } from '../../../api';
import { SELECT_MENU_PROPS } from '../shared/selectMenuProps';

export interface NamespacePickerProps {
  value: string | undefined;
  onChange: (ns: string) => void;
  label?: string;
  size?: 'small' | 'medium';
  fullWidth?: boolean;
  enabledOnly?: boolean;
}

export function NamespacePicker({
  value,
  onChange,
  label = 'Namespace',
  size = 'small',
  fullWidth = true,
  enabledOnly = true,
}: NamespacePickerProps) {
  const theme = useTheme();
  const api = useApi(augmentApiRef);
  const [namespaces, setNamespaces] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    api
      .listKagentiNamespaces(enabledOnly)
      .then(res => {
        if (!cancelled) {
          setNamespaces(res.namespaces ?? []);
        }
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [api, enabledOnly]);

  if (loading) {
    return (
      <Box
        sx={{
          py: 0.5,
          px: 1,
          borderRadius: 1,
          bgcolor: alpha(theme.palette.divider, 0.06),
        }}
      >
        <Skeleton variant="rounded" height={40} />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <FormControl size={size} fullWidth={fullWidth}>
      <InputLabel id="kagenti-namespace-label">{label}</InputLabel>
      <Select
        labelId="kagenti-namespace-label"
        label={label}
        value={value ?? ''}
        onChange={e => onChange(String(e.target.value))}
        displayEmpty
        MenuProps={SELECT_MENU_PROPS}
      >
        <MenuItem value="">
          <em>All namespaces</em>
        </MenuItem>
        {namespaces.map(ns => (
          <MenuItem key={ns} value={ns}>
            {ns}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
