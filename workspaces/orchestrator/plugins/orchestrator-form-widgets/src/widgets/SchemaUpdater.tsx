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
import React, { useEffect, useMemo, useState } from 'react';
import { Widget } from '@rjsf/utils';
import { JSONSchema7 } from 'json-schema';
import { JsonObject } from '@backstage/types';
import {
  SchemaChunksResponse,
  OrchestratorFormContextProps,
} from '@red-hat-developer-hub/backstage-plugin-orchestrator-form-api';
import { CircularProgress } from '@material-ui/core';

import {
  useRetriggerEvaluate,
  useTemplateUnitEvaluator,
  useFetch,
} from '../utils';
import { ErrorText } from './ErrorText';
import { UiProps } from '../uiPropTypes';

export const SchemaUpdater: Widget<
  JsonObject,
  JSONSchema7,
  OrchestratorFormContextProps
> = props => {
  const templateUnitEvaluator = useTemplateUnitEvaluator();

  const { formContext } = props;
  const formData = formContext?.formData;

  const updateSchema = formContext?.updateSchema;

  const uiProps = useMemo(
    () => (props.options?.props ?? {}) as UiProps,
    [props.options?.props],
  );
  const [localError, setLocalError] = useState<string>();

  const retrigger = useRetriggerEvaluate(
    templateUnitEvaluator,
    formData,
    /* This is safe retype, since proper checking of input value is done in the useRetriggerEvaluate() hook */
    uiProps['fetch:retrigger'] as string[],
  );

  const { data, error, loading } = useFetch(formData ?? {}, uiProps, retrigger);

  useEffect(() => {
    if (!data) {
      return;
    }

    if (!updateSchema) {
      setLocalError('Missing the updateSchema() function in form context.');
      return;
    }

    const typedData = data as unknown as SchemaChunksResponse;

    // validate received response before updating
    Object.keys(typedData).forEach(key => {
      if (!typedData[key]?.type) {
        setLocalError(
          `JSON response malformed for SchemaUpdater, missing "type" field for "${key}" key.`,
        );
      }
    });

    try {
      updateSchema(typedData);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error when updating schema', props.id, err);
      setLocalError(
        `Failed to update schema update by the ${props.id} SchemaUpdater`,
      );
    }
  }, [data, props.id, updateSchema]);

  if (localError ?? error) {
    return <ErrorText text={localError ?? error ?? ''} />;
  }

  if (loading) {
    return <CircularProgress size={20} />;
  }
  // No need to render anything
  return <></>;
};
