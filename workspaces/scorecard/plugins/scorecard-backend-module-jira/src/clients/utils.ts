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

export function validateJQLValue(value: string, fieldName: string): string {
  if (!/^[a-zA-Z0-9 _-]+$/.test(value)) {
    throw new Error(
      `${fieldName} contains invalid characters. Only alphanumeric, hyphens, spaces, and underscores are allowed.`,
    );
  }
  return value;
}

export function validateIdentifier(value: string, fieldName: string): string {
  if (!/^[a-zA-Z0-9-]+$/.test(value)) {
    throw new Error(
      `${fieldName} contains invalid characters. Only alphanumeric, hyphens, and underscores are allowed.`,
    );
  }
  return value;
}

export function sanitizeValue(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

export function joinJqlClauses(
  clauses: Array<string | undefined | null>,
): string {
  return clauses
    .filter((value): value is string => Boolean(value && value !== ''))
    .map(value => `(${value})`)
    .join(' AND ');
}

export function toJiraDateTime(value: string): string {
  const parsedDate = parseDateTime(value);

  const year = parsedDate.getUTCFullYear();
  const month = String(parsedDate.getUTCMonth() + 1).padStart(2, '0');
  const day = String(parsedDate.getUTCDate()).padStart(2, '0');
  const hours = String(parsedDate.getUTCHours()).padStart(2, '0');
  const minutes = String(parsedDate.getUTCMinutes()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

export function toIsoDateTime(value: string): string {
  return parseDateTime(value).toISOString();
}

function parseDateTime(value: string): Date {
  const normalizedValue = normalizeTimezone(value);
  const parsedDate = new Date(normalizedValue);
  if (Number.isNaN(parsedDate.getTime())) {
    throw new Error(`Invalid datetime "${value}"`);
  }
  return parsedDate;
}

function normalizeTimezone(value: string): string {
  // Jira can return offsets like +0530; normalize to +05:30 for strict ISO parsing.
  return value.replace(/([+-]\d{2})(\d{2})$/, '$1:$2');
}
