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
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { JsonObject } from '@backstage/types';
import { Widget } from '@rjsf/utils';
import { JSONSchema7 } from 'json-schema';
import { CircularProgress, FormControl, TextField } from '@material-ui/core';
import { Autocomplete, AutocompleteRenderInputParams } from '@material-ui/lab';
import { useWrapperFormPropsContext } from '@red-hat-developer-hub/backstage-plugin-orchestrator-form-api';

import { FormContextData } from '../types';
import {
  useRetriggerEvaluate,
  useTemplateUnitEvaluator,
  useFetch,
} from '../utils';
import { ErrorText } from './ErrorText';
import {
  applySelectorArray,
  applySelectorString,
} from '../utils/applySelector';
import { UiProps } from '../uiPropTypes';

export const ActiveTextInput: Widget<
  JsonObject,
  JSONSchema7,
  FormContextData
> = props => {
  const templateUnitEvaluator = useTemplateUnitEvaluator();
  const formContext = useWrapperFormPropsContext();

  const { formData } = formContext;
  const { label, value, onChange } = props;
  const uiProps = useMemo(
    () => (props.options?.props ?? {}) as UiProps,
    [props.options?.props],
  );

  const defaultValueSelector = uiProps['fetch:response:value']?.toString();
  const autocompleteSelector =
    uiProps['fetch:response:autocomplete']?.toString();

  const [localError] = useState<string | undefined>(
    !defaultValueSelector
      ? `The fetch:response:value needs to be set for ${props.id}.`
      : undefined,
  );
  const [autocompleteOptions, setAutocompleteOptions] = useState<string[]>();

  const retrigger = useRetriggerEvaluate(
    templateUnitEvaluator,
    formData,
    /* This is safe retype, since proper checking of input value is done in the useRetriggerEvaluate() hook */
    uiProps['fetch:retrigger'] as string[],
  );

  const { data, error, loading } = useFetch(formData, uiProps, retrigger);

  const handleChange = useCallback(
    (changed: string) => {
      onChange(changed);
    },
    [onChange],
  );

  useEffect(() => {
    if (!data || !defaultValueSelector) {
      return;
    }

    const doItAsync = async () => {
      if (value === undefined) {
        // loading default so do it only once
        const defaultValue = await applySelectorString(
          data,
          defaultValueSelector,
        );
        handleChange(defaultValue);
      }

      if (autocompleteSelector) {
        const autocompleteValues = await applySelectorArray(
          data,
          autocompleteSelector,
        );
        setAutocompleteOptions(autocompleteValues);
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
  ]);

  if (localError ?? error) {
    return <ErrorText text={localError ?? error ?? ''} />;
  }

  if (loading) {
    return <CircularProgress size={20} />;
  }

  if (autocompleteOptions) {
    const renderInput = (params: AutocompleteRenderInputParams) => (
      <TextField
        {...params}
        onChange={event => handleChange(event.target.value)}
        label={label}
      />
    );

    return (
      <FormControl variant="outlined" fullWidth>
        <Autocomplete
          options={autocompleteOptions}
          value={value}
          onChange={(_, v) => handleChange(v)}
          renderInput={renderInput}
        />
      </FormControl>
    );
  }

  return (
    <FormControl variant="outlined" fullWidth>
      <TextField
        value={value ?? ''}
        onChange={event => handleChange(event.target.value)}
        label={label}
      />
    </FormControl>
  );
};
