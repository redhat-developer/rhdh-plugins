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

import { safeToSorted } from '../array';

describe('array', () => {
  describe('safeToSorted', () => {
    const compareNumbers = (a: number, b: number) => a - b;
    const compareStrings = (a: string, b: string) => a.localeCompare(b);

    it('should return undefined when array is undefined', () => {
      const result = safeToSorted(undefined, compareNumbers);
      expect(result).toBeUndefined();
    });

    it('should return undefined when array is null', () => {
      const result = safeToSorted(null as any, compareNumbers);
      expect(result).toBeUndefined();
    });

    it('should sort numbers in ascending order', () => {
      const array = [3, 1, 4, 1, 5, 9, 2, 6];
      const result = safeToSorted(array, compareNumbers);

      expect(result).toEqual([1, 1, 2, 3, 4, 5, 6, 9]);
      // verify original array is not mutated
      expect(array).toEqual([3, 1, 4, 1, 5, 9, 2, 6]);
    });

    it('should sort numbers in descending order', () => {
      const array = [3, 1, 4, 1, 5, 9, 2, 6];
      const descendingCompare = (a: number, b: number) => b - a;
      const result = safeToSorted(array, descendingCompare);

      expect(result).toEqual([9, 6, 5, 4, 3, 2, 1, 1]);
      // verify original array is not mutated
      expect(array).toEqual([3, 1, 4, 1, 5, 9, 2, 6]);
    });

    it('should sort strings alphabetically', () => {
      const array = ['zebra', 'apple', 'banana', 'cherry'];
      const result = safeToSorted(array, compareStrings);

      expect(result).toEqual(['apple', 'banana', 'cherry', 'zebra']);
      // verify original array is not mutated
      expect(array).toEqual(['zebra', 'apple', 'banana', 'cherry']);
    });

    it('should handle empty array', () => {
      const array: number[] = [];
      const result = safeToSorted(array, compareNumbers);

      expect(result).toEqual([]);
      expect(result).not.toBe(array); // should be a new array
    });

    it('should handle array with single element', () => {
      const array = [42];
      const result = safeToSorted(array, compareNumbers);

      expect(result).toEqual([42]);
      expect(result).not.toBe(array); // should be a new array
    });

    it('should handle array with duplicate values', () => {
      const array = [5, 2, 5, 1, 5, 3];
      const result = safeToSorted(array, compareNumbers);

      expect(result).toEqual([1, 2, 3, 5, 5, 5]);
      expect(array).toEqual([5, 2, 5, 1, 5, 3]);
    });

    it('should work with custom comparison function', () => {
      interface Person {
        name: string;
        age: number;
      }

      const people: Person[] = [
        { name: 'Alice', age: 30 },
        { name: 'Bob', age: 25 },
        { name: 'Charlie', age: 35 },
      ];

      const compareByAge = (a: Person, b: Person) => a.age - b.age;
      const result = safeToSorted(people, compareByAge);

      expect(result).toEqual([
        { name: 'Bob', age: 25 },
        { name: 'Alice', age: 30 },
        { name: 'Charlie', age: 35 },
      ]);
      // verify original array is not mutated
      expect(people).toEqual([
        { name: 'Alice', age: 30 },
        { name: 'Bob', age: 25 },
        { name: 'Charlie', age: 35 },
      ]);
    });

    it('should not mutate the original array', () => {
      const original = [3, 1, 4, 1, 5];
      const originalCopy = [...original];

      safeToSorted(original, compareNumbers);

      expect(original).toEqual(originalCopy);
    });

    it('should return a new array instance', () => {
      const array = [1, 2, 3];
      const result = safeToSorted(array, compareNumbers);

      expect(result).not.toBe(array);
      expect(Array.isArray(result)).toBe(true);
    });
  });
});
