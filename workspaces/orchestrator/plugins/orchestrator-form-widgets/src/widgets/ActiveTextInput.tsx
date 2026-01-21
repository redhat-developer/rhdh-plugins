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
import { JsonObject } from '@backstage/types';
import { Widget } from '@rjsf/utils';
import { JSONSchema7 } from 'json-schema';

import { Theme } from '@mui/material/styles';
import { makeStyles } from 'tss-react/mui';
import CircularProgress from '@mui/material/CircularProgress';
import FormControl from '@mui/material/FormControl';
import TextField from '@mui/material/TextField';
import Autocomplete, {
  AutocompleteRenderInputParams,
} from '@mui/material/Autocomplete';

import { OrchestratorFormContextProps } from '@red-hat-developer-hub/backstage-plugin-orchestrator-form-api';

import {
  useRetriggerEvaluate,
  useTemplateUnitEvaluator,
  useFetch,
  applySelectorArray,
  applySelectorString,
  useProcessingState,
} from '../utils';
import { ErrorText } from './ErrorText';
import { UiProps } from '../uiPropTypes';

const useStyles = makeStyles()((theme: Theme) => ({
  autocompleteOptionSelected: {
    backgroundColor: `${theme.palette.action.selected} !important`,
  },
}));

export const ActiveTextInput: Widget<
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

  const uiProps = useMemo(
    () => (props.options?.props ?? {}) as UiProps,
    [props.options?.props],
  );
  const isReadOnly = !!props?.schema.readOnly;

  const defaultValueSelector = uiProps['fetch:response:value']?.toString();
  const autocompleteSelector =
    uiProps['fetch:response:autocomplete']?.toString();
  const staticDefault = uiProps['fetch:response:default'];
  const staticDefaultValue =
    typeof staticDefault === 'string' ? staticDefault : undefined;
  const hasFetchUrl = !!uiProps['fetch:url'];

  // If fetch:url is configured, either fetch:response:value OR fetch:response:default should be set
  // to provide meaningful behavior. Without fetch:url, the widget works as a plain text input.
  const [localError] = useState<string | undefined>(
    hasFetchUrl && !defaultValueSelector && !staticDefaultValue
      ? `When fetch:url is configured, either fetch:response:value or fetch:response:default should be set for ${props.id}.`
      : undefined,
  );
  const [autocompleteOptions, setAutocompleteOptions] = useState<string[]>();

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

  // Process fetch results - only override if fetch returns a non-empty value
  // Static defaults are applied at form initialization level (in OrchestratorForm)
  useEffect(() => {
    if (!data) {
      return;
    }

    const doItAsync = async () => {
      await wrapProcessing(async () => {
        // Only apply fetched value if user hasn't changed the field
        if (!isChangedByUser && defaultValueSelector) {
          const fetchedValue = await applySelectorString(
            data,
            defaultValueSelector,
          );

          if (
            typeof fetchedValue === 'string' &&
            fetchedValue !== 'null' &&
            value !== fetchedValue
          ) {
            handleChange(fetchedValue, false);
          }
        }

        if (autocompleteSelector) {
          const autocompleteValues = await applySelectorArray(
            data,
            autocompleteSelector,
          );
          setAutocompleteOptions(autocompleteValues);
        }
      });
    };

    doItAsync();
  }, [
    defaultValueSelector,
    autocompleteSelector,
    data,
    props.id,
    value,
    handleChange,
    isChangedByUser,
    wrapProcessing,
  ]);

  const shouldShowFetchError = uiProps['fetch:error:silent'] !== true;
  const displayError = localError ?? (shouldShowFetchError ? error : undefined);
  if (displayError) {
    return <ErrorText text={displayError} id={id} />;
  }

  // Show loading only if we don't have a static default value to display
  // This ensures the default is shown instantly while fetch happens in background
  if (completeLoading && !staticDefaultValue) {
    return <CircularProgress size={20} />;
  }

  if (autocompleteOptions) {
    const renderInput = (params: AutocompleteRenderInputParams) => (
      <TextField
        {...params}
        data-testid={`${id}-textfield`}
        onChange={event => handleChange(event.target.value, true)}
        label={label}
        disabled={isReadOnly}
      />
    );

    return (
      <FormControl variant="outlined" fullWidth>
        <Autocomplete
          options={autocompleteOptions}
          data-testid={`${id}-autocomplete`}
          value={value}
          onChange={(_, v) => handleChange(v, true)}
          disabled={isReadOnly}
          renderInput={renderInput}
          renderOption={(liProps, item, state) => {
            return (
              <li
                {...liProps}
                key={item}
                data-testid={`${id}-autocomplete-option-${item}`}
                className={clsx(
                  state.selected && classes.autocompleteOptionSelected,
                  liProps.className,
                )}
              >
                {item}
              </li>
            );
          }}
        />
      </FormControl>
    );
  }

  return (
    <FormControl variant="outlined" fullWidth>
      <TextField
        value={value ?? ''}
        data-testid={`${id}-textfield`}
        onChange={event => handleChange(event.target.value, true)}
        label={label}
        disabled={isReadOnly}
      />
    </FormControl>
  );
};
