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
import { evaluateTemplate, evaluateTemplateProps } from './evaluateTemplate';

const ALLOWED_METHODS = ['GET', 'POST'];

export const getRequestInit = async (
  uiProps: JsonObject,
  prefix: string,
  unitEvaluator: evaluateTemplateProps['unitEvaluator'],
  formData: JsonObject,
): Promise<RequestInit> => {
  const requestInit: RequestInit = {};

  const method = uiProps[`${prefix}:method`]?.toString().toLocaleUpperCase();
  if (method) {
    if (!ALLOWED_METHODS.includes(method)) {
      throw new Error(
        `Unsupported HTTP method, use one of ${ALLOWED_METHODS.join(', ')}`,
      );
    }
    requestInit.method = method;
  }

  const body = uiProps[`${prefix}:body`];
  if (body) {
    if (method === 'POST') {
      if (typeof body === 'object') {
        const bodyObject = body as JsonObject;
        const evaluated: JsonObject = {};

        const keys = Object.keys(body);
        const values = await Promise.all(
          keys.map(key =>
            evaluateTemplate({
              unitEvaluator,
              key,
              formData,
              template: bodyObject[key],
            }),
          ),
        );
        keys.forEach((key, idx) => {
          evaluated[key] = values[idx];
        });

        const bodyInit: BodyInit = JSON.stringify(evaluated);
        requestInit.body = bodyInit;
      } else {
        throw new Error(`${prefix}:body must be object`);
      }
    } else {
      throw new Error(`${prefix}:body can be used with POST requests only`);
    }
  }

  const headersInit: HeadersInit = {
    'Content-Type': 'application/json',
  };

  const headers = uiProps[`${prefix}:headers`];
  if (headers) {
    if (typeof headers === 'object') {
      const headersObject = headers as JsonObject;

      const keys = Object.keys(headers);
      const values = await Promise.all(
        keys.map(key =>
          evaluateTemplate({
            unitEvaluator,
            key,
            formData,
            template: headersObject[key],
          }),
        ),
      );
      keys.forEach((key, idx) => {
        headersInit[key] = values[idx];
      });
    } else {
      throw new Error('fetch:body must be object for POST requests');
    }
  }
  requestInit.headers = headersInit;

  return requestInit;
};
