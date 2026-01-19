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

/**
 * Sorts an array using toSorted if available, otherwise falls back to sort.
 * Handles the case where the array might be undefined.
 *
 * @param array - The array to sort (can be undefined)
 * @param compareFn - The comparison function for sorting
 * @returns The sorted array, or undefined if input was undefined
 */
export const safeToSorted = <T>(
  array: T[] | undefined,
  compareFn: (a: T, b: T) => number,
): T[] | undefined => {
  if (!array) return undefined;

  // @ts-expect-error: toSorted might not be in TS yet
  if (typeof array.toSorted === 'function') {
    // @ts-expect-error: toSorted might not be in TS yet
    return array.toSorted(compareFn);
  }

  return [...array].sort(compareFn);
};
