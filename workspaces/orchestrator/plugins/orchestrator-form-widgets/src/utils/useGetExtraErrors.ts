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

import { fetchApiRef, useApi } from '@backstage/core-plugin-api';
import { flatten, get } from 'lodash';
import {
  OrchestratorFormContextProps,
  // useWrapperFormPropsContext,
} from '@redhat/backstage-plugin-orchestrator-form-api';
import { JsonObject } from '@backstage/types';
import { ERRORS_KEY, ErrorSchema } from '@rjsf/utils';
import { useTemplateUnitEvaluator } from './useTemplateUnitEvaluator';
import { evaluateTemplateString } from './evaluateTemplate';
import { getRequestInit } from './useRequestInit';
import { safeSet } from './safeSet';

// Walks through the uiSchema and calls the "callback" for every field which is backed by the dynamic ui:widget.
// The callback is provided with the uiSchema path, content of the uiSchema part and the corresponding entered formData value.
const walkThrough: (
  uiSchema: OrchestratorFormContextProps['uiSchema'],
  formData: JsonObject | undefined,
  callback: (path: string, uiSchemaProperty: JsonObject) => Promise<void>,
  pathPrefix: string,
) => Promise<void>[] = (uiSchema, formData, callback, pathPrefix) => {
  let dottedPathPrefix = pathPrefix;
  if (pathPrefix) {
    dottedPathPrefix += '.';
  }

  const all: (Promise<void>[] | undefined)[] = Object.keys(uiSchema).map(
    key => {
      // tune following condition to match just those fields which are relevant for the orchestrator-form-widget
      if (typeof uiSchema[key] === 'object') {
        if (uiSchema[key]?.['ui:widget']) {
          return [callback(`${dottedPathPrefix}${key}`, uiSchema[key])];
        }

        return walkThrough(
          uiSchema[key],
          formData?.[key] as JsonObject,
          callback,
          `${dottedPathPrefix}${key}`,
        );
      }

      return undefined;
    },
  );

  const promises = all.filter(Boolean) as Promise<void>[][];
  const result: Promise<void>[] = flatten(promises);
  return result;
};

export const useGetExtraErrors = () => {
  const fetchApi = useApi(fetchApiRef);
  const templateUnitEvaluator = useTemplateUnitEvaluator();
  return async (
    formData: JsonObject,
    uiSchema: OrchestratorFormContextProps['uiSchema'],
  ): Promise<ErrorSchema<JsonObject>> => {
    // Asynchronous validation on wizard step transition or submit
    const errors: ErrorSchema<JsonObject> = {};
    const callback = async (path: string, uiSchemaProperty: JsonObject) => {
      const uiProps = (uiSchemaProperty?.['ui:props'] ?? {}) as JsonObject;
      const validateUrl = uiProps['validate:url']?.toString();

      if (
        validateUrl &&
        ['ActiveTextInput', 'ActiveDropdown', 'ActiveMultiSelect'].includes(
          uiSchemaProperty?.['ui:widget']?.toString() ?? '',
        )
      ) {
        const value = get(formData, path);
        if (value !== undefined) {
          const evaluatedValidateUrl = await evaluateTemplateString({
            template: validateUrl,
            key: 'validate:url',
            unitEvaluator: templateUnitEvaluator,
            formData,
          });

          if (typeof evaluatedValidateUrl !== 'string') {
            // eslint-disable-next-line no-console
            console.error('The validate:url is not evaluated to a string: ', {
              validateUrl,
              evaluatedValidateUrl,
            });
            safeSet(errors, path, {
              [ERRORS_KEY]: `The validate:url is not evaluated to a string: "${validateUrl}"`,
            });
          } else {
            const evaluatedRequestInit = await getRequestInit(
              uiProps,
              'validate',
              templateUnitEvaluator,
              formData,
            );

            const response = await fetchApi.fetch(
              evaluatedValidateUrl,
              evaluatedRequestInit,
            );
            if (response.status !== 200) {
              const data = (await response.json()) as JsonObject;

              Object.keys(data).forEach(key => {
                // @ts-ignore
                const issues = data[key];
                if (issues) {
                  const array = (
                    Array.isArray(issues) ? issues : [issues]
                  ) as string[];

                  safeSet(errors, path, {
                    [ERRORS_KEY]: array.map(e => e?.toString()),
                  });
                }
              });
            }
          }
        }
      }
    };

    const promises: Promise<void>[] = walkThrough(
      uiSchema,
      formData,
      callback,
      '',
    );

    await Promise.all(promises);
    return errors;
  };
};
