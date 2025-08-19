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

import {
  createErrorHandler,
  CustomValidator,
  ErrorSchema,
  RJSFValidationError,
  unwrapErrorHandler,
  ValidationData,
  validationDataMerge,
  ValidatorType,
} from '@rjsf/utils';
import validatorAjv from '@rjsf/validator-ajv8';
import _validator from '@rjsf/validator-ajv8';
import type { JSONSchema7 } from 'json-schema';

import { getActiveStepKey } from './getSortedStepEntries';
import { useStepperContext } from './StepperContext';

// add the activeStep to the validator to force rjsf form to rerender when activeStep changes. This doesn't happen because it assumes function are equal.
// see https://github.com/rjsf-team/react-jsonschema-form/blob/v5.18.5/packages/utils/src/deepEquals.ts#L12

export type ValidatorTypeForceRender = ValidatorType<
  JsonObject,
  JSONSchema7
> & {
  activeStep: number;
};

const useValidator = (isMultiStepSchema: boolean) => {
  const { activeStep } = useStepperContext();
  const validator: ValidatorTypeForceRender = {
    activeStep,
    validateFormData: (
      formData: JsonObject,
      _schema: JSONSchema7,
      customValidate: CustomValidator<JsonObject, JSONSchema7, any>,
    ): ValidationData<JsonObject> => {
      let validationData = validatorAjv.validateFormData(formData, _schema);
      if (customValidate) {
        const errorHandler = customValidate(
          formData,
          createErrorHandler<JsonObject>(formData),
        );
        const userErrorSchema = unwrapErrorHandler<JsonObject>(errorHandler);
        validationData = validationDataMerge<JsonObject>(
          validationData,
          userErrorSchema,
        );
      }

      if (!isMultiStepSchema) {
        return validationData;
      }

      const activeKey = getActiveStepKey(_schema, activeStep);
      return {
        errors: validationData.errors.filter(err =>
          err.property?.startsWith(`.${activeKey}.`),
        ),
        errorSchema: validationData.errorSchema[activeKey] || {},
      };
    },

    toErrorList: (
      errorSchema?: ErrorSchema<any>,
      fieldPath?: string[],
    ): RJSFValidationError[] => {
      return validatorAjv.toErrorList(errorSchema, fieldPath);
    },

    isValid: (
      _schema: JSONSchema7,
      formData: JsonObject | undefined,
      rootSchema: JSONSchema7,
    ) => {
      return validatorAjv.isValid(_schema, formData, rootSchema);
    },

    rawValidation: (_schema: JSONSchema7, formData?: JsonObject) =>
      validatorAjv.rawValidation(_schema, formData),
  };

  return validator;
};

export default useValidator;
