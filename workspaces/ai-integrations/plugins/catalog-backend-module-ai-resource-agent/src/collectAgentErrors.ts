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

import { Entity } from '@backstage/catalog-model';

/**
 * Collects agent-specific validation errors for an AiResource entity
 * with `spec.type: 'agent'` without throwing. Returns an array of
 * error messages (empty if valid or if `spec.type` is not `'agent'`).
 *
 * Validates agent-specific fields only; does NOT re-validate core
 * entity fields such as `spec.owner` or `spec.lifecycle`.
 *
 * @internal
 */
export function collectAgentErrors(entity: Entity): string[] {
  const spec = entity.spec;
  if (spec?.type !== 'agent') {
    return [];
  }

  const errors: string[] = [];

  // Optional: spec.instructions — must be a string if present.
  // Omitted when the agent image/runtime already bakes in a default prompt.
  if (
    spec.instructions !== undefined &&
    typeof spec.instructions !== 'string'
  ) {
    errors.push(
      `spec.instructions must be a string; got ${typeLabel(spec.instructions)}`,
    );
  }

  // Optional: spec.handoffs — must be an array if present
  if (spec.handoffs !== undefined && !Array.isArray(spec.handoffs)) {
    errors.push(
      `spec.handoffs must be an array; got ${typeLabel(spec.handoffs)}`,
    );
  }

  // Optional: spec.tools — must be an array if present
  if (spec.tools !== undefined && !Array.isArray(spec.tools)) {
    errors.push(`spec.tools must be an array; got ${typeLabel(spec.tools)}`);
  }

  // Optional: spec.resetToolChoice — must be a boolean if present
  if (
    spec.resetToolChoice !== undefined &&
    typeof spec.resetToolChoice !== 'boolean'
  ) {
    errors.push(
      `spec.resetToolChoice must be a boolean; got ${typeLabel(
        spec.resetToolChoice,
      )}`,
    );
  }

  // Optional: spec.modelSettings — must be a plain object if present
  if (spec.modelSettings !== undefined) {
    if (
      typeof spec.modelSettings !== 'object' ||
      spec.modelSettings === null ||
      Array.isArray(spec.modelSettings)
    ) {
      errors.push(
        `spec.modelSettings must be an object; got ${typeLabel(
          spec.modelSettings,
        )}`,
      );
    }
  }

  // Optional: spec.toolUseBehavior — must be a string or string array
  if (spec.toolUseBehavior !== undefined) {
    if (
      typeof spec.toolUseBehavior !== 'string' &&
      !Array.isArray(spec.toolUseBehavior)
    ) {
      errors.push(
        `spec.toolUseBehavior must be a string or an array; got ${typeLabel(
          spec.toolUseBehavior,
        )}`,
      );
    }
  }

  // Optional: spec.outputSchema — must be a string or plain object
  if (spec.outputSchema !== undefined) {
    const isString = typeof spec.outputSchema === 'string';
    const isObject =
      typeof spec.outputSchema === 'object' &&
      spec.outputSchema !== null &&
      !Array.isArray(spec.outputSchema);
    if (!isString && !isObject) {
      errors.push(
        `spec.outputSchema must be a string or an object; got ${typeLabel(
          spec.outputSchema,
        )}`,
      );
    }
  }

  // Optional: spec.handoffDescription — must be a string if present
  if (
    spec.handoffDescription !== undefined &&
    typeof spec.handoffDescription !== 'string'
  ) {
    errors.push(
      `spec.handoffDescription must be a string; got ${typeLabel(
        spec.handoffDescription,
      )}`,
    );
  }

  // Optional: spec.model — must be a string if present
  if (spec.model !== undefined && typeof spec.model !== 'string') {
    errors.push(`spec.model must be a string; got ${typeLabel(spec.model)}`);
  }

  return errors;
}

/**
 * Returns a human-friendly type label for error messages.
 * Distinguishes arrays and null from plain "object".
 */
function typeLabel(value: unknown): string {
  if (value === null) {
    return 'null';
  }
  if (Array.isArray(value)) {
    return 'array';
  }
  return typeof value;
}
