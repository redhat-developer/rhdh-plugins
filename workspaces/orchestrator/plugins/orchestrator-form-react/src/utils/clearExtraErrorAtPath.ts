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
import cloneDeep from 'lodash/cloneDeep';
import unset from 'lodash/unset';

/**
 * Maps an RJSF field id (e.g. `root_stepOne_xParams_name`) to a dotted form
 * path used in extraErrors (e.g. `stepOne.xParams.name`).
 *
 * Assumes schema property names do not contain underscores. RJSF encodes nested
 * paths in ids using the configured id separator (default `_`), so an
 * underscore inside a field name would be indistinguishable from a path segment
 * and cannot be mapped back reliably.
 */
export function rjsfIdToFieldPath(id?: string): string | undefined {
  if (!id || id === 'root') {
    return undefined;
  }

  const withoutRoot = id.startsWith('root_') ? id.slice('root_'.length) : id;
  if (!withoutRoot) {
    return undefined;
  }

  return withoutRoot.replace(/_/g, '.');
}

function pruneEmptyErrorBranches(
  node: ErrorSchema<JsonObject> | undefined,
): ErrorSchema<JsonObject> | undefined {
  if (!node || typeof node !== 'object') {
    return undefined;
  }

  if (Array.isArray((node as JsonObject)[ERRORS_KEY])) {
    return node;
  }

  const pruned: ErrorSchema<JsonObject> = {};
  for (const [key, value] of Object.entries(node)) {
    if (key === ERRORS_KEY) {
      continue;
    }
    const child = pruneEmptyErrorBranches(value as ErrorSchema<JsonObject>);
    if (child !== undefined) {
      pruned[key] = child;
    }
  }

  return Object.keys(pruned).length > 0 ? pruned : undefined;
}

/**
 * Removes async validation errors for a single field. When `fieldPath` is
 * omitted, existing errors are preserved (nested step onChange often has no id).
 */
export function clearExtraErrorAtPath(
  extraErrors: ErrorSchema<JsonObject> | undefined,
  fieldPath: string | undefined,
): ErrorSchema<JsonObject> | undefined {
  if (!extraErrors) {
    return undefined;
  }

  if (!fieldPath) {
    return extraErrors;
  }

  const next = cloneDeep(extraErrors);
  unset(next, fieldPath);
  return pruneEmptyErrorBranches(next);
}
