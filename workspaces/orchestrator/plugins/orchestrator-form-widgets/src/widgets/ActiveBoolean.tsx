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
  const staticDefault = coerceToBoolean(uiProps['fetch:response:default']);
  const hasStaticDefault = staticDefault !== undefined;
  const skipInitialValue = uiProps['fetch:skipInitialValue'] === true;
  const hasFetchUrl = !!uiProps['fetch:url'];
  const clearOnRetrigger = uiProps['fetch:clearOnRetrigger'] === true;

  const [localError] = useState<string | undefined>(
    hasFetchUrl && !defaultValueSelector && !hasStaticDefault
      ? `When fetch:url is configured, either fetch:response:value or fetch:response:default should be set for ${props.id}.`
      : undefined,
  );

  const retrigger = useRetriggerEvaluate(
    templateUnitEvaluator,
    formData,
    uiProps['fetch:retrigger'] as string[],
  );

  const { data, error, loading } = useFetch(
    formData ?? {},
    uiProps,
    retrigger,
    formContext?.onSamlSsoError,
  );

  const { completeLoading, wrapProcessing } = useProcessingState(
    loading,
    formContext?.handleFetchStarted,
    formContext?.handleFetchEnded,
  );

  const handleChange = useCallback(
    (changed: boolean, isByUser: boolean) => {
      if (isByUser && setIsChangedByUser) {
        setIsChangedByUser(id, true);
      }
      onChange(changed);
    },
    [onChange, id, setIsChangedByUser],
  );

  const handleClear = useCallback(
    () => handleChange(false, false),
    [handleChange],
  );

  useClearOnRetrigger({
    enabled: clearOnRetrigger,
    retrigger,
    onClear: handleClear,
  });

  useEffect(() => {
    if (!data || (clearOnRetrigger && loading)) return;

    if (!skipInitialValue && !isChangedByUser && defaultValueSelector) {
      wrapProcessing(async () => {
        const resolvedSelector = await evaluateFetchResponseSelectorTemplate({
          template: defaultValueSelector,
          key: 'fetch:response:value',
          unitEvaluator: templateUnitEvaluator,
          formData: formData ?? {},
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
      });
    }
  }, [
    data,
    loading,
    clearOnRetrigger,
    skipInitialValue,
    isChangedByUser,
    defaultValueSelector,
    wrapProcessing,
    templateUnitEvaluator,
    formData,
    uiProps,
    value,
    handleChange,
  ]);

  if (localError || (error && uiProps['fetch:error:silent'] !== true)) {
    return <ErrorText text={localError ?? error!} id={id} />;
  }

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
