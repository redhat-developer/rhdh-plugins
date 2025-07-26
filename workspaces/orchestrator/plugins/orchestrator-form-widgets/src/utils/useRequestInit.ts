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
import { JsonObject } from '@backstage/types';
import {
  evaluateTemplate,
  evaluateTemplateProps,
  evaluateTemplateString,
} from './evaluateTemplate';
import { useTemplateUnitEvaluator } from './useTemplateUnitEvaluator';
import { UNDEFINED_VALUE } from './constants';

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
          if (values[idx] && values[idx] !== UNDEFINED_VALUE) {
            // skip empty or undefined values
            evaluated[key] = values[idx];
          }
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
        keys.map(key => {
          const value = headersObject[key];
          if (typeof value !== 'string') {
            throw new Error(
              `HTTP header must be a string. See "${key}" header.`,
            );
          }

          return evaluateTemplateString({
            unitEvaluator,
            key,
            formData,
            template: value,
          });
        }),
      );
      keys.forEach((key, idx) => {
        // Header must be a string
        const value = values[idx];
        if (value && value !== UNDEFINED_VALUE) {
          // skip empty or undefined values
          headersInit[key] =
            typeof value === 'string' ? value : JSON.stringify(value);
        }
      });
    } else {
      throw new Error('fetch:body must be object for POST requests');
    }
  }
  requestInit.headers = headersInit;

  return requestInit;
};

export const useRequestInit = ({
  uiProps,
  prefix,
  formData,
  setError,
}: {
  uiProps: JsonObject;
  prefix: string;
  formData: JsonObject;
  setError: (e: string) => void;
}) => {
  const [evaluatedRequestInit, setEvaluatedRequestInit] =
    useState<RequestInit>();
  const unitEvaluator = useTemplateUnitEvaluator();

  useEffect(() => {
    getRequestInit(uiProps, prefix, unitEvaluator, formData)
      .then(evaluated =>
        setEvaluatedRequestInit(actual =>
          isEqual(actual, evaluated) ? actual : evaluated,
        ),
      )
      .catch(reason => setError(reason.toString()));
  }, [uiProps, unitEvaluator, formData, prefix, setError]);

  return evaluatedRequestInit;
};
