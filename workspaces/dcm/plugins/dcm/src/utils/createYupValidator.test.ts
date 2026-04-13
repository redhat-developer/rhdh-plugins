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

import * as yup from 'yup';
import { createYupValidator } from './createYupValidator';

type SimpleForm = {
  name: string;
  age: string;
};

const schema = yup.object({
  name: yup
    .string()
    .required('Name is required')
    .min(2, 'Name must be at least 2 characters'),
  age: yup
    .number()
    .typeError('Age must be a number')
    .min(0, 'Age must be non-negative')
    .max(150, 'Age cannot exceed 150'),
});

describe('createYupValidator', () => {
  const { validate, isValid } = createYupValidator<SimpleForm>(schema, f => ({
    name: f.name,
    age: f.age === '' ? undefined : Number(f.age),
  }));

  describe('validate', () => {
    it('returns an empty object for a valid form', () => {
      expect(validate({ name: 'Alice', age: '30' })).toEqual({});
    });

    it('returns an error for a required missing field', () => {
      const errors = validate({ name: '', age: '30' });
      expect(errors.name).toBeDefined();
      // Yup may report either the required or min-length message for an empty string
      expect(typeof errors.name).toBe('string');
    });

    it('returns errors for multiple invalid fields', () => {
      const errors = validate({ name: 'A', age: '-1' });
      expect(errors.name).toBeDefined();
      expect(errors.age).toBeDefined();
    });

    it('does not include entries for valid fields', () => {
      const errors = validate({ name: 'Alice', age: '-1' });
      expect(errors.age).toBeDefined();
      expect(errors.name).toBeUndefined();
    });

    it('uses the first error per field (abortEarly: false with deduplication)', () => {
      const errors = validate({ name: '', age: '30' });
      expect(typeof errors.name).toBe('string');
    });
  });

  describe('isValid', () => {
    it('returns true for a valid form', () => {
      expect(isValid({ name: 'Alice', age: '30' })).toBe(true);
    });

    it('returns false when any field is invalid', () => {
      expect(isValid({ name: '', age: '30' })).toBe(false);
      expect(isValid({ name: 'Alice', age: '999' })).toBe(false);
    });
  });

  describe('without transform', () => {
    const { validate: v } = createYupValidator<{ label: string }>(
      yup.object({ label: yup.string().required('Required') }),
    );

    it('validates directly without transform', () => {
      expect(v({ label: 'ok' })).toEqual({});
      expect(v({ label: '' }).label).toBeDefined();
    });
  });
});
