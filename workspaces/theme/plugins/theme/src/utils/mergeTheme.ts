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

import { ThemeConfig } from '../types';

function isObject(
  objectOrValue: unknown,
): objectOrValue is Record<string, unknown> {
  return (
    objectOrValue !== undefined &&
    objectOrValue !== null &&
    typeof objectOrValue === 'object' &&
    !Array.isArray(objectOrValue)
  );
}

const deepCopyObject = (objectOrValue: unknown): unknown => {
  if (isObject(objectOrValue)) {
    const result: Record<string, unknown> = {};
    for (const key of Object.keys(objectOrValue)) {
      result[key] = deepCopyObject(objectOrValue[key]);
    }
    return result;
  }
  return objectOrValue;
};

export const deepMergeObjects = (
  defaultValue: unknown,
  customValue: unknown,
): unknown => {
  if (isObject(defaultValue) || isObject(customValue)) {
    const result: Record<string, unknown> = {};
    if (isObject(defaultValue) && isObject(customValue)) {
      for (const key of Object.keys(defaultValue)) {
        result[key] = deepMergeObjects(defaultValue[key], customValue[key]);
      }
      for (const key of Object.keys(customValue)) {
        result[key] = deepMergeObjects(defaultValue[key], customValue[key]);
      }
    } else if (customValue === null) {
      return null;
    } else if (isObject(customValue)) {
      for (const key of Object.keys(customValue)) {
        result[key] = deepCopyObject(customValue[key]);
      }
    } else if (isObject(defaultValue)) {
      for (const key of Object.keys(defaultValue)) {
        result[key] = deepCopyObject(defaultValue[key]);
      }
    }
    return result;
  }
  return customValue !== undefined ? customValue : defaultValue;
};

/**
 * Merges two theme configurations with this priority:
 *
 * 1. Values will be picked up first from the `defaultThemeConfig` and
 *    then from the `customizedThemeConfig`.
 *    This means that if a value is set in the customized theme, it will 'override' the default.
 * 2. Null values in `customizedThemeConfig` the will override the default with `null`,
 *    while undefined values will be ignored.
 * 3. Objects will be merged recursively.
 *    All other values, esp. Arrays, will not be merged.
 *
 * @param defaultThemeConfig
 * @param customizedThemeConfig
 * @returns
 */
export const mergeUnifiedThemeOptions = (
  defaultThemeConfig: ThemeConfig,
  customizedThemeConfig: ThemeConfig,
): ThemeConfig => {
  return deepMergeObjects(
    defaultThemeConfig,
    customizedThemeConfig,
  ) as ThemeConfig;
};
