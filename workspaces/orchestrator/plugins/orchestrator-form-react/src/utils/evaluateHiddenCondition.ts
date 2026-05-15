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
 * Evaluate a simple condition object.
 * All specified operators are ANDed together — every operator present must
 * evaluate to true for the field to be hidden.
 */
function evaluateConditionObject(
  condition: HiddenConditionObject,
  formData: JsonObject,
): boolean {
  const fieldValue = get(formData, condition.when);
  let result = true;
  let hasCondition = false;

  // Check isEmpty condition (hide if field is empty / not empty)
  if (condition.isEmpty !== undefined) {
    hasCondition = true;
    const empty = isEmptyValue(fieldValue);
    if (!(condition.isEmpty ? empty : !empty)) result = false;
  }

  // Check 'is' condition (hide if field equals any value)
  if (condition.is !== undefined) {
    hasCondition = true;
    if (!matchesAny(fieldValue, condition.is)) result = false;
  }

  // Check 'isNot' condition (hide if field does NOT equal any value)
  if (condition.isNot !== undefined) {
    hasCondition = true;
    if (matchesAny(fieldValue, condition.isNot)) result = false;
  }

  // Check 'isNotEmptyList' condition (hide if field is a non-empty array)
  if (condition.isNotEmptyList !== undefined) {
    hasCondition = true;
    const isNonEmptyList = Array.isArray(fieldValue) && fieldValue.length > 0;
    if (condition.isNotEmptyList ? !isNonEmptyList : isNonEmptyList)
      result = false;
  }

  // Check 'notContains' condition (hide if array does NOT contain value)
  if (condition.notContains !== undefined) {
    hasCondition = true;
    if (
      Array.isArray(fieldValue) &&
      fieldValue.includes(condition.notContains)
    )
      result = false;
  }

  return hasCondition ? result : false;
}

/**
 * Evaluate a composite condition (allOf/anyOf)
 */
function evaluateCompositeCondition(
  condition: HiddenConditionComposite,
  formData: JsonObject,
): boolean {
  // Evaluate 'allOf' (AND logic - all must be true)
  if (condition.allOf) {
    return condition.allOf.every(subCondition =>
      evaluateHiddenCondition(subCondition, formData),
    );
  }

  // Evaluate 'anyOf' (OR logic - at least one must be true)
  if (condition.anyOf) {
    return condition.anyOf.some(subCondition =>
      evaluateHiddenCondition(subCondition, formData),
    );
  }

  // No valid composite condition
  return false;
}

/**
 * Evaluate a hidden condition
 * Returns true if the field should be hidden
 */
export function evaluateHiddenCondition(
  condition: HiddenCondition,
  formData: JsonObject,
): boolean {
  // Handle boolean (static)
  if (typeof condition === 'boolean') {
    return condition;
  }

  // Handle simple condition object
  if ('when' in condition) {
    return evaluateConditionObject(condition, formData);
  }

  // Handle composite condition
  if ('allOf' in condition || 'anyOf' in condition) {
    return evaluateCompositeCondition(condition, formData);
  }

  // Unknown condition type, don't hide
  return false;
}
