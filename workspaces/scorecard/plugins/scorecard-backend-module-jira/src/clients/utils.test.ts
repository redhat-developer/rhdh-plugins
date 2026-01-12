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

import { validateJQLValue, validateIdentifier, sanitizeValue } from './utils';

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

  describe('sanitizeValue', () => {
    it('should sanitize value', () => {
      expect(sanitizeValue('T"EST\\123')).toBe('T\\"EST\\\\123');
    });
  });
});
