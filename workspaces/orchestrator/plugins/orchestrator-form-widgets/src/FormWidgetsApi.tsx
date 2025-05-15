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
  useWrapperFormPropsContext,
} from '@red-hat-developer-hub/backstage-plugin-orchestrator-form-api';
import { FormValidation } from '@rjsf/utils';
import { JsonObject } from '@backstage/types';

import { SchemaUpdater, ActiveTextInput } from './widgets';
import { useGetExtraErrors } from './utils';

const customValidate = (
  _formData: JsonObject | undefined,
  errors: FormValidation<JsonObject>,
): FormValidation<JsonObject> => {
  // TODO: Trigger field validation
  // Called synchronously
  return errors;
};

const widgets = {
  SchemaUpdater,
  ActiveTextInput,
};

export class FormWidgetsApi implements OrchestratorFormApi {
  getFormDecorator: OrchestratorFormApi['getFormDecorator'] = () => {
    // eslint-disable-next-line no-console
    console.log('Using FormWidgetsApi by RHDH orchestrator-form-widgets.');

    return (FormComponent: React.ComponentType<FormDecoratorProps>) => {
      return () => {
        const { formData, setFormData } = useWrapperFormPropsContext();
        const getExtraErrors = useGetExtraErrors();

        const onChange = useCallback(
          (data: JsonObject | undefined) => {
            if (data) {
              setFormData(data);
            }
          },
          [setFormData],
        );

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
