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
import { JsonObject, JsonPrimitive, JsonValue } from '@backstage/types';
import { isJsonObject } from '@redhat/backstage-plugin-orchestrator-common';
import { useTemplateUnitEvaluator } from './useTemplateUnitEvaluator';
import { UiProps } from '../uiPropTypes';
import { UNDEFINED_VALUE } from './constants';

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
  iteration?: number;
};

export type evaluateTemplateStringProps = Omit<
  evaluateTemplateProps,
  'template'
> & {
  template?: JsonPrimitive;
};

export const evaluateTemplateString = async (
  props: evaluateTemplateStringProps,
): Promise<JsonValue> => {
  const {
    template,
    key,
    unitEvaluator,
    formData,
    responseData,
    uiProps,
    iteration = 0,
  } = props;

  if (template === undefined || template === null) {
    throw new Error(`Template can not be undefined, key: ${key}`);
  }

  if (typeof template !== 'string') {
    return template;
  }

  let evaluated: JsonValue;
  const startIndex = template.indexOf('$${{');
  if (startIndex < 0) {
    evaluated = template;
  } else {
    evaluated = template.substring(0, startIndex);
    const stopIndex = template.indexOf('}}');
    if (stopIndex < 0) {
      throw new Error(`Template unit is not closed by }}`);
    }
    const isTheLastOne = template.length <= stopIndex + '}}'.length;

    let evaluatedUnit = await unitEvaluator(
      template.substring(startIndex + 4, stopIndex),
      formData,
      responseData,
      uiProps,
    );
    if (evaluatedUnit === undefined) {
      evaluatedUnit = UNDEFINED_VALUE;
    }

    if (
      typeof evaluatedUnit === 'object' &&
      isTheLastOne &&
      startIndex === 0 &&
      iteration === 0
    ) {
      // For both Arrays and JsonObjects
      // Stays solo - not enclosed by additional text, so pass correct non-string type
      evaluated = evaluatedUnit;
    } else {
      if (typeof evaluatedUnit === 'object') {
        // For both Arrays and JsonObjects
        // wrapped by additional text, so it must be serialized
        evaluated += JSON.stringify(evaluatedUnit);
      } else if (evaluated) {
        evaluated += evaluatedUnit;
      } else {
        // avoid type conversion to string
        evaluated = evaluatedUnit;
      }

      if (!isTheLastOne) {
        const rest = await evaluateTemplateString({
          ...props,
          template: template.substring(stopIndex + '}}'.length),
          iteration: iteration + 1,
        });

        if (['string', 'boolean', 'number'].includes(typeof rest)) {
          evaluated += (rest ?? '').toString();
        } else {
          evaluated += JSON.stringify(rest);
        }
      }
    }
  }

  return evaluated;
};

export const evaluateTemplate = async (
  props: evaluateTemplateProps,
): Promise<JsonValue> => {
  const { template, ...restProps } = props;
  const { key } = restProps;

  if (typeof template === 'boolean' || typeof template === 'number') {
    return template;
  }

  if (typeof template === 'string') {
    return evaluateTemplateString({ ...props, template: template.toString() });
  }

  if (Array.isArray(template)) {
    return await Promise.all(
      template.map(async item => {
        if (Array.isArray(item)) {
          return [
            ...(await Promise.all(
              item.map(nestedItem =>
                evaluateTemplate({ ...props, template: nestedItem }),
              ),
            )),
          ];
        }

        if (isJsonObject(item)) {
          return evaluateTemplate({ ...props, template: item });
        }

        return evaluateTemplateString({ template: item, ...restProps });
      }),
    );
  }

  if (isJsonObject(template)) {
    const evaluated = await Promise.all(
      Object.keys(template).map(prop =>
        evaluateTemplate({
          ...props,
          template: template[prop],
        }),
      ),
    );

    const result: JsonObject = {};
    Object.keys(template).forEach((item, idx) => {
      result[item] = evaluated[idx];
    });
    return result;
  }

  throw new Error(
    `Template can be either a string, number, boolean, object or an array, key: ${key}`,
  );
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
}): JsonValue | undefined => {
  const unitEvaluator = useTemplateUnitEvaluator();
  const [evaluated, setEvaluated] = useState<JsonValue>();

  useEffect(() => {
    evaluateTemplateString({ template, key, unitEvaluator, formData })
      .then(setEvaluated)
      .catch(reason => setError(reason.toString()));
  }, [template, unitEvaluator, formData, key, setError]);

  return evaluated;
};
