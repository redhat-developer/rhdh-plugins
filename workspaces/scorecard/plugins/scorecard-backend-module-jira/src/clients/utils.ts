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

/**
 * Validates that a user-supplied JQL filter expression (e.g. the
 * `jira/custom-filter` annotation) cannot break out of the parentheses
 * {@link joinJqlClauses} wraps it in.
 */
export function validateJqlExpression(
  value: string,
  fieldName: string,
): string {
  const QUOTE_CHARS = new Set(['"', "'"]);
  const OPEN_BRACKETS: Record<string, string> = { '(': ')', '[': ']' };
  const CLOSE_BRACKETS: Record<string, string> = { ')': '(', ']': '[' };
  const FIRST_PRINTABLE_ASCII = 0x20; // ' '

  const fail = (reason: string): never => {
    throw new Error(`${fieldName} is not a valid JQL filter: ${reason}.`);
  };

  const characters = [...value];

  if (characters.some(char => char.charCodeAt(0) < FIRST_PRINTABLE_ASCII)) {
    fail('must not contain control characters');
  }

  const stack: string[] = [];
  let quoteChar: string | null = null;

  for (let i = 0; i < value.length; i += 1) {
    const char = value[i];

    if (quoteChar) {
      // inside a quoted string literal
      if (char === '\\') {
        i += 1; // skip escaped character
      } else if (char === quoteChar) {
        quoteChar = null; // close quote
      }
      continue;
    }

    if (QUOTE_CHARS.has(char)) {
      // open quote
      quoteChar = char;
      continue;
    }

    if (char in OPEN_BRACKETS) {
      stack.push(char);
    } else if (char in CLOSE_BRACKETS) {
      if (stack.pop() !== CLOSE_BRACKETS[char]) {
        fail(char === ')' ? 'unbalanced parentheses' : 'unbalanced brackets');
      }
    }
  }

  if (quoteChar) {
    fail('unterminated string literal');
  }
  if (stack.includes('(')) {
    fail('unbalanced parentheses');
  }
  if (stack.includes('[')) {
    fail('unbalanced brackets');
  }

  const trimmedValue = value.trim();
  if (!trimmedValue) {
    fail('must not be empty');
  }

  return trimmedValue;
}

export function joinJqlClauses(
  clauses: Array<string | undefined | null>,
): string {
  return clauses
    .filter((value): value is string => Boolean(value && value !== ''))
    .map(value => `(${value})`)
    .join(' AND ');
}

/**
 * Converts a validated ISO datetime to Unix epoch milliseconds for JQL.
 *
 * Unquoted numbers in JQL date comparisons are treated as milliseconds since
 * epoch (1970-01-01). Quoted `"yyyy-MM-dd HH:mm"` values use the configured
 * (usually server) timezone. Epoch avoids that skew.
 *
 * @see https://support.atlassian.com/jira-software-cloud/docs/jql-fields/ (`created`, `updated` fields)
 * @see https://confluence.atlassian.com/jiracoreserver/advanced-searching-fields-reference-939937719.html (`created`, `updated` fields)
 */
export function toJiraEpochMillis(value: string): number {
  return new Date(value).getTime();
}

/**
 * Reformats a datetime from a Jira API response to strict ISO-8601.
 * Jira may return offsets without a colon (`+0530`); those are normalized.
 */
export function jiraDateTimeToIso(value: string): string {
  const normalizedValue = normalizeJiraOffset(value);
  const parsedDate = new Date(normalizedValue);
  if (Number.isNaN(parsedDate.getTime())) {
    throw new TypeError(`Invalid Jira datetime "${value}"`);
  }
  return parsedDate.toISOString();
}

/** Jira can return offsets like `+0530`; ISO expects `+05:30`. */
function normalizeJiraOffset(value: string): string {
  return value.replace(/([+-]\d{2})(\d{2})$/, '$1:$2');
}
