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

import { useRef, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  FormHelperText,
  IconButton,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Select,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from '@material-ui/core';
import AddIcon from '@material-ui/icons/Add';
import CodeIcon from '@material-ui/icons/Code';
import DeleteIcon from '@material-ui/icons/Delete';
import PublishIcon from '@material-ui/icons/Publish';
import { makeStyles } from '@material-ui/core/styles';
import { load as loadYaml } from 'js-yaml';

const useStyles = makeStyles(theme => ({
  fieldRow: {
    background: 'rgba(0,0,0,0.03)',
    borderRadius: theme.shape.borderRadius,
    padding: theme.spacing(1.25, 1.5),
  },
  fieldRowSwitch: {
    paddingTop: theme.spacing(0.75),
  },
  fieldRowDelete: {
    marginTop: theme.spacing(0.5),
  },
  importButton: {
    alignSelf: 'flex-start',
  },
}));

import type { ServiceType } from '@red-hat-developer-hub/backstage-plugin-dcm-common';

const useSchemaEditorStyles = makeStyles(theme => ({
  schemaLabel: {
    marginBottom: theme.spacing(0.5),
  },
  dialogContent: {
    paddingTop: theme.spacing(1),
  },
  monoInput: {
    fontFamily: 'monospace',
    fontSize: 12,
  },
}));

type SchemaButtonProps = Readonly<{
  value: string;
  onChange: (v: string) => void;
}>;

function SchemaButton({ value, onChange }: SchemaButtonProps) {
  const classes = useSchemaEditorStyles();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [parseError, setParseError] = useState('');

  const handleOpen = () => {
    setDraft(value);
    setParseError('');
    setOpen(true);
  };

  const handleApply = () => {
    const trimmed = draft.trim();
    if (trimmed) {
      try {
        JSON.parse(trimmed);
      } catch {
        setParseError('Invalid JSON — fix the syntax before applying.');
        return;
      }
    }
    onChange(trimmed);
    setOpen(false);
  };

  const handleClose = () => setOpen(false);

  return (
    <>
      <Box display="flex" flexDirection="column">
        <Typography
          variant="caption"
          color="textSecondary"
          className={classes.schemaLabel}
        >
          Validation schema
        </Typography>
        <Box display="flex" alignItems="center" gridGap={6}>
          <Button
            size="small"
            variant="outlined"
            startIcon={<CodeIcon fontSize="small" />}
            onClick={handleOpen}
            color="primary"
          >
            View JSON
          </Button>
        </Box>
      </Box>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>Validation schema</DialogTitle>
        <DialogContent className={classes.dialogContent}>
          <TextField
            value={draft}
            onChange={e => {
              setDraft(e.target.value);
              setParseError('');
            }}
            error={Boolean(parseError)}
            helperText={
              parseError ||
              'JSON Schema object — e.g. {"type":"integer","minimum":0}'
            }
            fullWidth
            multiline
            minRows={14}
            variant="outlined"
            inputProps={{ className: classes.monoInput }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleApply} color="primary" variant="contained">
            Apply
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
import {
  CatalogItemForm,
  catalogItemFromPayload,
  emptyFieldRow,
  hasValidFields,
  validateCatalogItemForm,
} from '../catalogItemFormTypes';
import type { FieldRow } from '../catalogItemFormTypes';

type ScalarFields = Omit<CatalogItemForm, 'fields'>;
type TouchedMap = Partial<Record<keyof ScalarFields, boolean>>;

function serviceTypeHelperText(isEditMode: boolean, count: number): string {
  if (isEditMode) return 'Service type cannot be changed after creation';
  if (count === 0)
    return 'No service types available — create one in the Service types tab';
  return 'Select the service type this item is based on';
}

export type CatalogItemFormFieldsProps = Readonly<{
  form: CatalogItemForm;
  setForm: React.Dispatch<React.SetStateAction<CatalogItemForm>>;
  serviceTypes: ServiceType[];
  touched: TouchedMap;
  setTouched: React.Dispatch<React.SetStateAction<TouchedMap>>;
  submitAttempted: boolean;
  /** When true the Service type field is disabled (cannot be changed after creation). */
  isEditMode: boolean;
}>;

export function CatalogItemFormFields({
  form,
  setForm,
  serviceTypes,
  touched,
  setTouched,
  submitAttempted,
  isEditMode,
}: CatalogItemFormFieldsProps) {
  const classes = useStyles();
  const errors = useMemo(() => validateCatalogItemForm(form), [form]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const set =
    (field: keyof ScalarFields) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm(prev => ({ ...prev, [field]: e.target.value }));
      setTouched(prev => ({ ...prev, [field]: true }));
    };

  const setField = (
    index: number,
    key: Exclude<keyof FieldRow, 'id'>,
    value: string | boolean,
  ) =>
    setForm(prev => {
      const updated = [...prev.fields];
      updated[index] = { ...updated[index], [key]: value };
      return { ...prev, fields: updated };
    });

  const addField = () =>
    setForm(prev => ({ ...prev, fields: [...prev.fields, emptyFieldRow()] }));

  const removeField = (index: number) =>
    setForm(prev => {
      const remaining = prev.fields.filter((_, i) => i !== index);
      return {
        ...prev,
        fields: remaining.length > 0 ? remaining : [emptyFieldRow()],
      };
    });

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isYaml = file.name.endsWith('.yaml') || file.name.endsWith('.yml');
    file
      .text()
      .then(text => {
        const parsed = isYaml ? loadYaml(text) : JSON.parse(text);
        setForm(catalogItemFromPayload(parsed));
        setTouched({});
      })
      .catch(() => {
        // silently ignore parse errors; form remains unchanged
      });
    e.target.value = '';
  };

  const showFieldsError = submitAttempted && !hasValidFields(form);

  return (
    <Box display="flex" flexDirection="column" gridGap={16}>
      <Box display="flex" justifyContent="flex-end">
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,.yaml,.yml"
          hidden
          onChange={handleImportFile}
        />
        <Tooltip title="Fill the form from a JSON or YAML catalog item definition">
          <Button
            size="small"
            startIcon={<PublishIcon />}
            onClick={() => fileInputRef.current?.click()}
            className={classes.importButton}
          >
            Import from file
          </Button>
        </Tooltip>
      </Box>

      <TextField
        label="Display name *"
        helperText={
          touched.display_name && errors.display_name
            ? errors.display_name
            : 'Human-readable name for this catalog item (max 63 characters)'
        }
        error={Boolean(touched.display_name && errors.display_name)}
        value={form.display_name}
        onChange={set('display_name')}
        onBlur={() => setTouched(prev => ({ ...prev, display_name: true }))}
        fullWidth
        variant="outlined"
        size="small"
      />

      <TextField
        label="API version *"
        helperText={
          touched.api_version && errors.api_version
            ? errors.api_version
            : 'Must follow the pattern v<number>[alpha|beta][number] — e.g. v1, v1alpha1'
        }
        error={Boolean(touched.api_version && errors.api_version)}
        value={form.api_version}
        onChange={set('api_version')}
        onBlur={() => setTouched(prev => ({ ...prev, api_version: true }))}
        fullWidth
        variant="outlined"
        size="small"
      />

      <FormControl
        variant="outlined"
        size="small"
        fullWidth
        disabled={isEditMode}
      >
        <InputLabel shrink>Service type</InputLabel>
        <Select
          value={form.service_type}
          onChange={e =>
            setForm(prev => ({
              ...prev,
              service_type: e.target.value as string,
            }))
          }
          displayEmpty
          input={<OutlinedInput notched label="Service type" />}
        >
          <MenuItem value="">
            <em>None</em>
          </MenuItem>
          {serviceTypes.map(st => (
            <MenuItem key={st.uid ?? st.service_type} value={st.service_type}>
              {st.service_type}
            </MenuItem>
          ))}
        </Select>
        <FormHelperText>
          {serviceTypeHelperText(isEditMode, serviceTypes.length)}
        </FormHelperText>
      </FormControl>

      <Divider />
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Typography variant="subtitle2">
          Fields *{' '}
          <Typography variant="caption" color="textSecondary">
            (at least one required)
          </Typography>
        </Typography>
        <Button
          size="small"
          startIcon={<AddIcon />}
          onClick={addField}
          color="primary"
        >
          Add field
        </Button>
      </Box>

      {showFieldsError && (
        <Typography variant="caption" color="error">
          Add at least one field with a non-empty path.
        </Typography>
      )}

      {form.fields.map((row, i) => (
        <Box
          key={row.id}
          display="flex"
          flexDirection="column"
          gridGap={8}
          className={classes.fieldRow}
        >
          {/* Primary row: path, display name, editable toggle, delete */}
          <Box display="flex" alignItems="flex-start" gridGap={8}>
            <Box flex={2}>
              <TextField
                label="Path *"
                helperText="e.g. config.replicas"
                value={row.path}
                onChange={e => setField(i, 'path', e.target.value)}
                fullWidth
                variant="outlined"
                size="small"
              />
            </Box>
            <Box flex={2}>
              <TextField
                label="Display name"
                value={row.display_name}
                onChange={e => setField(i, 'display_name', e.target.value)}
                fullWidth
                variant="outlined"
                size="small"
              />
            </Box>
            <Box
              display="flex"
              alignItems="center"
              className={classes.fieldRowSwitch}
            >
              <FormControlLabel
                control={
                  <Switch
                    size="small"
                    checked={row.editable}
                    onChange={e => setField(i, 'editable', e.target.checked)}
                    color="primary"
                  />
                }
                label={<Typography variant="caption">Editable</Typography>}
              />
            </Box>
            <IconButton
              size="small"
              aria-label="Remove field"
              onClick={() => removeField(i)}
              className={classes.fieldRowDelete}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>

          {/* Secondary row: default value and validation schema */}
          <Box display="flex" alignItems="flex-start" gridGap={8}>
            <Box flex={1}>
              <TextField
                label="Default value"
                helperText='Any JSON value — e.g. 42, "hello", true, [1,2]'
                value={row.default_value}
                onChange={e => setField(i, 'default_value', e.target.value)}
                fullWidth
                variant="outlined"
                size="small"
                multiline
                minRows={2}
              />
            </Box>
            <Box flex={1} paddingTop={0.5}>
              <SchemaButton
                value={row.validation_schema}
                onChange={v => setField(i, 'validation_schema', v)}
              />
            </Box>
          </Box>
        </Box>
      ))}
    </Box>
  );
}
