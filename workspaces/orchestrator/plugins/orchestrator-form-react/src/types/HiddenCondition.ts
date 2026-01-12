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

import { JsonValue } from '@backstage/types';

/**
 * Simple condition object for hiding fields based on form data
 * @public
 */
export interface HiddenConditionObject {
  /**
   * Field path to check (e.g., "deploymentType" or "config.nested.field")
   */
  when: string;

  /**
   * Hide if the field value equals any of these values (OR logic)
   * Can be a single value or an array of values
   */
  is?: JsonValue | JsonValue[];

  /**
   * Hide if the field value does NOT equal any of these values
   * Can be a single value or an array of values
   */
  isNot?: JsonValue | JsonValue[];

  /**
   * Hide if the field is empty (undefined, null, empty string, or empty array)
   */
  isEmpty?: boolean;
}

/**
 * Composite condition for complex logic
 * @public
 */
export interface HiddenConditionComposite {
  /**
   * Hide if ALL conditions are true (AND logic)
   */
  allOf?: HiddenCondition[];

  /**
   * Hide if ANY condition is true (OR logic)
   */
  anyOf?: HiddenCondition[];
}

/**
 * Union type for all possible ui:hidden values
 * @public
 */
export type HiddenCondition =
  | boolean // Static: true/false
  | HiddenConditionObject // Simple condition
  | HiddenConditionComposite; // Composite conditions
