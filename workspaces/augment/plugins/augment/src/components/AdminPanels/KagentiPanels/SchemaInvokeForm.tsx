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

import { useCallback, useEffect, useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Switch from '@mui/material/Switch';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import InputLabel from '@mui/material/InputLabel';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Link from '@mui/material/Link';
import { alpha, useTheme } from '@mui/material/styles';

export interface SchemaInvokeFormProps {
  schema: Record<string, unknown>;
  onSubmit: (args: Record<string, unknown>) => void;
  submitting: boolean;
  result: string | null;
  error: string | null;
  onErrorClear?: () => void;
  onCancel?: () => void;
}

interface PropertyDef {
  name: string;
  type: string;
  description?: string;
  required: boolean;
  enumValues?: string[];
  defaultValue?: unknown;
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function extractProperties(schema: Record<string, unknown>): PropertyDef[] {
  const props = schema.properties;
  if (!isPlainObject(props)) return [];

  const requiredArr = Array.isArray(schema.required)
    ? (schema.required as string[])
    : [];
  const requiredSet = new Set(requiredArr);

  return Object.entries(props).map(([name, raw]) => {
    const def = isPlainObject(raw) ? raw : {};
    const type = typeof def.type === 'string' ? def.type : 'unknown';
    const enumValues = Array.isArray(def.enum)
      ? def.enum.filter((v): v is string => typeof v === 'string')
      : undefined;

    return {
      name,
      type: enumValues?.length ? 'enum' : type,
      description:
        typeof def.description === 'string' ? def.description : undefined,
      required: requiredSet.has(name),
      enumValues,
      defaultValue: def.default,
    };
  });
}

function getInitialValue(prop: PropertyDef): unknown {
  if (prop.defaultValue !== undefined) return prop.defaultValue;
  switch (prop.type) {
    case 'boolean':
      return false;
    case 'number':
    case 'integer':
      return '';
    case 'enum':
      return prop.enumValues?.[0] ?? '';
    case 'array':
      return '';
    default:
      return '';
  }
}

function hasUnsupportedFeatures(schema: Record<string, unknown>): boolean {
  const keys = Object.keys(schema);
  return ['$ref', 'oneOf', 'anyOf', 'allOf'].some(k => keys.includes(k));
}

export function SchemaInvokeForm({
  schema,
  onSubmit,
  submitting,
  result,
  error,
  onErrorClear,
  onCancel,
}: SchemaInvokeFormProps) {
  const theme = useTheme();
  const properties = useMemo(() => extractProperties(schema), [schema]);
  const unsupported = useMemo(() => hasUnsupportedFeatures(schema), [schema]);

  const [values, setValues] = useState<Record<string, unknown>>(() => {
    const init: Record<string, unknown> = {};
    for (const p of properties) {
      init[p.name] = getInitialValue(p);
    }
    return init;
  });
  const [jsonMode, setJsonMode] = useState(false);
  const [rawJson, setRawJson] = useState('{}');
  const [jsonParseError, setJsonParseError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const init: Record<string, unknown> = {};
    for (const p of properties) {
      init[p.name] = getInitialValue(p);
    }
    setValues(init);
    setJsonMode(unsupported);
    setRawJson('{}');
    setJsonParseError(null);
    setFieldErrors({});
  }, [schema, properties, unsupported]);

  const setValue = useCallback((name: string, value: unknown) => {
    setValues(prev => ({ ...prev, [name]: value }));
    setFieldErrors(prev => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  }, []);

  const validateRequired = useCallback((): boolean => {
    const errs: Record<string, string> = {};
    for (const prop of properties) {
      if (!prop.required) continue;
      const val = values[prop.name];
      if (val === '' || val === undefined || val === null) {
        if (prop.type !== 'boolean') {
          errs[prop.name] = 'This field is required';
        }
      }
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }, [properties, values]);

  const handleSubmit = useCallback(() => {
    if (jsonMode) {
      try {
        const parsed = JSON.parse(rawJson) as Record<string, unknown>;
        setJsonParseError(null);
        onSubmit(parsed);
      } catch (e) {
        setJsonParseError(e instanceof Error ? e.message : 'Invalid JSON');
        return;
      }
    } else {
      if (!validateRequired()) return;
      const assembled: Record<string, unknown> = {};
      for (const prop of properties) {
        const val = values[prop.name];
        if (val === '' || val === undefined || val === null) {
          if (prop.required) {
            assembled[prop.name] = prop.type === 'boolean' ? false : '';
          }
          continue;
        }
        switch (prop.type) {
          case 'number':
          case 'integer': {
            const n = Number(val);
            if (!Number.isNaN(n)) assembled[prop.name] = n;
            break;
          }
          case 'boolean':
            assembled[prop.name] = Boolean(val);
            break;
          case 'array':
            if (typeof val === 'string') {
              assembled[prop.name] = val
                .split(',')
                .map(s => s.trim())
                .filter(Boolean);
            } else {
              assembled[prop.name] = val;
            }
            break;
          default:
            assembled[prop.name] = val;
            break;
        }
      }
      onSubmit(assembled);
    }
  }, [jsonMode, rawJson, properties, values, onSubmit, validateRequired]);

  if (properties.length === 0) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        <Typography variant="body2" color="text.secondary">
          This tool has no input parameters.
        </Typography>
        <TextField
          label="Arguments (JSON)"
          size="small"
          value={rawJson}
          onChange={e => setRawJson(e.target.value)}
          fullWidth
          multiline
          minRows={3}
        />
        {error && (
          <Alert severity="error" onClose={onErrorClear}>
            {error}
          </Alert>
        )}
        {result && (
          <TextField
            label="Result"
            size="small"
            value={result}
            fullWidth
            multiline
            minRows={4}
            InputProps={{ readOnly: true }}
          />
        )}
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="contained"
            size="small"
            onClick={handleSubmit}
            disabled={submitting}
            sx={{ textTransform: 'none' }}
          >
            {submitting ? (
              <CircularProgress size={18} color="inherit" />
            ) : (
              'Invoke'
            )}
          </Button>
          {onCancel && (
            <Button
              size="small"
              onClick={onCancel}
              disabled={submitting}
              sx={{ textTransform: 'none' }}
            >
              Cancel
            </Button>
          )}
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      {unsupported && (
        <Alert severity="info" sx={{ py: 0.5 }}>
          This schema uses features not fully supported by the form ($ref,
          oneOf, anyOf, or allOf). Using JSON mode instead.
        </Alert>
      )}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Link
          component="button"
          variant="caption"
          onClick={() => {
            if (!jsonMode) {
              const assembled: Record<string, unknown> = {};
              for (const prop of properties) {
                const val = values[prop.name];
                if (val !== '' && val !== undefined && val !== null) {
                  assembled[prop.name] = val;
                }
              }
              setRawJson(JSON.stringify(assembled, null, 2));
            }
            setJsonParseError(null);
            setJsonMode(prev => !prev);
          }}
          sx={{ cursor: 'pointer' }}
        >
          {jsonMode ? 'Switch to form' : 'Switch to JSON'}
        </Link>
      </Box>

      {jsonMode ? (
        <>
          <TextField
            label="Arguments (JSON)"
            size="small"
            value={rawJson}
            onChange={e => {
              setRawJson(e.target.value);
              setJsonParseError(null);
            }}
            fullWidth
            multiline
            minRows={4}
            error={!!jsonParseError}
            helperText={jsonParseError}
          />
        </>
      ) : (
        properties.map(prop => {
          switch (prop.type) {
            case 'boolean':
              return (
                <FormControlLabel
                  key={prop.name}
                  control={
                    <Switch
                      checked={Boolean(values[prop.name])}
                      onChange={e => setValue(prop.name, e.target.checked)}
                      size="small"
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {prop.name}
                        {prop.required && (
                          <span style={{ color: theme.palette.error.main }}>
                            {' '}
                            *
                          </span>
                        )}
                      </Typography>
                      {prop.description && (
                        <Typography variant="caption" color="text.secondary">
                          {prop.description}
                        </Typography>
                      )}
                    </Box>
                  }
                />
              );

            case 'enum':
              return (
                <FormControl
                  key={prop.name}
                  size="small"
                  fullWidth
                  required={prop.required}
                >
                  <InputLabel>{prop.name}</InputLabel>
                  <Select
                    value={String(values[prop.name] ?? '')}
                    label={prop.name}
                    onChange={e => setValue(prop.name, e.target.value)}
                  >
                    {(prop.enumValues ?? []).map(opt => (
                      <MenuItem key={opt} value={opt}>
                        {opt}
                      </MenuItem>
                    ))}
                  </Select>
                  {prop.description && (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ mt: 0.25, ml: 0.5 }}
                    >
                      {prop.description}
                    </Typography>
                  )}
                </FormControl>
              );

            case 'number':
            case 'integer':
              return (
                <TextField
                  key={prop.name}
                  label={prop.name}
                  size="small"
                  type="number"
                  value={values[prop.name] ?? ''}
                  onChange={e => setValue(prop.name, e.target.value)}
                  fullWidth
                  required={prop.required}
                  error={!!fieldErrors[prop.name]}
                  helperText={fieldErrors[prop.name] || prop.description}
                />
              );

            case 'array':
              return (
                <TextField
                  key={prop.name}
                  label={prop.name}
                  size="small"
                  value={values[prop.name] ?? ''}
                  onChange={e => setValue(prop.name, e.target.value)}
                  fullWidth
                  required={prop.required}
                  error={!!fieldErrors[prop.name]}
                  helperText={
                    fieldErrors[prop.name] ||
                    prop.description ||
                    'Comma-separated values'
                  }
                  placeholder="value1, value2, value3"
                />
              );

            case 'unknown':
            case 'object':
              return (
                <TextField
                  key={prop.name}
                  label={`${prop.name} (JSON)`}
                  size="small"
                  value={
                    typeof values[prop.name] === 'string'
                      ? values[prop.name]
                      : JSON.stringify(values[prop.name] ?? {}, null, 2)
                  }
                  onChange={e => setValue(prop.name, e.target.value)}
                  fullWidth
                  multiline
                  minRows={2}
                  required={prop.required}
                  helperText={prop.description ?? 'Enter valid JSON'}
                />
              );

            default:
              return (
                <TextField
                  key={prop.name}
                  label={prop.name}
                  size="small"
                  value={values[prop.name] ?? ''}
                  onChange={e => setValue(prop.name, e.target.value)}
                  fullWidth
                  required={prop.required}
                  error={!!fieldErrors[prop.name]}
                  helperText={fieldErrors[prop.name] || prop.description}
                />
              );
          }
        })
      )}

      {error && (
        <Alert severity="error" onClose={onErrorClear}>
          {error}
        </Alert>
      )}
      {result && (
        <TextField
          label="Result"
          size="small"
          value={result}
          fullWidth
          multiline
          minRows={4}
          InputProps={{
            readOnly: true,
            sx: {
              fontFamily: 'monospace',
              fontSize: '0.85rem',
              bgcolor: alpha(theme.palette.action.hover, 0.04),
            },
          }}
        />
      )}

      <Box sx={{ display: 'flex', gap: 1 }}>
        <Button
          variant="contained"
          size="small"
          onClick={handleSubmit}
          disabled={submitting}
          sx={{ textTransform: 'none' }}
        >
          {submitting ? (
            <CircularProgress size={18} color="inherit" />
          ) : (
            'Invoke'
          )}
        </Button>
        {onCancel && (
          <Button
            size="small"
            onClick={onCancel}
            disabled={submitting}
            sx={{ textTransform: 'none' }}
          >
            Cancel
          </Button>
        )}
      </Box>
    </Box>
  );
}
