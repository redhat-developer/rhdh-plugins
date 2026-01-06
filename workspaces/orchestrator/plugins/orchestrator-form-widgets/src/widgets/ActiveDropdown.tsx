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
  useProcessingState,
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
  const isChangedByUser = !!formContext?.getIsChangedByUser(id);
  const setIsChangedByUser = formContext?.setIsChangedByUser;

  const labelId = `${props.id}-label`;

  const uiProps = useMemo(
    () => (props.options?.props ?? {}) as UiProps,
    [props.options?.props],
  );
  const isReadOnly = !!props?.schema.readOnly;

  const labelSelector = uiProps['fetch:response:label']?.toString();
  const valueSelector = uiProps['fetch:response:value']?.toString();
  const staticDefault = uiProps['fetch:response:default'];
  const staticDefaultValue =
    typeof staticDefault === 'string' ? staticDefault : undefined;

  const [localError, setLocalError] = useState<string | undefined>(
    !labelSelector || !valueSelector
      ? `Both fetch:response:label and fetch:response:value needs to be set for ${props.id}.`
      : undefined,
  );
  const [labels, setLabels] = useState<string[]>();
  const [values, setValues] = useState<string[]>();

  const handleFetchStarted = formContext?.handleFetchStarted;
  const handleFetchEnded = formContext?.handleFetchEnded;

  const retrigger = useRetriggerEvaluate(
    templateUnitEvaluator,
    formData,
    /* This is safe retype, since proper checking of input value is done in the useRetriggerEvaluate() hook */
    uiProps['fetch:retrigger'] as string[],
  );

  const { data, error, loading } = useFetch(formData ?? {}, uiProps, retrigger);

  // Track the complete loading state (fetch + processing)
  const { completeLoading, wrapProcessing } = useProcessingState(
    loading,
    handleFetchStarted,
    handleFetchEnded,
  );

  useEffect(() => {
    if (!data || !labelSelector || !valueSelector) {
      return;
    }

    const doItAsync = async () => {
      await wrapProcessing(async () => {
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
      });
    };

    doItAsync();
  }, [labelSelector, valueSelector, data, props.id, wrapProcessing]);

  const handleChange = useCallback(
    (changed: string, isByUser: boolean) => {
      if (isByUser && setIsChangedByUser) {
        // we must handle this change out of this component's state since the component can be (de)mounted on wizard transitions or by the SchemaUpdater
        setIsChangedByUser(id, true);
      }
      onChange(changed);
    },
    [onChange, id, setIsChangedByUser],
  );

  // Set default value from fetched options
  // Priority: static default (if valid option) > first fetched option
  // Note: Static defaults are applied at form initialization level (in OrchestratorForm)
  useEffect(() => {
    if (!isChangedByUser && !value && values && values.length > 0) {
      // If static default is provided and is a valid option, use it
      if (staticDefaultValue && values.includes(staticDefaultValue)) {
        handleChange(staticDefaultValue, false);
      } else {
        // Otherwise use the first fetched value
        handleChange(values[0], false);
      }
    }
  }, [handleChange, value, values, isChangedByUser, staticDefaultValue]);

  if (localError ?? error) {
    return <ErrorText text={localError ?? error ?? ''} id={id} />;
  }

  // Compute display options: use fetched options, or fall back to static default
  const hasOptions = labels && labels.length > 0 && values && values.length > 0;
  const hasFallbackDefault = !hasOptions && staticDefaultValue;

  // Show loading only if we have no options AND no fallback default
  if (completeLoading && !hasFallbackDefault) {
    return <CircularProgress size={20} />;
  }

  // If still loading but no options yet and no fallback, show spinner
  if (!hasOptions && !hasFallbackDefault) {
    return <CircularProgress size={20} />;
  }

  // Use fetched options or fallback to static default as single option
  const displayLabels = hasOptions ? labels : [staticDefaultValue!];
  const displayValues = hasOptions ? values : [staticDefaultValue!];

  return (
    <FormControl variant="outlined" fullWidth>
      <InputLabel id={labelId}>{label}</InputLabel>
      <Select
        labelId={labelId}
        id={id}
        data-testid={id}
        value={value ?? ''}
        label={label}
        disabled={isReadOnly}
        onChange={event => handleChange(event.target.value as string, true)}
        MenuProps={{
          PaperProps: { sx: { maxHeight: '20rem' } },
        }}
      >
        {displayLabels.map((itemLabel, idx) => (
          <MenuItem
            key={displayValues[idx]}
            value={displayValues[idx]}
            data-testid={`${id}-menuitem-${displayValues[idx]}`}
            className={clsx(
              classes.menuItem,
              value === displayValues[idx] && classes.menuItemSelected,
            )}
          >
            {itemLabel}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};
