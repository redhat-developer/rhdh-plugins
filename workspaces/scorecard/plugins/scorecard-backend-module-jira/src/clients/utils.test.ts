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
  isAuthType,
  isJiraProduct,
  joinJqlClauses,
  jiraDateTimeToIso,
  resolveJiraAuthType,
  toJiraEpochMillis,
  validateIdentifier,
  validateJiraToken,
  validateJQLValue,
  validateJqlExpression,
} from './utils';

describe('utils', () => {
  describe('validateJiraToken', () => {
    it('should accept bare credentials', () => {
      expect(validateJiraToken('abc123', 'jira.token')).toBe('abc123');
    });

    it('should throw when the token is empty or whitespace', () => {
      expect(() => validateJiraToken('', 'jira.token')).toThrow(
        'jira.token must be a non-empty credential.',
      );
      expect(() => validateJiraToken('   ', 'jira.token')).toThrow(
        'jira.token must be a non-empty credential.',
      );
    });
  });

  describe('isJiraProduct', () => {
    it('should accept cloud and datacenter', () => {
      expect(isJiraProduct('cloud')).toBe(true);
      expect(isJiraProduct('datacenter')).toBe(true);
    });

    it('should reject unknown products', () => {
      expect(isJiraProduct('foo')).toBe(false);
      expect(isJiraProduct(undefined)).toBe(false);
      expect(isJiraProduct(null)).toBe(false);
    });
  });

  describe('isAuthType', () => {
    it('should accept Basic and Bearer', () => {
      expect(isAuthType('Basic')).toBe(true);
      expect(isAuthType('Bearer')).toBe(true);
    });

    it('should reject unknown auth types', () => {
      expect(isAuthType('basic')).toBe(false);
      expect(isAuthType('Digest')).toBe(false);
      expect(isAuthType(undefined)).toBe(false);
    });
  });

  describe('resolveJiraAuthType', () => {
    it('should default to Basic for cloud', () => {
      expect(resolveJiraAuthType('cloud', undefined)).toBe('Basic');
    });

    it('should default to Bearer for datacenter', () => {
      expect(resolveJiraAuthType('datacenter', undefined)).toBe('Bearer');
    });

    it('should honor an explicit authType override', () => {
      expect(resolveJiraAuthType('cloud', 'Bearer')).toBe('Bearer');
      expect(resolveJiraAuthType('datacenter', 'Basic')).toBe('Basic');
    });

    it('should throw for an invalid authType', () => {
      expect(() => resolveJiraAuthType('cloud', 'Digest')).toThrow(
        'Invalid jira.authType: "Digest". Valid values are: Basic, Bearer',
      );
    });

    it('should throw for an invalid product when authType is omitted', () => {
      expect(() => resolveJiraAuthType('foo', undefined)).toThrow(
        "Invalid Jira product: foo. Valid products for 'jira.product' are: datacenter, cloud",
      );
    });

    it('should throw for an invalid product even when authType is set', () => {
      expect(() => resolveJiraAuthType('foo', 'Bearer')).toThrow(
        "Invalid Jira product: foo. Valid products for 'jira.product' are: datacenter, cloud",
      );
    });
  });

  describe('validateJQLValue', () => {
    it('should throw error for invalid JQL value', () => {
      expect(() => validateJQLValue('TEST$123', 'jira/project-key')).toThrow(
        'jira/project-key contains invalid characters. Only alphanumeric, hyphens, spaces, and underscores are allowed.',
      );
    });

    it('should return valid JQL value', () => {
      expect(validateJQLValue('TEST', 'jira/project-key')).toBe('TEST');
    });
  });

  describe('validateIdentifier', () => {
    it('should throw error for invalid identifier', () => {
      expect(() => validateIdentifier('TEST$123', 'jira/project-key')).toThrow(
        'jira/project-key contains invalid characters. Only alphanumeric, hyphens, and underscores are allowed.',
      );
    });

    it('should return valid identifier', () => {
      expect(validateIdentifier('TEST', 'jira/project-key')).toBe('TEST');
    });
  });

  describe('validateJqlExpression', () => {
    it.each([
      ['priority = High'],
      ['assignee = 000000:aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'],
      ['summary ~ "fix (regression)"'],
      ['project in (A, B) AND cf[10001] = 5'],
      ['assignee in membersOf("jira-users")'],
      ['summary ~ "say \\"hi\\""'],
      ['summary ~ "it\'s (ok)"'],
      ['summary ~ "a \\\\ b"'],
      ['summary ~ "order by priority"'],
      ['summary ~ "foo*"'],
    ])('accepts valid JQL expression %p', value => {
      expect(validateJqlExpression(value, 'jira/custom-filter')).toBe(value);
    });

    it('trims surrounding whitespace', () => {
      expect(
        validateJqlExpression('  priority = High  ', 'jira/custom-filter'),
      ).toBe('priority = High');
    });

    it('accepts an expression at the maximum length', () => {
      const value = 'a'.repeat(1000);

      expect(validateJqlExpression(value, 'jira/custom-filter')).toBe(value);
    });

    it('rejects an expression over the maximum length', () => {
      expect(() =>
        validateJqlExpression('a'.repeat(1001), 'jira/custom-filter'),
      ).toThrow(
        'jira/custom-filter is not a valid JQL filter: must not be longer than 1000 characters.',
      );
    });

    it.each([
      ['x = 1) OR (1 = 1', 'unbalanced parentheses'],
      ['(x = 1', 'unbalanced parentheses'],
      ['cf[10001 = 5', 'unbalanced brackets'],
      ['x = 1]', 'unbalanced brackets'],
      ['status = "Done', 'unterminated string literal'],
      ['summary ~ "trailing \\', 'unterminated string literal'],
      ['a = 1\nb = 2', 'must not contain control characters'],
      ['a = 1\u0000b = 2', 'must not contain control characters'],
      [
        'summary ~ \\" ) OR 1=1 ("',
        'must not contain a backslash outside a string literal',
      ],
      ["a = 'x) OR (1=1'", 'unbalanced parentheses'],
      [
        'priority = High ORDER BY created',
        'must not contain an ORDER BY clause',
      ],
      ['summary ~ "*foo"', 'must not use a leading wildcard'],
      ['summary ~ " *foo"', 'must not use a leading wildcard'],
      ['   ', 'must not be empty'],
    ])('rejects %p (%s)', (value, reason) => {
      expect(() => validateJqlExpression(value, 'jira/custom-filter')).toThrow(
        `jira/custom-filter is not a valid JQL filter: ${reason}.`,
      );
    });
  });

  describe('joinJqlClauses', () => {
    it('wraps clauses in parentheses and joins with AND', () => {
      expect(
        joinJqlClauses([
          'project = "INC"',
          'type = Incident',
          'created >= 1780272000000',
        ]),
      ).toBe(
        '(project = "INC") AND (type = Incident) AND (created >= 1780272000000)',
      );
    });

    it('skips undefined, null, and empty clauses', () => {
      expect(
        joinJqlClauses([
          'project = "INC"',
          undefined,
          null,
          '',
          'type = Incident',
        ]),
      ).toBe('(project = "INC") AND (type = Incident)');
    });

    it('returns an empty string when no clauses remain', () => {
      expect(joinJqlClauses([undefined, null, ''])).toBe('');
    });

    it('wraps a single clause', () => {
      expect(joinJqlClauses(['project = "INC"'])).toBe('(project = "INC")');
    });
  });

  describe('toJiraEpochMillis', () => {
    it('should convert ISO datetime to Unix epoch milliseconds', () => {
      expect(toJiraEpochMillis('2026-06-01T10:05:00.000Z')).toBe(1780308300000);
    });
  });

  describe('jiraDateTimeToIso', () => {
    it('should reformat Jira datetime with colon-less offset to ISO-8601', () => {
      expect(jiraDateTimeToIso('2026-07-15T18:21:34.862+0530')).toBe(
        '2026-07-15T12:51:34.862Z',
      );
    });
  });
});
