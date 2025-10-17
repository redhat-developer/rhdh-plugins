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
  const isReadOnly = !!props.readonly;

  const defaultValueSelector = uiProps['fetch:response:value']?.toString();
  const autocompleteSelector =
    uiProps['fetch:response:autocomplete']?.toString();

  const [localError] = useState<string | undefined>(
    !defaultValueSelector
      ? `The fetch:response:value needs to be set for ${props.id}.`
      : undefined,
  );
  const [autocompleteOptions, setAutocompleteOptions] = useState<string[]>();
  const [isProcessing, setIsProcessing] = useState(false);

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
  const completeLoading = loading || isProcessing;
  useEffect(() => {
    if (completeLoading && handleFetchStarted) {
      handleFetchStarted();
      return () => {
        if (handleFetchEnded) {
          handleFetchEnded();
        }
      };
    }
    return undefined;
  }, [completeLoading, handleFetchStarted, handleFetchEnded]);

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

  useEffect(() => {
    if (!data || !defaultValueSelector) {
      return;
    }

    const doItAsync = async () => {
      setIsProcessing(true);
      try {
        if (!isChangedByUser) {
          // loading default so replace the value unless the user touched the field
          const defaultValue = await applySelectorString(
            data,
            defaultValueSelector,
          );

          if (
            value !== defaultValue &&
            defaultValue &&
            defaultValue !== null &&
            defaultValue !== 'null'
          ) {
            handleChange(defaultValue, false);
          }
        }

        if (autocompleteSelector) {
          const autocompleteValues = await applySelectorArray(
            data,
            autocompleteSelector,
          );
          setAutocompleteOptions(autocompleteValues);
        }
      } finally {
        setIsProcessing(false);
      }
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
  ]);

  if (localError ?? error) {
    return <ErrorText text={localError ?? error ?? ''} id={id} />;
  }

  if (loading) {
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
      />
    </FormControl>
  );
};
