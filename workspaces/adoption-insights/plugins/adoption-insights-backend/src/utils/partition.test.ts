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
import {
  extractOverlappingPartition,
  parsePartitionDate,
  isPartitionOverlapError,
} from './partition';

describe('extractOverlappingPartition', () => {
  it('should extract the overlapping partition name', () => {
    const msg =
      'partition "events_2025_05" would overlap partition "events_2025_04"';
    expect(extractOverlappingPartition(msg)).toBe('events_2025_04');
  });

  it('should return empty string if pattern does not match', () => {
    const msg = 'some other error message';
    expect(extractOverlappingPartition(msg)).toBe('');
  });
});

describe('parsePartitionDate', () => {
  it('should parse valid partition name', () => {
    const input = 'events_2025_04';
    expect(parsePartitionDate(input)).toEqual({ year: 2025, month: 4 });
  });

  it('should parse single-digit month correctly', () => {
    const input = 'events_2025_9';
    expect(parsePartitionDate(input)).toEqual({ year: 2025, month: 9 });
  });

  it('should throw error for invalid format', () => {
    const input = 'invalid_partition_name';
    expect(() => parsePartitionDate(input)).toThrow(
      'Cannot parse partition name: invalid_partition_name',
    );
  });
});

describe('isPartitionOverlapError', () => {
  it('should return true for overlap error', () => {
    const err = {
      message:
        'partition "events_2025_05" would overlap partition "events_2025_04"',
    };
    expect(isPartitionOverlapError(err)).toBe(true);
  });

  it('should return false for non-overlap error', () => {
    const err = { message: 'some other error' };
    expect(isPartitionOverlapError(err)).toBe(false);
  });

  it('should return false if message is missing', () => {
    const err = { msg: 'missing message property' };
    expect(isPartitionOverlapError(err)).toBe(false);
  });

  it('should return false for null error', () => {
    expect(isPartitionOverlapError(null)).toBe(false);
  });

  it('should return false for non-object error', () => {
    expect(isPartitionOverlapError('error string')).toBe(false);
  });
});
