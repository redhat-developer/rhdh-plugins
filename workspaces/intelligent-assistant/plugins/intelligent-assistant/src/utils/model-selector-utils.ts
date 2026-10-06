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

export const MODEL_SELECTOR_TOGGLE_MAX_LENGTH = 15;

export function isModelSelectorLabelTruncated(label: string): boolean {
  return label.trim().length > MODEL_SELECTOR_TOGGLE_MAX_LENGTH;
}

/** Short label for the closed model selector toggle. */
export function truncateModelSelectorLabel(label: string): string {
  const trimmed = label.trim();
  if (trimmed.length <= MODEL_SELECTOR_TOGGLE_MAX_LENGTH) {
    return trimmed;
  }
  return `${trimmed.slice(0, MODEL_SELECTOR_TOGGLE_MAX_LENGTH - 1)}…`;
}
