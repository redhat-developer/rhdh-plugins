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
import { fetchApiRef, useApi } from '@backstage/core-plugin-api';
import { JSONSchema7 } from 'json-schema';

import { useWrapperFormPropsContext } from '@red-hat-developer-hub/backstage-plugin-orchestrator-form-api';
import { FormContextData } from '../types';
import {
  useRequestInit,
  useEvaluateTemplate,
  useRetriggerEvaluate,
  useTemplateUnitEvaluator,
} from '../utils';
import { ErrorText } from './ErrorText';
import { FormControl, TextField } from '@material-ui/core';
import {
  applySelectorArray,
  applySelectorString,
} from '../utils/applySelector';
import { Autocomplete, AutocompleteRenderInputParams } from '@material-ui/lab';

export const ActiveTextInput: Widget<
  JsonObject,
  JSONSchema7,
  FormContextData
> = props => {
  const fetchApi = useApi(fetchApiRef);
  const templateUnitEvaluator = useTemplateUnitEvaluator();
  const formContext = useWrapperFormPropsContext();
  const [_, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [autocompleteOptions, setAutocompleteOptions] = useState<string[]>();

  const { formData } = formContext;

  const { label, value, onChange } = props;

  const uiProps = useMemo(
    () => (props.options?.props ?? {}) as JsonObject,
    [props.options?.props],
  );
  const fetchUrl = uiProps['fetch:url']?.toString();
  const defaultValueSelector = uiProps['fetch:response:value']?.toString();
  const autocompleteSelector =
    uiProps['fetch:response:autocomplete']?.toString();

  const retrigger = useRetriggerEvaluate(
    templateUnitEvaluator,
    formData,
    /* This is safe retype, since proper checking of input value is done in the useRetriggerEvaluate() hook */
    uiProps['fetch:retrigger'] as string[],
  );

  const evaluatedFetchUrl = useEvaluateTemplate({
    template: fetchUrl,
    key: 'fetch:url',
    formData,
    setError,
  });
  const evaluatedRequestInit = useRequestInit({
    uiProps,
    prefix: 'fetch',
    formData,
    setError,
  });

  const handleChange = useCallback(
    (changed: string) => {
      onChange(changed);
    },
    [onChange],
  );

  useEffect(() => {
    const fetchDefaultData = async () => {
      if (
        !evaluatedFetchUrl ||
        !evaluatedRequestInit ||
        !retrigger ||
        !defaultValueSelector
      ) {
        // Not yet ready to fetch
        return;
      }

      const firstTime = value === undefined;
      if (!firstTime && !autocompleteSelector) {
        // No need to fetch
        return;
      }

      try {
        setLoading(true);
        setError(undefined);

        const response = await fetchApi.fetch(
          evaluatedFetchUrl,
          evaluatedRequestInit,
        );
        const data = (await response.json()) as JsonObject;

        // validate received response before updating
        if (!data) {
          throw new Error('Empty response received');
        }
        if (typeof data !== 'object') {
          throw new Error('JSON object expected');
        }

        const selected = await applySelectorString(data, defaultValueSelector);
        if (autocompleteSelector) {
          const autocompleteValues = await applySelectorArray(
            data,
            autocompleteSelector,
          );
          setAutocompleteOptions(autocompleteValues);
        }

        if (firstTime) {
          // loading default so do it only once
          handleChange(selected);
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error(
          'Error when fetching default ActiveTextInput data',
          props.id,
          evaluatedFetchUrl,
          err,
        );
        setError(`Failed to fetch data for ${props.id} ActiveTextInput`);
      } finally {
        setLoading(false);
      }
    };

    fetchDefaultData();
  }, [
    evaluatedFetchUrl,
    evaluatedRequestInit,
    autocompleteSelector,
    defaultValueSelector,
    fetchApi,
    props.id,
    value,
    handleChange,
    // no need to expand the "retrigger" array here since its identity changes only if an item changes
    retrigger,
  ]);

  if (!fetchUrl || !defaultValueSelector) {
    // eslint-disable-next-line no-console
    console.warn(
      'ActiveInputData, incorrect ui:props, missing either fetch:url or fetch:response:value selector:',
      props.id,
      props.schema,
    );
    return <div>Misconfigured ActiveInputData</div>;
  }

  if (error) {
    return <ErrorText text={error} />;
  }

  if (autocompleteOptions) {
    const renderInput = (params: AutocompleteRenderInputParams) => {
      const autocompleteValue = (
        params.inputProps as unknown as { value: string }
      ).value;
      if (autocompleteValue !== value) {
        handleChange(autocompleteValue);
      }

      return (
        <TextField
          {...params}
          value={value ?? ''}
          onChange={event => handleChange(event.target.value)}
          label={label}
        />
      );
    };

    return (
      <FormControl variant="outlined" fullWidth>
        <Autocomplete options={autocompleteOptions} renderInput={renderInput} />
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
