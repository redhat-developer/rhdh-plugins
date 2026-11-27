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

import { ErrorSchema } from '@rjsf/utils';
import validatorAjv from '@rjsf/validator-ajv8';
import type { JSONSchema7 } from 'json-schema';

import { getActiveStepKey } from './getSortedStepEntries';
import { normalizeErrorSchema } from './resolveStepErrorSchema';

export const hasErrorSchemaErrors = (
  errorSchema?: ErrorSchema<JsonObject>,
): boolean => Boolean(errorSchema && Object.keys(errorSchema).length > 0);

/**
 * Returns JSON Schema (Ajv) validation errors scoped to a wizard step index.
 * Mirrors the per-step filtering used in `useValidator`.
 */
export const getStepSchemaErrors = (
  schema: JSONSchema7,
  formData: JsonObject,
  stepIndex: number,
): ErrorSchema<JsonObject> | undefined => {
  const stepKey = getActiveStepKey(schema, stepIndex, formData);
  const validationData = validatorAjv.validateFormData(formData, schema);
  return normalizeErrorSchema(
    validationData.errorSchema[stepKey] as ErrorSchema<JsonObject>,
  );
};
