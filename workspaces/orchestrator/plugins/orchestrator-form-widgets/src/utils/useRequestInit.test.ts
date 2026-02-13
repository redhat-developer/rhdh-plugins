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

import get from 'lodash/get';
import { JsonObject } from '@backstage/types';
import { evaluateTemplateProps } from './evaluateTemplate';
import { getRequestInit } from './useRequestInit';

const unitEvaluator: evaluateTemplateProps['unitEvaluator'] = async (
  unit,
  formData,
) => {
  return Promise.resolve(get(formData, unit));
};

describe('getRequestInit', () => {
  it('evaluates JSONata expressions in fetch:body', async () => {
    const uiProps: JsonObject = {
      'fetch:method': 'POST',
      'fetch:body': {
        result: 'jsonata:$.payload',
        literal: 'keep-me',
      },
    };
    const formData: JsonObject = {
      payload: { foo: 'bar' },
    };

    const requestInit = await getRequestInit(
      uiProps,
      'fetch',
      unitEvaluator,
      formData,
    );
    expect(requestInit.body).toBeDefined();
    expect(JSON.parse(requestInit.body as string)).toEqual({
      result: { foo: 'bar' },
      literal: 'keep-me',
    });
  });

  it('evaluates JSONata expressions in validate:body', async () => {
    const uiProps: JsonObject = {
      'validate:method': 'POST',
      'validate:body': {
        name: 'jsonata:$.user.name',
      },
    };
    const formData: JsonObject = {
      user: { name: 'Marek' },
    };

    const requestInit = await getRequestInit(
      uiProps,
      'validate',
      unitEvaluator,
      formData,
    );
    expect(JSON.parse(requestInit.body as string)).toEqual({
      name: 'Marek',
    });
  });

  it('still evaluates template units in body values', async () => {
    const uiProps: JsonObject = {
      'fetch:method': 'POST',
      'fetch:body': {
        name: '$${{current.name}}',
      },
    };
    const formData: JsonObject = {
      current: { name: 'Zara' },
    };

    const requestInit = await getRequestInit(
      uiProps,
      'fetch',
      unitEvaluator,
      formData,
    );
    expect(JSON.parse(requestInit.body as string)).toEqual({
      name: 'Zara',
    });
  });
});
