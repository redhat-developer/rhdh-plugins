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

import type { ComponentType } from 'react';
import {
  FormDecoratorProps,
  OrchestratorFormContextProps,
} from '@red-hat-developer-hub/backstage-plugin-orchestrator-form-api';
import { FormValidation } from '@rjsf/utils';
import { JsonObject } from '@backstage/types';

import {
  SchemaUpdater,
  ActiveTextInput,
  ActiveText,
  ActiveDropdown,
  ActiveMultiSelect,
} from './widgets';
import { useGetExtraErrors, useGetExtraErrorsForField } from './utils';

const customValidate = (
  _formData: JsonObject | undefined,
  errors: FormValidation<JsonObject>,
): FormValidation<JsonObject> => {
  return errors;
};

const widgets = {
  SchemaUpdater,
  ActiveTextInput,
  ActiveText,
  ActiveDropdown,
  ActiveMultiSelect,
};

const FormDecoratorContent = ({
  FormComponent,
  ...props
}: {
  FormComponent: ComponentType<FormDecoratorProps>;
} & OrchestratorFormContextProps) => {
  const getExtraErrors = useGetExtraErrors();
  const getExtraErrorsForField = useGetExtraErrorsForField();

  return (
    <FormComponent
      widgets={widgets}
      formContext={props}
      customValidate={customValidate}
      getExtraErrors={getExtraErrors}
      getExtraErrorsForField={getExtraErrorsForField}
    />
  );
};

export default FormDecoratorContent;
