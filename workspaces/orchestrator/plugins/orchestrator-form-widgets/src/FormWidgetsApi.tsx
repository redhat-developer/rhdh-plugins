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

import React, { useCallback } from 'react';
import {
  FormDecoratorProps,
  OrchestratorFormApi,
  OrchestratorFormContextProps,
  useWrapperFormPropsContext,
} from '@red-hat-developer-hub/backstage-plugin-orchestrator-form-api';
import { ErrorSchema, FormValidation } from '@rjsf/utils';
import { JsonObject, JsonValue } from '@backstage/types';
import { SchemaUpdater, ActiveTextInput } from './widgets';

const sleep = (ms: number) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

const customValidate = (
  _formData: JsonObject | undefined,
  errors: FormValidation<JsonObject>,
): FormValidation<JsonObject> => {
  // Trigger field validation
  // Called synchronously
  return errors;
};

// Walks through the uiSchema and calls the "callback" for every field which is backed by the dynamic ui:widget.
// The callback is provided with the uiSchema path, content of the uiSchema part and the corresponding entered formData value.
const walkThrough: (
  uiSchema: OrchestratorFormContextProps['uiSchema'],
  formData: JsonObject | undefined,
  callback: (
    path: string,
    uiSchemaProperty: JsonObject,
    formDataValue: JsonValue | undefined,
  ) => void,
  pathPrefix: string,
) => void = (uiSchema, formData, callback, pathPrefix) => {
  let dottedPathPrefix = pathPrefix;
  if (pathPrefix) {
    dottedPathPrefix += '.';
  }

  for (const key of Object.keys(uiSchema)) {
    // tune this condition to match just those properties which are relevant for the orchestrator-form-widget
    if (typeof uiSchema[key] === 'object') {
      if (uiSchema[key]?.['ui:widget']) {
        callback(`${dottedPathPrefix}${key}`, uiSchema[key], formData?.[key]);
      } else {
        walkThrough(
          uiSchema[key],
          formData?.[key] as JsonObject,
          callback,
          `${dottedPathPrefix}${key}`,
        );
      }
    }
  }
};

const safeSet: (errors: JsonObject, path: string, value: JsonValue) => void = (
  errors,
  path,
  value,
) => {
  const steps = path.split('.', 2);
  if (steps.length === 1) {
    errors[steps[0]] = value;
  } else {
    const safeObject = (errors[steps[0]] ?? {}) as JsonObject;
    errors[steps[0]] = safeObject;
    safeSet(safeObject, steps[1], value);
  }
};
export class FormWidgetsApi implements OrchestratorFormApi {
  // private readonly configApi: ConfigApi;
  // private readonly fetchApi: FetchApi;

  // public constructor(options: { configApi: ConfigApi; fetchApi: FetchApi }) {
  //   this.configApi = options.configApi;
  //   this.fetchApi = options.fetchApi;
  // }

  getFormDecorator: OrchestratorFormApi['getFormDecorator'] = () => {
    return (FormComponent: React.ComponentType<FormDecoratorProps>) => {
      return () => {
        const { formData, setFormData, uiSchema } =
          useWrapperFormPropsContext();

        const widgets = { SchemaUpdater, ActiveTextInput };

        const onChange = useCallback(
          (data: JsonObject | undefined) => {
            if (data) {
              setFormData(data);
            }
          },
          [setFormData],
        );

        const getExtraErrors: (
          currentFormData: JsonObject,
        ) => Promise<ErrorSchema<JsonObject>> = async (
          currentFormData: JsonObject,
        ) => {
          // Asynchronous validation on wizard step transition or submit
          return sleep(1000 /* The sleep mimics async fetch, remove it */).then(
            () => {
              const errors: ErrorSchema<JsonObject> = {};
              walkThrough(
                uiSchema,
                currentFormData,
                (path, uiSchemaProperty, formDataValue) => {
                  if (uiSchemaProperty?.['ui:widget'] === 'ActiveTextInput') {
                    if (formDataValue) {
                      safeSet(errors, path, {
                        __errors: [
                          'This is a dummy error from async validator',
                          `Yet another issue with this field of value: ${formDataValue}`,
                          'Remove the value if you want this silly validator to pass',
                        ],
                      });
                    }
                  }
                },
                '',
              );

              return errors;
            },
          );
        };

        return (
          <FormComponent
            widgets={widgets}
            onChange={e => {
              onChange(e.formData);
            }}
            formContext={formData}
            customValidate={customValidate}
            getExtraErrors={getExtraErrors}
          />
        );
      };
    };
  };
}
