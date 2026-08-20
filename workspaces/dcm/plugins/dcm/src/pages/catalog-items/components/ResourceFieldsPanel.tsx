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
  Button,
  FormControlLabel,
  IconButton,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import AddIcon from '@material-ui/icons/Add';
import DeleteIcon from '@material-ui/icons/Delete';
import { SchemaButton } from '../../../components/SchemaButton';
import { useTranslation } from '../../../hooks/useTranslation';
import {
  emptyFieldRow,
  hasValidFields,
  validateFieldRows,
} from '../catalogItemFormTypes';
import type { FieldRow, FieldRowErrors } from '../catalogItemFormTypes';

const useStyles = makeStyles(theme => ({
  fieldRow: {
    background: theme.palette.action.hover,
    borderRadius: theme.shape.borderRadius,
    padding: theme.spacing(1.25, 1.5),
  },
  fieldRowSwitch: {
    paddingTop: theme.spacing(0.75),
  },
  fieldRowDelete: {
    marginTop: theme.spacing(0.5),
  },
}));

export type ResourceFieldsPanelProps = Readonly<{
  fields: FieldRow[];
  onChange: (fields: FieldRow[]) => void;
  submitAttempted?: boolean;
}>;

/**
 * Renders the field-row table for a single resource within the catalog item
 * wizard. Handles add/remove and inline per-row validation.
 */
export function ResourceFieldsPanel({
  fields,
  onChange,
  submitAttempted = false,
}: ResourceFieldsPanelProps) {
  const classes = useStyles();
  const { t } = useTranslation();
  const fieldRowErrors = useMemo(
    () => validateFieldRows(fields, t),
    [fields, t],
  );

  const setField = (
    index: number,
    key: Exclude<keyof FieldRow, 'id'>,
    value: string | boolean,
  ) => {
    const updated = [...fields];
    updated[index] = { ...updated[index], [key]: value };
    onChange(updated);
  };

  const canAddField = fields.length === 0 || fields.at(-1)!.path.trim() !== '';

  const addField = () => {
    if (!canAddField) return;
    onChange([...fields, emptyFieldRow()]);
  };

  const removeField = (index: number) => {
    const remaining = fields.filter((_, i) => i !== index);
    onChange(remaining.length > 0 ? remaining : [emptyFieldRow()]);
  };

  const showFieldsError = submitAttempted && !hasValidFields(fields);

  return (
    <Box display="flex" flexDirection="column" gridGap={12}>
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Typography variant="subtitle2">
          {t('catalogItems.form.fieldsLabel')}{' '}
          <Typography variant="caption" color="textSecondary">
            {t('catalogItems.form.fieldsCaption')}
          </Typography>
        </Typography>
        <Tooltip
          title={canAddField ? '' : t('catalogItems.form.fieldAddTooltip')}
        >
          <Box component="span" display="inline-block">
            <Button
              size="small"
              startIcon={<AddIcon />}
              onClick={addField}
              color="primary"
              disabled={!canAddField}
            >
              {t('catalogItems.form.fieldAddButton')}
            </Button>
          </Box>
        </Tooltip>
      </Box>

      {showFieldsError && (
        <Typography variant="caption" color="error">
          {t('catalogItems.form.fieldsErrorEmpty')}
        </Typography>
      )}

      {fields.map((row, i) => {
        const rowErrors: FieldRowErrors = fieldRowErrors[i] ?? {};
        return (
          <Box
            key={row.id}
            display="flex"
            flexDirection="column"
            gridGap={8}
            className={classes.fieldRow}
          >
            <Box display="flex" alignItems="flex-start" gridGap={8}>
              <Box flex={2}>
                <TextField
                  label={t('catalogItems.form.fieldPathLabel')}
                  helperText={
                    rowErrors.path ?? t('catalogItems.form.fieldPathHelper')
                  }
                  error={Boolean(rowErrors.path)}
                  value={row.path}
                  onChange={e => setField(i, 'path', e.target.value)}
                  fullWidth
                  variant="outlined"
                  size="small"
                />
              </Box>
              <Box flex={2}>
                <TextField
                  label={t('catalogItems.form.fieldDisplayNameLabel')}
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
                  label={
                    <Typography variant="caption">
                      {t('catalogItems.form.fieldEditableLabel')}
                    </Typography>
                  }
                />
              </Box>
              <IconButton
                size="small"
                aria-label={t('catalogItems.form.fieldRemoveAriaLabel')}
                onClick={() => removeField(i)}
                className={classes.fieldRowDelete}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Box>

            <Box display="flex" alignItems="flex-start" gridGap={8}>
              <Box flex={1}>
                <TextField
                  label={t('catalogItems.form.fieldDefaultValueLabel')}
                  helperText={
                    rowErrors.default_value ??
                    t('catalogItems.form.fieldDefaultValueHelper')
                  }
                  error={Boolean(rowErrors.default_value)}
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
                  fieldError={rowErrors.validation_schema}
                />
              </Box>
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}
