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
  joinJqlClauses,
  toIsoDateTime,
  toJiraDateTime,
  validateIdentifier,
  validateJQLValue,
} from './utils';

describe('utils', () => {
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

  describe('joinJqlClauses', () => {
    it('wraps clauses in parentheses and joins with AND', () => {
      expect(
        joinJqlClauses([
          'project = "INC"',
          'type = Incident',
          'created >= "2026-06-01 00:00"',
        ]),
      ).toBe(
        '(project = "INC") AND (type = Incident) AND (created >= "2026-06-01 00:00")',
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

  describe('toJiraDateTime', () => {
    it('should convert ISO datetime to Jira datetime format', () => {
      expect(toJiraDateTime('2026-06-01T10:05:00.000Z')).toBe(
        '2026-06-01 10:05',
      );
    });
  });

  describe('toIsoDateTime', () => {
    it('should normalize Jira datetime offset without colon', () => {
      expect(toIsoDateTime('2026-07-15T18:21:34.862+0530')).toBe(
        '2026-07-15T12:51:34.862Z',
      );
    });
  });
});
