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

export type evaluateTemplateProps = {
  template?: JsonValue;
  key: string;
  unitEvaluator: (
    unit: string,
    formData: JsonObject,
  ) => Promise<JsonValue | undefined>;
  formData: JsonObject;
};

export const evaluateTemplate = async (
  props: evaluateTemplateProps,
): Promise<string> => {
  const { template, key, unitEvaluator, formData } = props;

  if (!template || typeof template !== 'string') {
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
    evaluated += await unitEvaluator(
      template.substring(startIndex + 4, stopIndex),
      formData,
    );
    if (template.length > stopIndex + 2) {
      evaluated += await evaluateTemplate({
        ...props,
        template: template.substring(stopIndex + 2),
      });
    }
  }

  return evaluated;
};
