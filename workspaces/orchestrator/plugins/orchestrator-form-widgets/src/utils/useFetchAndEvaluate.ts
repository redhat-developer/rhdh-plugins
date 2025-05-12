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

import { JsonObject } from '@backstage/types/index';
import React, { useState, useEffect } from 'react';
import { UiProps } from '../uiPropTypes';
import { getErrorMessage } from './errorUtils';
import { evaluateTemplate } from './evaluateTemplate';
import { useFetchData } from './useFetch';
import { useRetriggerEvaluate } from './useRetriggerEvaluate';
import { useTemplateUnitEvaluator } from './useTemplateUnitEvaluator';

export const useFetchAndEvaluate = (
  formData: JsonObject,
  uiProps: UiProps,
  fieldId: string,
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
  } = useFetchData(formData, uiProps, retrigger);
  const [error, setError] = useState<string>();
  const [loading, setLoading] = React.useState(true);
  const [resultText, setResultText] = React.useState<string>();
  useEffect(() => {
    const evaluate = async () => {
      const template = uiProps['ui:text'];
      if (!template) {
        setError(
          `field ${fieldId} has ui:widget property StaticText but doesn't contain property ui:text`,
        );
        return;
      }
      if (!retrigger || fetchLoading || fetchError) {
        return;
      }
      try {
        setLoading(true);
        setError(undefined);
        const evaluatedText = await evaluateTemplate({
          template: template,
          key: fieldId,
          unitEvaluator,
          formData,
          responseData: data,
          uiProps,
        });
        setResultText(evaluatedText);
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
  }, [
    retrigger,
    fetchError,
    fetchLoading,
    fieldId,
    data,
    formData,
    uiProps,
    unitEvaluator,
  ]);
  return {
    text: resultText,
    loading: loading || fetchLoading,
    error: error || fetchError,
  };
};
