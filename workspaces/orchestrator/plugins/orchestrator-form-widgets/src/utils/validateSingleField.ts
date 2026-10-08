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

import { JsonObject, JsonValue } from '@backstage/types';

import { ERRORS_KEY, ErrorSchema } from '@rjsf/utils';
import { get } from 'lodash';

import { UiProps } from '../uiPropTypes';
import { evaluateTemplateString } from './evaluateTemplate';
import { parseValidationErrorBody } from './parseValidationErrorBody';
import { safeSet } from './safeSet';
import { getRequestInit } from './useRequestInit';

const VALIDATABLE_WIDGETS = new Set([
  'ActiveTextInput',
  'ActiveDropdown',
  'ActiveMultiSelect',
]);

export async function validateSingleField(params: {
  formData: JsonObject;
  fieldPath: string;
  uiSchemaProperty: JsonObject;
  unitEvaluator: (
    unit: string,
    formData: JsonObject,
    responseData?: JsonObject,
    uiProps?: UiProps,
  ) => Promise<JsonValue | undefined>;
  fetchApi: { fetch: typeof fetch };
}): Promise<ErrorSchema<JsonObject>> {
  const { formData, fieldPath, uiSchemaProperty, unitEvaluator, fetchApi } =
    params;
  const errors: ErrorSchema<JsonObject> = {};

  const uiProps = (uiSchemaProperty?.['ui:props'] ?? {}) as JsonObject;
  const validateUrl = uiProps['validate:url']?.toString();

  if (
    !validateUrl ||
    !VALIDATABLE_WIDGETS.has(uiSchemaProperty?.['ui:widget']?.toString() ?? '')
  ) {
    return errors;
  }

  const value = get(formData, fieldPath);
  if (value === undefined) {
    return errors;
  }

  const evaluatedValidateUrl = await evaluateTemplateString({
    template: validateUrl,
    key: 'validate:url',
    unitEvaluator,
    formData,
  });

  if (typeof evaluatedValidateUrl !== 'string') {
    safeSet(errors, fieldPath, {
      [ERRORS_KEY]: [
        `The validate:url is not evaluated to a string: "${validateUrl}"`,
      ],
    });
    return errors;
  }

  const evaluatedRequestInit = await getRequestInit(
    uiProps,
    'validate',
    unitEvaluator,
    formData,
  );

  let response: Response;
  try {
    response = await fetchApi.fetch(evaluatedValidateUrl, evaluatedRequestInit);
  } catch {
    safeSet(errors, fieldPath, {
      [ERRORS_KEY]: ['Validation request failed: unable to reach the server'],
    });
    return errors;
  }

  if (response.status !== 200) {
    const data = await parseValidationErrorBody(response);
    if (!data || Object.keys(data).length === 0) {
      safeSet(errors, fieldPath, {
        [ERRORS_KEY]: [
          `Validation request failed with status ${response.status}`,
        ],
      });
      return errors;
    }

    const allMessages: string[] = [];
    Object.keys(data).forEach(key => {
      // @ts-ignore
      const issues = data[key];
      if (issues) {
        const array = (Array.isArray(issues) ? issues : [issues]) as string[];
        allMessages.push(...array.map(e => e?.toString()));
      }
    });
    if (allMessages.length > 0) {
      safeSet(errors, fieldPath, { [ERRORS_KEY]: allMessages });
    }
  }

  return errors;
}
