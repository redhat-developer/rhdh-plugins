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

import type { V1Job } from '@kubernetes/client-node';
import type { JsonValue } from '@red-hat-developer-hub/backstage-plugin-x2a-node';

type PlainObject = Record<string, JsonValue>;

const isPlainObject = (value: unknown): value is PlainObject => {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
};

const isJsonPrimitive = (
  value: unknown,
): value is string | number | boolean | null =>
  value === null ||
  typeof value === 'string' ||
  typeof value === 'boolean' ||
  (typeof value === 'number' && Number.isFinite(value));

const pathFor = (path: string[]) =>
  path.length === 0 ? '<root>' : path.join('.');

const invalid = (path: string[], message: string): never => {
  throw new Error(
    `Invalid x2a.kubernetes.deploymentPatch at ${pathFor(path)}: ${message}`,
  );
};

const mergeKeys: Record<string, string> = {
  containers: 'name',
  initContainers: 'name',
  ephemeralContainers: 'name',
  env: 'name',
  volumeMounts: 'mountPath',
  volumeDevices: 'devicePath',
  volumes: 'name',
  imagePullSecrets: 'name',
  ports: 'containerPort',
  hostAliases: 'ip',
};

const unsupportedDirectives = new Set([
  '$patch',
  '$setElementOrder',
  '$deleteFromPrimitiveList',
  '$retainKeys',
]);

const formatKeyedPath = (path: string[], key: string, value: JsonValue) => [
  ...path,
  `${key}=${String(value)}`,
];

const clone = (value: JsonValue): JsonValue => {
  if (Array.isArray(value)) return value.map(clone);
  if (isPlainObject(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, child]) => [key, clone(child)]),
    );
  }
  return value;
};

const validatePatch = (value: unknown, path: string[]): void => {
  if (Array.isArray(value)) {
    const fieldName = path.length > 0 ? path[path.length - 1] : undefined;
    const mergeKey = fieldName === undefined ? undefined : mergeKeys[fieldName];
    const seen = new Set<string>();

    value.forEach((item, index) => {
      const itemPath = [...path, String(index)];

      if (mergeKey !== undefined) {
        if (!isPlainObject(item)) {
          invalid(itemPath, `expected an object with a ${mergeKey} key`);
        }
        const keyValue = item[mergeKey];
        if (typeof keyValue !== 'string' && typeof keyValue !== 'number') {
          invalid(itemPath, `expected a string or number ${mergeKey}`);
        }
        const keyValueText = String(keyValue);
        if (seen.has(keyValueText)) {
          invalid(
            formatKeyedPath(path, mergeKey, keyValue),
            `duplicate ${mergeKey} in patch list`,
          );
        }
        seen.add(keyValueText);
      }

      validatePatch(item, itemPath);
    });
    return;
  }

  if (isPlainObject(value)) {
    for (const [key, child] of Object.entries(value)) {
      if (unsupportedDirectives.has(key)) {
        invalid([...path, key], 'unsupported Strategic Merge Patch directive');
      }
      validatePatch(child, [...path, key]);
    }
    return;
  }

  if (!isJsonPrimitive(value)) {
    invalid(path, 'expected a JSON-compatible value');
  }
};

const mergeKeyedList = (
  generated: unknown,
  patch: unknown,
  path: string[],
  mergeKey: string,
): JsonValue => {
  if (!Array.isArray(patch)) return clone(patch as JsonValue);
  if (generated !== undefined && !Array.isArray(generated)) {
    invalid(path, 'generated value is not an array');
  }

  const generatedItems = Array.isArray(generated) ? generated : [];
  const result: JsonValue[] = generatedItems.map(item =>
    clone(item as JsonValue),
  );
  const generatedByKey = new Map<string, number>();

  generatedItems.forEach((item, index) => {
    if (!isPlainObject(item)) {
      invalid([...path, String(index)], 'generated list item is not an object');
    }
    const keyValue = item[mergeKey];
    if (typeof keyValue !== 'string' && typeof keyValue !== 'number') {
      invalid(
        [...path, String(index)],
        `generated list item is missing a string or number ${mergeKey}`,
      );
    }
    generatedByKey.set(String(keyValue), index);
  });

  for (const patchItem of patch) {
    const patchObject = patchItem as PlainObject;
    const keyValue = patchObject[mergeKey] as string | number;
    const itemPath = formatKeyedPath(path, mergeKey, keyValue);
    const generatedIndex = generatedByKey.get(String(keyValue));

    if (generatedIndex === undefined) {
      result.push(clone(patchObject));
    } else {
      const merged = mergeValue(
        generatedItems[generatedIndex],
        patchObject,
        itemPath,
      );
      if (merged !== undefined) {
        result[generatedIndex] = merged;
      }
    }
  }

  return result;
};

function mergeValue(
  generated: unknown,
  patch: unknown,
  path: string[],
): JsonValue | undefined {
  if (patch === null) return undefined;
  if (patch === undefined) return clone(generated as JsonValue);

  if (Array.isArray(patch)) {
    const fieldName = path[path.length - 1];
    const mergeKey = fieldName === undefined ? undefined : mergeKeys[fieldName];
    if (mergeKey !== undefined) {
      return mergeKeyedList(generated, patch, path, mergeKey);
    }
    return clone(patch);
  }

  if (isPlainObject(patch)) {
    if (!isPlainObject(generated)) {
      return clone(patch);
    }

    const result: Record<string, JsonValue> = {};
    for (const [key, generatedValue] of Object.entries(generated)) {
      if (!Object.prototype.hasOwnProperty.call(patch, key)) {
        result[key] = clone(generatedValue);
      }
    }
    for (const [key, patchValue] of Object.entries(patch)) {
      const merged = mergeValue(
        Object.prototype.hasOwnProperty.call(generated, key)
          ? generated[key]
          : undefined,
        patchValue,
        [...path, key],
      );
      if (merged !== undefined) {
        result[key] = merged;
      }
    }
    return result;
  }

  return clone(patch as JsonValue);
}

export function applyDeploymentPatch(
  generatedJob: V1Job,
  deploymentPatch: unknown,
): V1Job {
  if (!isPlainObject(deploymentPatch)) {
    return invalid([], 'deploymentPatch must be a plain object');
  }

  validatePatch(deploymentPatch, []);
  return mergeValue(generatedJob, deploymentPatch, []) as V1Job;
}
