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
import { isEqual } from 'lodash';
import { JsonObject, JsonValue } from '@backstage/types';
import { evaluateTemplateProps } from './evaluateTemplate';

const EMPTY = [] as string[];

export const useRetriggerEvaluate = (
  templateUnitEvaluator: evaluateTemplateProps['unitEvaluator'],
  formData = {} as JsonObject,
  conditions?: string[],
): (string | undefined)[] | undefined => {
  const [evaluated, setEvaluated] = useState<(string | undefined)[]>();
  useEffect(() => {
    if (!conditions) {
      if (!evaluated || evaluated.length > 0) {
        setEvaluated(EMPTY);
      }
    } else {
      const doItAsync = async () => {
        const actualJson: (JsonValue | undefined)[] = await Promise.all(
          conditions.map((condition: string) => {
            return templateUnitEvaluator(condition, formData).catch(err => {
              // eslint-disable-next-line no-console
              console.error(
                'Can not evaluate retrigger condition: ',
                condition,
                err,
              );
              throw err;
            });
          }),
        );

        const actual = actualJson.map(v => v?.toString());
        if (!isEqual(evaluated, actual)) {
          setEvaluated(actual);
        }
      };

      doItAsync();
    }
  }, [conditions, evaluated, templateUnitEvaluator, formData]);

  return evaluated;
};
