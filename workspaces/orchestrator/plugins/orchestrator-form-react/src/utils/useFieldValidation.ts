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

import {
  MutableRefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import { JsonObject } from '@backstage/types';

import { ErrorSchema } from '@rjsf/utils';
import get from 'lodash/get';

import {
  areAllGroupFieldsPopulated,
  getFieldValidationConfig,
  getGroupMembers,
  ValidateOnMode,
} from './fieldValidationConfig';
import { mergeExtraErrors } from './mergeExtraErrors';

const FIELD_VALIDATION_DEBOUNCE_MS = 1000;

export interface UseFieldValidationParams {
  uiSchema: JsonObject;
  getExtraErrorsForField?: (
    formData: JsonObject,
    fieldPath: string,
    uiSchemaProperty: JsonObject,
  ) => Promise<ErrorSchema<JsonObject>>;
  setExtraErrors: React.Dispatch<
    React.SetStateAction<ErrorSchema<JsonObject> | undefined>
  >;
  formDataRef: MutableRefObject<JsonObject>;
}

export function useFieldValidation({
  uiSchema,
  getExtraErrorsForField,
  setExtraErrors,
  formDataRef,
}: UseFieldValidationParams) {
  const [validatingFields, setValidatingFields] = useState<Set<string>>(
    new Set(),
  );
  const debounceTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  );
  const requestIdRef = useRef<Map<string, number>>(new Map());

  const validateField = useCallback(
    async (fieldPath: string) => {
      const fieldUiSchema = get(uiSchema, fieldPath) as JsonObject | undefined;
      if (!fieldUiSchema) return;

      const currentId = (requestIdRef.current.get(fieldPath) ?? 0) + 1;
      requestIdRef.current.set(fieldPath, currentId);

      setValidatingFields(prev => new Set(prev).add(fieldPath));

      try {
        const formData = formDataRef.current;

        let asyncErrors: ErrorSchema<JsonObject> = {};
        if (getExtraErrorsForField) {
          try {
            asyncErrors = await getExtraErrorsForField(
              formData,
              fieldPath,
              fieldUiSchema,
            );
          } catch {
            // Network or evaluation failure — treat as no extra errors
          }
        }

        if (requestIdRef.current.get(fieldPath) !== currentId) return;

        setExtraErrors(prev => mergeExtraErrors(prev, asyncErrors, fieldPath));
      } finally {
        if (requestIdRef.current.get(fieldPath) === currentId) {
          setValidatingFields(prev => {
            const next = new Set(prev);
            next.delete(fieldPath);
            return next;
          });
        }
      }
    },
    [uiSchema, getExtraErrorsForField, setExtraErrors, formDataRef],
  );

  const scheduleValidation = useCallback(
    (path: string, mode: ValidateOnMode) => {
      if (mode === 'change') {
        const existing = debounceTimers.current.get(path);
        if (existing) clearTimeout(existing);
        const timer = setTimeout(() => {
          debounceTimers.current.delete(path);
          validateField(path);
        }, FIELD_VALIDATION_DEBOUNCE_MS);
        debounceTimers.current.set(path, timer);
      } else {
        validateField(path);
      }
    },
    [validateField],
  );

  const triggerFieldValidation = useCallback(
    (fieldPath: string, mode: ValidateOnMode) => {
      const config = getFieldValidationConfig(uiSchema, fieldPath);
      if (!config?.validateOn.includes(mode)) return;

      scheduleValidation(fieldPath, mode);

      if (config.validateGroup) {
        const members = getGroupMembers(uiSchema, config.validateGroup);
        if (areAllGroupFieldsPopulated(members, formDataRef.current)) {
          for (const memberPath of members) {
            if (memberPath !== fieldPath) {
              scheduleValidation(memberPath, mode);
            }
          }
        }
      }
    },
    [uiSchema, scheduleValidation, formDataRef],
  );

  const cleanupTimers = useCallback(() => {
    for (const timer of debounceTimers.current.values()) {
      clearTimeout(timer);
    }
    debounceTimers.current.clear();
  }, []);

  useEffect(() => cleanupTimers, [cleanupTimers]);

  return {
    validatingFields,
    triggerFieldValidation,
  };
}
