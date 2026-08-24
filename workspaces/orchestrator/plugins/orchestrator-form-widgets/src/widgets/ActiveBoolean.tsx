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
import { JsonObject } from '@backstage/types';
import { Widget } from '@rjsf/utils';
import { JSONSchema7 } from 'json-schema';

import CircularProgress from '@mui/material/CircularProgress';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';

import { OrchestratorFormContextProps } from '@red-hat-developer-hub/backstage-plugin-orchestrator-form-api';

import {
  useRetriggerEvaluate,
  useTemplateUnitEvaluator,
  useFetch,
  applySelectorString,
  useProcessingState,
  useClearOnRetrigger,
  evaluateFetchResponseSelectorTemplate,
} from '../utils';
import { ErrorText } from './ErrorText';
import { UiProps } from '../uiPropTypes';

const coerceToBoolean = (value: any): boolean | undefined => {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    const lower = value.toLowerCase().trim();
    if (lower === 'true' || lower === '1') {
      return true;
    }
    if (lower === 'false' || lower === '0') {
      return false;
    }
  }
  if (typeof value === 'number') {
    return value !== 0;
  }
  return undefined;
};

export const ActiveBoolean: Widget<
  JsonObject,
  JSONSchema7,
  OrchestratorFormContextProps
> = props => {
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
  const staticDefault = uiProps['fetch:response:default'];
  const hasStaticDefault =
    typeof staticDefault === 'boolean' ||
    staticDefault === 'true' ||
    staticDefault === 'false' ||
    staticDefault === '1' ||
    staticDefault === '0';
  const skipInitialValue = uiProps['fetch:skipInitialValue'] === true;
  const hasFetchUrl = !!uiProps['fetch:url'];
  const clearOnRetrigger = uiProps['fetch:clearOnRetrigger'] === true;

  // If fetch:url is configured, either fetch:response:value OR fetch:response:default should be set
  // to provide meaningful behavior. Without fetch:url, the widget works as a plain checkbox.
  const [localError] = useState<string | undefined>(
    hasFetchUrl && !defaultValueSelector && !hasStaticDefault
      ? `When fetch:url is configured, either fetch:response:value or fetch:response:default should be set for ${props.id}.`
      : undefined,
  );

  const handleFetchStarted = formContext?.handleFetchStarted;
  const handleFetchEnded = formContext?.handleFetchEnded;

  const retrigger = useRetriggerEvaluate(
    templateUnitEvaluator,
    formData,
    /* This is safe retype, since proper checking of input value is done in the useRetriggerEvaluate() hook */
    uiProps['fetch:retrigger'] as string[],
  );

  const { data, error, loading } = useFetch(
    formData ?? {},
    uiProps,
    retrigger,
    formContext?.onSamlSsoError,
  );

  // Track the complete loading state (fetch + processing)
  const { completeLoading, wrapProcessing } = useProcessingState(
    loading,
    handleFetchStarted,
    handleFetchEnded,
  );

  const handleChange = useCallback(
    (changed: boolean, isByUser: boolean) => {
      if (isByUser && setIsChangedByUser) {
        // we must handle this change out of this component's state since the component can be (de)mounted on wizard transitions or by the SchemaUpdater
        setIsChangedByUser(id, true);
      }
      onChange(changed);
    },
    [onChange, id, setIsChangedByUser],
  );

  const handleClear = useCallback(() => {
    handleChange(false, false);
  }, [handleChange]);

  useClearOnRetrigger({
    enabled: clearOnRetrigger,
    retrigger,
    onClear: handleClear,
  });

  // Process fetch results - only override if fetch returns a valid boolean value
  // Static defaults are applied at form initialization level (in OrchestratorForm)
  useEffect(() => {
    if (clearOnRetrigger && loading) {
      return;
    }

    if (!data) {
      return;
    }

    const doItAsync = async () => {
      await wrapProcessing(async () => {
        const fd = formData ?? {};
        // Only apply fetched value if user hasn't changed the field
        if (!skipInitialValue && !isChangedByUser && defaultValueSelector) {
          const resolvedSelector = await evaluateFetchResponseSelectorTemplate({
            template: defaultValueSelector,
            key: 'fetch:response:value',
            unitEvaluator: templateUnitEvaluator,
            formData: fd,
            responseData: data,
            uiProps,
          });
          const fetchedValue = await applySelectorString(
            data,
            resolvedSelector,
            true,
          );

          const coercedValue = coerceToBoolean(fetchedValue);
          if (coercedValue !== undefined && value !== coercedValue) {
            handleChange(coercedValue, false);
          }
        }
      });
    };

    doItAsync();
  }, [
    defaultValueSelector,
    data,
    formData,
    uiProps,
    templateUnitEvaluator,
    props.id,
    value,
    handleChange,
    isChangedByUser,
    skipInitialValue,
    wrapProcessing,
    clearOnRetrigger,
    loading,
  ]);

  const shouldShowFetchError = uiProps['fetch:error:silent'] !== true;
  const displayError = localError ?? (shouldShowFetchError ? error : undefined);
  if (displayError) {
    return <ErrorText text={displayError} id={id} />;
  }

  // Show loading only if we don't have a static default value to display
  // This ensures the default is shown instantly while fetch happens in background
  if (completeLoading && !hasStaticDefault) {
    return <CircularProgress size={20} />;
  }

  return (
    <FormControl variant="outlined" fullWidth>
      <FormControlLabel
        control={
          <Checkbox
            checked={!!value}
            onChange={event => handleChange(event.target.checked, true)}
            disabled={isReadOnly}
            data-testid={`${id}-checkbox`}
          />
        }
        label={label}
      />
    </FormControl>
  );
};
