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

import { isDeepStrictEqual } from 'node:util';
import type { V1Job } from '@kubernetes/client-node';
import type { JsonValue } from '@red-hat-developer-hub/backstage-plugin-x2a-node';

const isPlainObject = (value: unknown): value is Record<string, JsonValue> => {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
};

const pathFor = (path: string[]) =>
  path.length === 0 ? '<root>' : path.join('.');

const isJsonPrimitive = (
  value: unknown,
): value is string | number | boolean | null =>
  value === null ||
  typeof value === 'string' ||
  typeof value === 'boolean' ||
  (typeof value === 'number' && Number.isFinite(value));

const invalid = (path: string[], message: string): never => {
  throw new Error(
    `Invalid x2a.kubernetes.deploymentPatch at ${pathFor(path)}: ${message}`,
  );
};

const isNamedList = (path: string[]) => {
  if (path.length === 4) {
    return (
      path[0] === 'spec' &&
      path[1] === 'template' &&
      path[2] === 'spec' &&
      (path[3] === 'containers' || path[3] === 'volumes')
    );
  }
  if (path.length === 5) {
    const containerPath = path[3];
    return (
      path[0] === 'spec' &&
      path[1] === 'template' &&
      path[2] === 'spec' &&
      containerPath.startsWith('containers[') &&
      containerPath.endsWith(']') &&
      (path[4] === 'env' || path[4] === 'volumeMounts')
    );
  }
  return false;
};

const formatNamedPath = (path: string[], name: string) => {
  const base = path.slice(0, -1);
  return [...base, `${path[path.length - 1]}[${name}]`];
};

type NamedJsonObject = Record<string, JsonValue> & { name: string };

const requireNamedItem = (item: unknown, path: string[]): NamedJsonObject => {
  if (
    !isPlainObject(item) ||
    typeof item.name !== 'string' ||
    item.name.length === 0
  ) {
    return invalid(path, 'named list entry must have a non-empty string name');
  }
  return item as NamedJsonObject;
};

const clone = (value: JsonValue): JsonValue => {
  if (Array.isArray(value)) return value.map(clone);
  if (isPlainObject(value)) {
    const entries: [string, JsonValue][] = Object.entries(value).map(
      ([key, child]) => [key, clone(child)],
    );
    return Object.fromEntries(entries);
  }
  return value;
};

const validatePatch = (value: unknown, path: string[]): void => {
  if (isNamedList(path)) {
    if (!Array.isArray(value)) {
      invalid(path, 'expected an array');
      return;
    }
    const names = new Set<string>();
    for (const [index, item] of value.entries()) {
      const namedItem = requireNamedItem(item, [...path, String(index)]);
      if (names.has(namedItem.name)) {
        invalid(
          formatNamedPath(path, namedItem.name),
          'duplicate name in patch list',
        );
      }
      names.add(namedItem.name);
      validatePatch(namedItem, formatNamedPath(path, namedItem.name));
    }
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) =>
      validatePatch(item, [...path, String(index)]),
    );
    return;
  }
  if (isPlainObject(value)) {
    for (const [key, child] of Object.entries(value)) {
      validatePatch(child, [...path, key]);
    }
    return;
  }

  if (!isJsonPrimitive(value)) {
    invalid(path, 'expected a JSON-compatible value');
  }
};

function mergeNamedList(
  generated: unknown,
  patch: unknown,
  path: string[],
): JsonValue {
  if (!Array.isArray(patch)) return invalid(path, 'expected an array');
  if (generated !== undefined && !Array.isArray(generated)) {
    return invalid(path, 'generated value is not an array');
  }

  const generatedItems: unknown[] = Array.isArray(generated) ? generated : [];
  const result = generatedItems.map(item => clone(item as JsonValue));
  const generatedByName = new Map<string, number>();
  for (let index = 0; index < generatedItems.length; index += 1) {
    const item = requireNamedItem(generatedItems[index], [
      ...path,
      String(index),
    ]);
    generatedByName.set(item.name, index);
  }

  // applyDeploymentPatch validates the patch, including list names and duplicates, first.
  for (const item of patch as NamedJsonObject[]) {
    const name = item.name;
    const itemPath = formatNamedPath(path, name);
    const generatedIndex = generatedByName.get(name);
    if (generatedIndex === undefined) {
      result.push(mergeValue(undefined, item, itemPath));
    } else {
      result[generatedIndex] = mergeValue(
        generatedItems[generatedIndex],
        item,
        itemPath,
      );
    }
  }
  return result;
}

function mergeValue(
  generated: unknown,
  patch: unknown,
  path: string[],
): JsonValue {
  if (isNamedList(path)) {
    return mergeNamedList(generated, patch, path);
  }
  if (patch === undefined) return clone(generated as JsonValue);
  if (generated === undefined) {
    return clone(patch as JsonValue);
  }

  if (Array.isArray(patch)) {
    if (isDeepStrictEqual(generated, patch)) {
      return clone(generated as JsonValue);
    }
    return invalid(path, 'patch value conflicts with generated value');
  }

  if (isPlainObject(patch)) {
    if (!isPlainObject(generated)) {
      return invalid(path, 'patch value conflicts with generated value');
    }
    const merged = new Map<string, JsonValue>();
    for (const [key, value] of Object.entries(generated)) {
      merged.set(key, clone(value));
    }
    for (const [key, value] of Object.entries(patch)) {
      merged.set(
        key,
        mergeValue(
          Object.prototype.hasOwnProperty.call(generated, key)
            ? generated[key]
            : undefined,
          value,
          [...path, key],
        ),
      );
    }
    return Object.fromEntries(merged) as Record<string, JsonValue>;
  }

  if (isDeepStrictEqual(generated, patch)) {
    return clone(generated as JsonValue);
  }
  return invalid(path, 'patch value conflicts with generated value');
}

export function applyDeploymentPatch(
  generatedJob: V1Job,
  deploymentPatch: unknown,
): V1Job {
  if (!isPlainObject(deploymentPatch)) {
    return invalid([], 'deploymentPatch must be a plain object');
  }
  // Validate once up front; the merge can then focus on combining the values.
  validatePatch(deploymentPatch, []);
  return mergeValue(generatedJob, deploymentPatch, []) as V1Job;
}
