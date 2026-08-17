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
import { JsonObject } from '@backstage/types';

import { ErrorSchema } from '@rjsf/utils';

import { useTemplateUnitEvaluator } from './useTemplateUnitEvaluator';
import { validateSingleField } from './validateSingleField';

export const useGetExtraErrorsForField = () => {
  const fetchApi = useApi(fetchApiRef);
  const templateUnitEvaluator = useTemplateUnitEvaluator();

  return async (
    formData: JsonObject,
    fieldPath: string,
    uiSchemaProperty: JsonObject,
  ): Promise<ErrorSchema<JsonObject>> => {
    return validateSingleField({
      formData,
      fieldPath,
      uiSchemaProperty,
      unitEvaluator: templateUnitEvaluator,
      fetchApi,
    });
  };
};
