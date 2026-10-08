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
