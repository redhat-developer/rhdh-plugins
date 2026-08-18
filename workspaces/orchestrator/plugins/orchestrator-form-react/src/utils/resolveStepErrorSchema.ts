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

import { ERRORS_KEY, ErrorSchema } from '@rjsf/utils';

/**
 * RJSF expects every `__errors` entry to be an array. Coerce invalid values.
 */
export function normalizeErrorSchema(
  errorSchema: ErrorSchema<JsonObject> | undefined,
): ErrorSchema<JsonObject> | undefined {
  if (!errorSchema || typeof errorSchema !== 'object') {
    return undefined;
  }

  const normalized = { ...errorSchema } as JsonObject;
  const rootErrors = normalized[ERRORS_KEY];

  if (rootErrors !== undefined) {
    normalized[ERRORS_KEY] = Array.isArray(rootErrors)
      ? rootErrors
      : [String(rootErrors)];
  }

  for (const key of Object.keys(normalized)) {
    if (key === ERRORS_KEY) {
      continue;
    }
    const child = normalizeErrorSchema(
      normalized[key] as ErrorSchema<JsonObject>,
    );
    if (child === undefined) {
      delete normalized[key];
    } else {
      normalized[key] = child;
    }
  }

  return normalized as ErrorSchema<JsonObject>;
}

/**
 * Resolves the RJSF error schema for one wizard step. The root form may pass
 * either a full multi-step tree or a slice scoped to the active step only.
 */
export function resolveStepErrorSchema(
  errorSchema: ErrorSchema<JsonObject> | undefined,
  stepKey: string,
  activeStepKey: string | undefined,
): ErrorSchema<JsonObject> | undefined {
  if (!errorSchema) {
    return undefined;
  }

  const nested = errorSchema[stepKey] as ErrorSchema<JsonObject> | undefined;
  if (nested !== undefined) {
    return normalizeErrorSchema(nested);
  }

  if (stepKey === activeStepKey) {
    return normalizeErrorSchema(errorSchema);
  }

  return undefined;
}

/** True when `node` is a field-level error object (has an `__errors` array). */
export function isFieldErrorSchema(node: unknown): boolean {
  return (
    typeof node === 'object' &&
    node !== null &&
    Array.isArray((node as JsonObject)[ERRORS_KEY])
  );
}
