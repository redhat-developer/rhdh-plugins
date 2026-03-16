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

import { buildRepoBranchUrl } from './buildRepoBranchUrl';

describe('buildRepoBranchUrl', () => {
  describe('GitHub', () => {
    it('builds tree URL for GitHub repo', () => {
      expect(buildRepoBranchUrl('https://github.com/owner/repo', 'main')).toBe(
        'https://github.com/owner/repo/tree/main',
      );
    });

    it('strips .git suffix and builds GitHub tree URL', () => {
      expect(
        buildRepoBranchUrl('https://github.com/owner/repo.git', 'main'),
      ).toBe('https://github.com/owner/repo/tree/main');
    });

    it('handles GitHub URL with trailing slash in path', () => {
      expect(
        buildRepoBranchUrl('https://github.com/owner/repo/', 'develop'),
      ).toBe('https://github.com/owner/repo/tree/develop');
    });

    it('encodes branch names with special characters', () => {
      expect(
        buildRepoBranchUrl('https://github.com/org/repo', 'feature/foo-bar'),
      ).toBe('https://github.com/org/repo/tree/feature%2Ffoo-bar');
    });

    it('handles nested path (org/group/repo)', () => {
      expect(
        buildRepoBranchUrl('https://github.com/org/group/repo', 'main'),
      ).toBe('https://github.com/org/group/repo/tree/main');
    });
  });

  describe('GitLab', () => {
    it('builds tree URL for GitLab.com repo', () => {
      expect(
        buildRepoBranchUrl('https://gitlab.com/group/project', 'main'),
      ).toBe('https://gitlab.com/group/project/-/tree/main');
    });

    it('strips .git suffix and builds GitLab tree URL', () => {
      expect(
        buildRepoBranchUrl('https://gitlab.com/group/project.git', 'main'),
      ).toBe('https://gitlab.com/group/project/-/tree/main');
    });

    it('handles self-hosted GitLab', () => {
      expect(
        buildRepoBranchUrl(
          'https://gitlab.example.com/myorg/myproject',
          'develop',
        ),
      ).toBe('https://gitlab.example.com/myorg/myproject/-/tree/develop');
    });

    it('handles GitLab URL with trailing slash in path', () => {
      expect(
        buildRepoBranchUrl('https://gitlab.com/group/project/', 'main'),
      ).toBe('https://gitlab.com/group/project/-/tree/main');
    });

    it('encodes branch names with special characters', () => {
      expect(
        buildRepoBranchUrl('https://gitlab.com/group/repo', 'feature/foo-bar'),
      ).toBe('https://gitlab.com/group/repo/-/tree/feature%2Ffoo-bar');
    });
  });

  describe('Bitbucket', () => {
    it('builds branch URL for Bitbucket repo', () => {
      expect(
        buildRepoBranchUrl('https://bitbucket.org/owner/repo', 'main'),
      ).toBe('https://bitbucket.org/owner/repo/branch/main');
    });

    it('strips .git suffix and builds Bitbucket branch URL', () => {
      expect(
        buildRepoBranchUrl('https://bitbucket.org/owner/repo.git', 'main'),
      ).toBe('https://bitbucket.org/owner/repo/branch/main');
    });

    it('encodes branch names with special characters', () => {
      expect(
        buildRepoBranchUrl(
          'https://bitbucket.org/owner/repo',
          'feature/foo-bar',
        ),
      ).toBe('https://bitbucket.org/owner/repo/branch/feature%2Ffoo-bar');
    });
  });

  describe('other SCMs (fallback to GitLab flow)', () => {
    it('uses GitLab-style URL for custom Git host', () => {
      expect(
        buildRepoBranchUrl(
          'https://gitea.example.com/org/myproject',
          'develop',
        ),
      ).toBe('https://gitea.example.com/org/myproject/-/tree/develop');
    });
  });

  describe('invalid URL', () => {
    it('returns base URL unchanged when URL is invalid', () => {
      const invalid = 'not-a-valid-url';
      expect(buildRepoBranchUrl(invalid, 'main')).toBe(invalid);
    });

    it('returns base URL when URL parsing throws', () => {
      expect(buildRepoBranchUrl('', 'main')).toBe('');
    });
  });
});
