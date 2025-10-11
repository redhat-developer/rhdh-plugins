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
import clsx from 'clsx';
import { makeStyles } from 'tss-react/mui';
import { Widget } from '@rjsf/utils';
import { JsonObject } from '@backstage/types';
import { JSONSchema7 } from 'json-schema';
import { OrchestratorFormContextProps } from '@red-hat-developer-hub/backstage-plugin-orchestrator-form-api';

import CircularProgress from '@mui/material/CircularProgress';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';

import {
  useFetch,
  useRetriggerEvaluate,
  useTemplateUnitEvaluator,
  applySelectorArray,
} from '../utils';
import { UiProps } from '../uiPropTypes';
import { ErrorText } from './ErrorText';

const useStyles = makeStyles()(theme => ({
  menuItem: {
    // Workaround, we still have mix of Material 4 and 5 CSS in production, conflict with MuiButtonBase-root
    display: 'flex !important',
    justifyContent: 'flex-start !important',
    paddingTop: '8px !important',
    paddingBottom: '8px !important',
    paddingLeft: '16px !important',
  },
  menuItemSelected: {
    backgroundColor: `${theme.palette.action.selected} !important`,
  },
}));

export const ActiveDropdown: Widget<
  JsonObject,
  JSONSchema7,
  OrchestratorFormContextProps
> = props => {
  const { classes } = useStyles();
  const templateUnitEvaluator = useTemplateUnitEvaluator();

  const { id, label, value, onChange, formContext } = props;
  const formData = formContext?.formData;
  const labelId = `${props.id}-label`;

  const uiProps = useMemo(
    () => (props.options?.props ?? {}) as UiProps,
    [props.options?.props],
  );
  const isReadOnly = !!props.readonly;

  const labelSelector = uiProps['fetch:response:label']?.toString();
  const valueSelector = uiProps['fetch:response:value']?.toString();

  const [localError, setLocalError] = useState<string | undefined>(
    !labelSelector || !valueSelector
      ? `Both fetch:response:label and fetch:response:value needs to be set for ${props.id}.`
      : undefined,
  );
  const [labels, setLabels] = useState<string[]>();
  const [values, setValues] = useState<string[]>();

  const retrigger = useRetriggerEvaluate(
    templateUnitEvaluator,
    formData,
    /* This is safe retype, since proper checking of input value is done in the useRetriggerEvaluate() hook */
    uiProps['fetch:retrigger'] as string[],
  );

  const { data, error, loading } = useFetch(formData ?? {}, uiProps, retrigger);

  useEffect(() => {
    if (!data || !labelSelector || !valueSelector) {
      return;
    }

    const doItAsync = async () => {
      const selectedLabels = await applySelectorArray(data, labelSelector);
      const selectedValues = await applySelectorArray(data, valueSelector);

      if (selectedLabels.length !== selectedValues.length) {
        setLocalError(
          `Selected labels and values have different count (${selectedLabels.length} and ${selectedValues.length}) for ${props.id}`,
        );
        return;
      }

      setLabels(selectedLabels);
      setValues(selectedValues);
    };

    doItAsync();
  }, [labelSelector, valueSelector, data, props.id]);

  const handleChange = useCallback(
    (changed: string) => {
      onChange(changed);
    },
    [onChange],
  );

  useEffect(() => {
    if (!value && values && values.length > 0) {
      handleChange(values[0]);
    }
  }, [handleChange, value, values]);

  if (localError ?? error) {
    return <ErrorText text={localError ?? error ?? ''} id={id} />;
  }

  if (loading || !labels || !values) {
    return <CircularProgress size={20} />;
  }

  return (
    <FormControl variant="outlined" fullWidth>
      <InputLabel id={labelId}>{label}</InputLabel>
      <Select
        labelId={labelId}
        id={id}
        data-testid={id}
        value={value}
        label={label}
        disabled={isReadOnly}
        onChange={event => handleChange(event.target.value as string)}
        MenuProps={{
          PaperProps: { sx: { maxHeight: '20rem' } },
        }}
      >
        {labels.map((itemLabel, idx) => (
          <MenuItem
            key={values[idx]}
            value={values[idx]}
            data-testid={`${id}-menuitem-${values[idx]}`}
            className={clsx(
              classes.menuItem,
              value === values[idx] && classes.menuItemSelected,
            )}
          >
            {itemLabel}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};
