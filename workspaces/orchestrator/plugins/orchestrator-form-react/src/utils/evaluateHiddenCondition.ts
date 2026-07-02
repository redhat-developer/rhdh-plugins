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

import { JsonObject, JsonValue } from '@backstage/types';

import get from 'lodash/get';
import has from 'lodash/has';

import {
  HiddenCondition,
  HiddenConditionComposite,
  HiddenConditionObject,
} from '../types/HiddenCondition';

/**
 * Check if a value is considered empty
 */
function isEmptyValue(value: JsonValue | undefined): boolean {
  if (value === undefined || value === null) {
    return true;
  }
  if (typeof value === 'string' && value.trim() === '') {
    return true;
  }
  if (Array.isArray(value) && value.length === 0) {
    return true;
  }
  return false;
}

/**
 * Check if a value matches any in a list
 */
function matchesAny(
  value: JsonValue | undefined,
  targets: JsonValue | JsonValue[],
): boolean {
  const targetArray = Array.isArray(targets) ? targets : [targets];
  return targetArray.some(target => {
    // Handle deep equality for objects and arrays
    if (typeof value === 'object' && typeof target === 'object') {
      return JSON.stringify(value) === JSON.stringify(target);
    }
    return value === target;
  });
}

/**
 * Resolves the value for a `when` path. Prefers the current object's form data
 * (sibling fields in the same step/object), then falls back to root form data
 * for cross-step paths such as `step1.field1`.
 */
export function getValueForWhen(
  when: string,
  localFormData: JsonObject,
  rootFormData?: JsonObject,
): JsonValue | undefined {
  if (has(localFormData, when)) {
    return get(localFormData, when);
  }
  if (rootFormData !== undefined && rootFormData !== localFormData) {
    return get(rootFormData, when);
  }
  return get(localFormData, when);
}

/**
 * Evaluate a simple condition object
 */
function evaluateConditionObject(
  condition: HiddenConditionObject,
  localFormData: JsonObject,
  rootFormData?: JsonObject,
): boolean {
  const fieldValue = getValueForWhen(
    condition.when,
    localFormData,
    rootFormData,
  );

  let hasCondition = false;
  let shouldHide = true;

  // Check isEmpty condition
  if (condition.isEmpty !== undefined) {
    hasCondition = true;
    const empty = isEmptyValue(fieldValue);
    if (!(condition.isEmpty ? empty : !empty)) {
      shouldHide = false;
    }
  }

  // Check 'is' condition (hide if field equals any value)
  if (condition.is !== undefined) {
    hasCondition = true;
    if (!matchesAny(fieldValue, condition.is)) {
      shouldHide = false;
    }
  }

  // Check 'isNot' condition (hide if field does NOT equal any value)
  if (condition.isNot !== undefined) {
    hasCondition = true;
    if (matchesAny(fieldValue, condition.isNot)) {
      shouldHide = false;
    }
  }

  // Check 'isNotEmptyList' condition
  if (condition.isNotEmptyList !== undefined) {
    hasCondition = true;
    const isNonEmptyList = Array.isArray(fieldValue) && fieldValue.length > 0;
    if (!(condition.isNotEmptyList ? isNonEmptyList : !isNonEmptyList)) {
      shouldHide = false;
    }
  }

  // Check 'notContains' condition (hide when array does not include value)
  if (condition.notContains !== undefined) {
    hasCondition = true;
    const notContainsTarget = condition.notContains;
    const notContainsValue =
      Array.isArray(fieldValue) &&
      !fieldValue.some(item => matchesAny(item, notContainsTarget));
    if (!notContainsValue) {
      shouldHide = false;
    }
  }

  // No valid condition found, don't hide
  return hasCondition ? shouldHide : false;
}

/**
 * Evaluate a composite condition (allOf/anyOf)
 */
function evaluateCompositeCondition(
  condition: HiddenConditionComposite,
  localFormData: JsonObject,
  rootFormData?: JsonObject,
): boolean {
  // Evaluate 'allOf' (AND logic - all must be true)
  if (condition.allOf) {
    return condition.allOf.every(subCondition =>
      evaluateHiddenCondition(subCondition, localFormData, rootFormData),
    );
  }

  // Evaluate 'anyOf' (OR logic - at least one must be true)
  if (condition.anyOf) {
    return condition.anyOf.some(subCondition =>
      evaluateHiddenCondition(subCondition, localFormData, rootFormData),
    );
  }

  // No valid composite condition
  return false;
}

/**
 * Evaluate a hidden condition
 * Returns true if the field should be hidden
 *
 * @param localFormData - Form data for the current object (sibling field scope)
 * @param rootFormData - Optional root form data for cross-step/cross-object `when` paths
 */
export function evaluateHiddenCondition(
  condition: HiddenCondition,
  localFormData: JsonObject,
  rootFormData?: JsonObject,
): boolean {
  // Handle boolean (static)
  if (typeof condition === 'boolean') {
    return condition;
  }

  // Handle simple condition object
  if ('when' in condition) {
    return evaluateConditionObject(condition, localFormData, rootFormData);
  }

  // Handle composite condition
  if ('allOf' in condition || 'anyOf' in condition) {
    return evaluateCompositeCondition(condition, localFormData, rootFormData);
  }

  // Unknown condition type, don't hide
  return false;
}
