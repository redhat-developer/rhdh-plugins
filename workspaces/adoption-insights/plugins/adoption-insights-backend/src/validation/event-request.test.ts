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
import { EventRequestSchema } from './event-request';

describe('EventRequestSchema', () => {
  it('should validate a correct schema', () => {
    const validData = {
      start_date: '2025-03-01',
      end_date: '2025-03-02',
      limit: '10',
      kind: 'component',
      type: 'top_catalog_entities',
      format: 'json',
    };

    expect(() => EventRequestSchema.parse(validData)).not.toThrow();
  });

  it('should reject if start_date is greater than end_date', () => {
    const invalidData = {
      start_date: '2025-03-03',
      end_date: '2025-03-02',
      type: 'top_catalog_entities',
    };

    expect(() => EventRequestSchema.parse(invalidData)).toThrow(
      'start_date should not be greater than end_date',
    );
  });

  it('should allow optional fields to be omitted', () => {
    const minimalValidData = {
      start_date: '2025-03-01',
      end_date: '2025-03-02',
      type: 'top_catalog_entities',
    };

    expect(() => EventRequestSchema.parse(minimalValidData)).not.toThrow();
  });

  it('should reject an invalid type', () => {
    const invalidData = {
      start_date: '2025-03-01',
      end_date: '2025-03-02',
      type: 'invalid_type',
    };

    expect(() => EventRequestSchema.parse(invalidData)).toThrow(
      /Invalid type. Allowed values:/,
    );
  });

  it('should reject an invalid format', () => {
    const invalidData = {
      start_date: '2025-03-01',
      end_date: '2025-03-02',
      type: 'top_catalog_entities',
      format: 'xml', // Invalid format
    };

    expect(() => EventRequestSchema.parse(invalidData)).toThrow(
      'Invalid format. Allowed values: json, csv',
    );
  });

  it('should convert limit to a number', () => {
    const validData = {
      start_date: '2025-03-01',
      end_date: '2025-03-02',
      type: 'top_catalog_entities',
      limit: '5', // String input
    };

    const parsed = EventRequestSchema.parse(validData);
    expect(parsed.limit).toBe(5);
  });

  it('should reject a non-numeric limit', () => {
    const invalidData = {
      start_date: '2025-03-01',
      end_date: '2025-03-02',
      type: 'top_catalog_entities',
      limit: 'abc',
    };

    expect(() => EventRequestSchema.parse(invalidData)).toThrow();
  });

  it('Valid dates should pass', () => {
    const result = EventRequestSchema.safeParse({
      start_date: '2024-03-01',
      end_date: '2024-03-10',
      type: 'top_catalog_entities',
    });

    expect(result.success).toBe(true);
  });

  it('Invalid start_date format should fail', () => {
    const result = EventRequestSchema.safeParse({
      start_date: '2024-03-1',
      end_date: '2024-03-10',
      type: 'top_catalog_entities',
    });

    expect(result.success).toBe(false);
    expect(result.error?.format()).toHaveProperty('start_date');
    expect(result.error?.format().start_date?._errors[0]).toBe(
      'Invalid date format for start_date. Expected YYYY-MM-DD (e.g., 2025-03-02)',
    );
  });

  it('Invalid end_date format should fail', () => {
    const result = EventRequestSchema.safeParse({
      start_date: '2024-03-01',
      end_date: '2024-03-4',
      type: 'top_catalog_entities',
    });

    expect(result.success).toBe(false);
    expect(result.error?.format()).toHaveProperty('end_date');
    // expect(result.error?.format()._errors?.[0]).toBe(
    //   'Invalid date format for end_date. Expected YYYY-MM-DD (e.g., 2025-03-02)',
    // );
  });

  it('start_date after end_date should fail', () => {
    const result = EventRequestSchema.safeParse({
      start_date: '2024-03-10',
      end_date: '2024-03-01',
      type: 'top_catalog_entities',
    });

    expect(result.success).toBe(false);
    expect(result.error?.format()).toHaveProperty('end_date');
    expect(result.error?.format().end_date?._errors[0]).toBe(
      'start_date should not be greater than end_date',
    );
  });

  it('start_date equals end_date should pass', () => {
    const result = EventRequestSchema.safeParse({
      start_date: '2024-03-10',
      end_date: '2024-03-10',
      type: 'top_catalog_entities',
    });

    expect(result.success).toBe(true);
  });
});
