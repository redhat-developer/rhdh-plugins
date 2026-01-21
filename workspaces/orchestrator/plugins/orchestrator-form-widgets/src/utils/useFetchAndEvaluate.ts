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

import { JsonObject } from '@backstage/types';
import React, { useState, useEffect } from 'react';
import { UiProps } from '../uiPropTypes';
import { getErrorMessage } from './errorUtils';
import { evaluateTemplateString } from './evaluateTemplate';
import { useFetch } from './useFetch';
import { useRetriggerEvaluate } from './useRetriggerEvaluate';
import { useTemplateUnitEvaluator } from './useTemplateUnitEvaluator';
import { useDebounce } from 'react-use';
import { DEFAULT_DEBOUNCE_LIMIT } from '../widgets/constants';

export const useFetchAndEvaluate = (
  template: string,
  formData: JsonObject,
  uiProps: UiProps,
  fieldId: string,
  handleFetchStarted?: () => void,
  handleFetchEnded?: () => void,
) => {
  const unitEvaluator = useTemplateUnitEvaluator();
  const retrigger = useRetriggerEvaluate(
    unitEvaluator,
    formData,
    uiProps['fetch:retrigger'] as string[],
  );
  const {
    data,
    error: fetchError,
    loading: fetchLoading,
  } = useFetch(formData, uiProps, retrigger);
  const [error, setError] = useState<string>();
  const [loading, setLoading] = React.useState(true);
  const [resultText, setResultText] = React.useState<string>();
  useDebounce(
    () => {
      const evaluate = async () => {
        if (!retrigger || fetchLoading || fetchError) {
          return;
        }
        try {
          setLoading(true);
          setError(undefined);
          const evaluatedText = await evaluateTemplateString({
            template,
            key: fieldId,
            unitEvaluator,
            formData,
            responseData: data,
            uiProps,
          });
          setResultText(evaluatedText?.toString());
        } catch (err) {
          const prefix = `Failed to evaluate text '${template}' for field ${fieldId}`;
          const msg = getErrorMessage(prefix, err);
          setError(msg);
          // eslint-disable-next-line no-console
          console.error(prefix, err);
        } finally {
          setLoading(false);
        }
      };
      evaluate();
    },
    DEFAULT_DEBOUNCE_LIMIT,
    [
      retrigger,
      fetchError,
      fetchLoading,
      fieldId,
      data,
      formData,
      uiProps,
      unitEvaluator,
      template,
    ],
  );

  // Track the complete loading state (fetch + evaluation) in the parent context
  const completeLoading = loading || fetchLoading;
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

  return {
    text: resultText,
    loading: completeLoading,
    error,
    fetchError,
  };
};
