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

import { useEffect, useState } from 'react';
import { JsonObject, JsonValue } from '@backstage/types';
import { useTemplateUnitEvaluator } from './useTemplateUnitEvaluator';
import { UiProps } from '../uiPropTypes';

export type evaluateTemplateProps = {
  template?: JsonValue;
  key: string;
  unitEvaluator: (
    unit: string,
    formData: JsonObject,
    responseData?: JsonObject,
    uiProps?: UiProps,
  ) => Promise<JsonValue | undefined>;
  formData: JsonObject;
  responseData?: JsonObject;
  uiProps?: UiProps;
};

export const evaluateTemplate = async (
  props: evaluateTemplateProps,
): Promise<string> => {
  const { template, key, unitEvaluator, formData, responseData, uiProps } =
    props;

  if (template === undefined || typeof template !== 'string') {
    throw new Error(`Template can be a string only, key: ${key}`);
  }

  let evaluated;
  const startIndex = template.indexOf('$${{');
  if (startIndex < 0) {
    evaluated = template;
  } else {
    evaluated = template.substring(0, startIndex);
    const stopIndex = template.indexOf('}}');
    if (stopIndex < 0) {
      throw new Error(`Template unit is not closed by }}`);
    }

    let evaluatedUnit = await unitEvaluator(
      template.substring(startIndex + 4, stopIndex),
      formData,
      responseData,
      uiProps,
    );
    if (evaluatedUnit === undefined) {
      evaluatedUnit = '___undefined___';
    }

    if (typeof evaluatedUnit === 'object') {
      // For both Arrays and JsonObjects
      evaluated = JSON.stringify(evaluatedUnit);
    } else {
      evaluated += evaluatedUnit;
    }

    if (template.length > stopIndex + 2) {
      evaluated += await evaluateTemplate({
        ...props,
        template: template.substring(stopIndex + 2),
      });
    }
  }

  return evaluated;
};

export const useEvaluateTemplate = ({
  template,
  key,
  formData,
  setError,
}: {
  template?: string;
  key: string;
  formData: JsonObject;
  setError: (e: string) => void;
}) => {
  const unitEvaluator = useTemplateUnitEvaluator();
  const [evaluated, setEvaluated] = useState<string>();

  useEffect(() => {
    evaluateTemplate({ template, key, unitEvaluator, formData })
      .then(setEvaluated)
      .catch(reason => setError(reason.toString()));
  }, [template, unitEvaluator, formData, key, setError]);

  return evaluated;
};
