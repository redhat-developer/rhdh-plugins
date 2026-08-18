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

import { Project } from './Project';

describe('Project', () => {
  const uuid = '0d52e6f4-1a2b-3c4d-5e6f-7a8b9c0d1e2f';

  describe('projectId', () => {
    it('returns the raw project ID', () => {
      const project = new Project(uuid, 'My Project');
      expect(project.projectId).toBe(uuid);
    });
  });

  describe('shortId', () => {
    it('returns the first 6 characters of the UUID', () => {
      const project = new Project(uuid, 'My Project');
      expect(project.shortId).toBe('0d52e6');
    });
  });

  describe('baseName', () => {
    it('lowercases and sanitizes a normal name', () => {
      const project = new Project(uuid, 'My Chef Migration');
      expect(project.baseName).toBe('my-chef-migration');
    });

    it('replaces special characters with dashes', () => {
      const project = new Project(uuid, 'project@name#with$special!chars');
      expect(project.baseName).toBe('project-name-with-special-chars');
    });

    it('collapses consecutive dashes', () => {
      const project = new Project(uuid, 'my---project---name');
      expect(project.baseName).toBe('my-project-name');
    });

    it('removes leading and trailing dashes', () => {
      const project = new Project(uuid, '---my-project---');
      expect(project.baseName).toBe('my-project');
    });

    it('truncates to 64 characters', () => {
      const longName = 'a'.repeat(100);
      const project = new Project(uuid, longName);
      expect(project.baseName).toBe('a'.repeat(64));
    });

    it('removes trailing dash created by truncation', () => {
      // 63 chars of 'a' + '-' + more chars = truncation at 64 leaves trailing dash
      const name = `${'a'.repeat(63)}-bbbbb`;
      const project = new Project(uuid, name);
      expect(project.baseName).toBe('a'.repeat(63));
      expect(project.baseName.endsWith('-')).toBe(false);
    });

    it('falls back to "project" when name sanitizes to empty', () => {
      const project = new Project(uuid, '!!!@@@###');
      expect(project.baseName).toBe('project');
    });

    it('falls back to "project" for empty string', () => {
      const project = new Project(uuid, '');
      expect(project.baseName).toBe('project');
    });

    it('handles unicode characters', () => {
      const project = new Project(uuid, 'проект-миграции');
      // All non-ascii chars become dashes, collapse to empty after trimming
      expect(project.baseName).toBe('project');
    });

    it('preserves numbers', () => {
      const project = new Project(uuid, 'migration-2024-v3');
      expect(project.baseName).toBe('migration-2024-v3');
    });
  });

  describe('dirName', () => {
    it('combines baseName and shortId', () => {
      const project = new Project(uuid, 'My Chef Migration');
      expect(project.dirName).toBe('my-chef-migration-0d52e6');
    });

    it('uses fallback name for empty sanitized name', () => {
      const project = new Project(uuid, '!!!');
      expect(project.dirName).toBe('project-0d52e6');
    });

    it('handles very long names with truncation', () => {
      const longName = 'a'.repeat(100);
      const project = new Project(uuid, longName);
      expect(project.dirName).toBe(`${'a'.repeat(64)}-0d52e6`);
      // total length: 64 + 1 + 6 = 71
      expect(project.dirName.length).toBe(71);
    });
  });

  describe('ReDoS protection', () => {
    it('handles adversarial input in under 100ms', () => {
      // Craft a string that could cause catastrophic backtracking with naive regex
      const adversarial =
        '-'.repeat(1000) + 'a'.repeat(1000) + '-'.repeat(1000);
      const start = Date.now();
      const project = new Project(uuid, adversarial);
      expect(project.baseName).toBeDefined();
      const elapsed = Date.now() - start;
      expect(elapsed).toBeLessThan(100);
    });
  });
});
