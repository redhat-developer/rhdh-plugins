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
 * Evaluate a simple condition object
 */
function evaluateConditionObject(
  condition: HiddenConditionObject,
  formData: JsonObject,
): boolean {
  const fieldValue = get(formData, condition.when);

  // Check isEmpty condition
  if (condition.isEmpty !== undefined) {
    const empty = isEmptyValue(fieldValue);
    return condition.isEmpty ? empty : !empty;
  }

  // Check 'is' condition (hide if field equals any value)
  if (condition.is !== undefined) {
    return matchesAny(fieldValue, condition.is);
  }

  // Check 'isNot' condition (hide if field does NOT equal any value)
  if (condition.isNot !== undefined) {
    return !matchesAny(fieldValue, condition.isNot);
  }

  // No valid condition found, don't hide
  return false;
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
