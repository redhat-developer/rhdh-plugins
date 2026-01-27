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
import jsonata from 'jsonata';
import { isJsonObject } from '@red-hat-developer-hub/backstage-plugin-orchestrator-common';
import {
  evaluateTemplate,
  evaluateTemplateProps,
  evaluateTemplateString,
} from './evaluateTemplate';
import { useTemplateUnitEvaluator } from './useTemplateUnitEvaluator';
import { UNDEFINED_VALUE } from './constants';

const ALLOWED_METHODS = ['GET', 'POST'];
const JSONATA_PREFIX = 'jsonata:';

const getJsonataExpression = (value: string): string | undefined => {
  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }
  if (trimmed.startsWith(JSONATA_PREFIX)) {
    const expression = trimmed.slice(JSONATA_PREFIX.length).trim();
    if (!expression) {
      throw new Error('JSONata expression can not be empty');
    }
    return expression;
  }
  return undefined;
};

const evaluateJsonataInValue = async (
  value: JsonValue,
  formData: JsonObject,
): Promise<JsonValue> => {
  if (typeof value === 'string') {
    const expression = getJsonataExpression(value);
    if (!expression) {
      return value;
    }
    const compiled = jsonata(expression);
    const evaluated = await compiled.evaluate(formData);
    return evaluated === undefined ? UNDEFINED_VALUE : (evaluated as JsonValue);
  }
  if (Array.isArray(value)) {
    const evaluatedArray = await Promise.all(
      value.map(item => evaluateJsonataInValue(item as JsonValue, formData)),
    );
    return evaluatedArray as JsonValue;
  }
  if (isJsonObject(value)) {
    const result: JsonObject = {};
    await Promise.all(
      Object.keys(value).map(async key => {
        result[key] = await evaluateJsonataInValue(
          value[key] as JsonValue,
          formData,
        );
      }),
    );
    return result;
  }
  return value;
};

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
          keys.map(async key => {
            const templateEvaluated = await evaluateTemplate({
              unitEvaluator,
              key,
              formData,
              template: bodyObject[key],
            });
            return evaluateJsonataInValue(templateEvaluated, formData);
          }),
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
