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

export function normalizeTimestamp(timestamp?: unknown): Date {
  if (timestamp instanceof Date) {
    return timestamp;
  }

  if (typeof timestamp === 'number' || typeof timestamp === 'string') {
    if (timestamp === '') {
      return new Date(0);
    }
    return new Date(timestamp);
  }

  return new Date(0);
}

/**
 * Parses a required timestamp from a DB value.
 * Throws when the value is missing, empty, or not a valid date.
 */
export function parseTimestamp(timestamp: unknown): Date {
  if (timestamp instanceof Date) {
    return timestamp;
  }

  if (typeof timestamp === 'number' || typeof timestamp === 'string') {
    if (timestamp === '') {
      throw new Error('Invalid timestamp: empty string');
    }
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) {
      throw new Error(`Invalid timestamp: ${String(timestamp)}`);
    }
    return date;
  }

  throw new Error(
    `Invalid timestamp: expected Date, number, or string, got ${typeof timestamp}`,
  );
}
