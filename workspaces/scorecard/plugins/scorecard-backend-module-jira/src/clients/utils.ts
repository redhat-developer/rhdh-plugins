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

import type { AuthType, Product } from './types';

const QUOTE_CHARS = new Set(['"']);
const OPEN_BRACKETS: Record<string, string> = { '(': ')', '[': ']' };
const CLOSE_BRACKETS: Record<string, string> = { ')': '(', ']': '[' };
const BRACKET_LABELS: Record<string, string> = {
  '(': 'parentheses',
  '[': 'brackets',
};
const FIRST_PRINTABLE_ASCII = 0x20; // ' '
const MAX_JQL_EXPRESSION_LENGTH = 1000;
const ORDER_BY_PATTERN = /\bORDER\s+BY\b/i;
const LEADING_WILDCARD_PATTERN = /~[\s"']*[*?]/;

export function validateJiraToken(token: string, fieldName: string): string {
  if (token.trim().length === 0) {
    throw new Error(`${fieldName} must be a non-empty credential.`);
  }
  return token;
}

export function resolveJiraAuthType(
  product: unknown,
  authType: unknown,
): AuthType {
  if (!isJiraProduct(product)) {
    throw new Error(
      `Invalid Jira product: ${product}. Valid products for 'jira.product' are: datacenter, cloud`,
    );
  }

  if (authType !== undefined) {
    if (!isAuthType(authType)) {
      throw new Error(
        `Invalid jira.authType: ${JSON.stringify(
          authType,
        )}. Valid values are: Basic, Bearer`,
      );
    }
    return authType;
  }

  if (product === 'cloud') return 'Basic' as AuthType;

  // product is 'datacenter'
  return 'Bearer' as AuthType;
}

export function isJiraProduct(product: unknown): product is Product {
  return (
    typeof product === 'string' &&
    (product === 'cloud' || product === 'datacenter')
  );
}

export function isAuthType(authType: unknown): authType is AuthType {
  return (
    typeof authType === 'string' &&
    (authType === 'Basic' || authType === 'Bearer')
  );
}

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
  const fail = (reason: string): never => {
    throw new Error(`${fieldName} is not a valid JQL filter: ${reason}.`);
  };

  if (value.length > MAX_JQL_EXPRESSION_LENGTH) {
    fail(`must not be longer than ${MAX_JQL_EXPRESSION_LENGTH} characters`);
  }

  if (containsControlCharacter(value)) {
    fail('must not contain control characters');
  }

  if (LEADING_WILDCARD_PATTERN.test(value)) {
    fail('must not use a leading wildcard');
  }

  const structuralError = findStructuralError(value);
  if (structuralError) {
    fail(structuralError);
  }

  const trimmedValue = value.trim();
  if (!trimmedValue) {
    fail('must not be empty');
  }

  return trimmedValue;
}

function containsControlCharacter(value: string): boolean {
  const characters = [...value];

  const containsControlChars = characters.some(char => {
    const charCode = char.codePointAt(0) ?? 0;

    return charCode < FIRST_PRINTABLE_ASCII;
  });
  return containsControlChars;
}

/**
 * Scans a JQL expression for syntax that could break out of the parentheses
 * {@link joinJqlClauses} wraps it in. Returns the failure reason, or `null`
 * when the expression is well-formed.
 */
function findStructuralError(value: string): string | null {
  const masked = maskStringLiterals(value);
  if (masked === null) {
    return 'unterminated string literal';
  }

  // Masking blanks every string literal, escapes included, so a
  // surviving backslash is by definition outside one -- which is not valid
  if (masked.includes('\\')) {
    return 'must not contain a backslash outside a string literal';
  }

  if (ORDER_BY_PATTERN.test(masked)) {
    return 'must not contain an ORDER BY clause';
  }

  return findUnbalancedBracket(masked);
}

/**
 * Replaces every string literal in a JQL expression -- quotes
 * included -- with spaces, so that a later scan can treat the result as
 * quote-free. Returns `null` when a literal is never closed.
 */
function maskStringLiterals(value: string): string | null {
  const maskedChars: string[] = [];
  let currentQuoteChar: string | null = null;
  let escaped = false;

  for (const char of value) {
    const insideLiteral = currentQuoteChar !== null || QUOTE_CHARS.has(char);
    maskedChars.push(insideLiteral ? ' ' : char);

    if (escaped) {
      escaped = false;
    } else if (currentQuoteChar === null) {
      currentQuoteChar = QUOTE_CHARS.has(char) ? char : null;
    } else if (char === '\\') {
      escaped = true;
    } else if (char === currentQuoteChar) {
      currentQuoteChar = null; // close quote
    }
  }

  const isStringLiteralClosed = currentQuoteChar === null;

  return isStringLiteralClosed ? maskedChars.join('') : null;
}

/**
 * Balances `(`/`)` and `[`/`]` in text that is already known to contain
 * no string literals. Returns the failure reason, or `null` if balanced.
 */
function findUnbalancedBracket(value: string): string | null {
  const unbalancedReason = (openBracket: string): string => {
    return `unbalanced ${BRACKET_LABELS[openBracket]}`;
  };

  const stack: string[] = [];

  for (const char of value) {
    if (char in OPEN_BRACKETS) {
      stack.push(char);
    } else if (char in CLOSE_BRACKETS && stack.pop() !== CLOSE_BRACKETS[char]) {
      return unbalancedReason(CLOSE_BRACKETS[char]);
    }
  }

  const stackTop = stack.pop();

  return stackTop ? unbalancedReason(stackTop) : null;
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
