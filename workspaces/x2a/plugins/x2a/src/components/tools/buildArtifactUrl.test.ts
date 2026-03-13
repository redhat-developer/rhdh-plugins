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

import { buildArtifactUrl } from './buildArtifactUrl';

describe('buildArtifactUrl', () => {
  describe('GitHub', () => {
    it('builds blob URL for a GitHub repo', () => {
      expect(
        buildArtifactUrl(
          'path/to/file.txt',
          'https://github.com/owner/repo',
          'main',
        ),
      ).toBe('https://github.com/owner/repo/blob/main/path/to/file.txt');
    });

    it('strips .git suffix', () => {
      expect(
        buildArtifactUrl(
          'README.md',
          'https://github.com/owner/repo.git',
          'main',
        ),
      ).toBe('https://github.com/owner/repo/blob/main/README.md');
    });

    it('handles trailing slash in repo URL', () => {
      expect(
        buildArtifactUrl(
          'src/index.ts',
          'https://github.com/owner/repo/',
          'develop',
        ),
      ).toBe('https://github.com/owner/repo/blob/develop/src/index.ts');
    });

    it('encodes branch names with special characters', () => {
      expect(
        buildArtifactUrl(
          'file.txt',
          'https://github.com/org/repo',
          'feature/foo-bar',
        ),
      ).toBe('https://github.com/org/repo/blob/feature%2Ffoo-bar/file.txt');
    });

    it('handles nested path (org/group/repo)', () => {
      expect(
        buildArtifactUrl(
          'docs/README.md',
          'https://github.com/org/group/repo',
          'main',
        ),
      ).toBe('https://github.com/org/group/repo/blob/main/docs/README.md');
    });
  });

  describe('GitLab', () => {
    it('builds blob URL with /-/ prefix for GitLab.com', () => {
      expect(
        buildArtifactUrl(
          'path/to/file.txt',
          'https://gitlab.com/group/project',
          'main',
        ),
      ).toBe('https://gitlab.com/group/project/-/blob/main/path/to/file.txt');
    });

    it('strips .git suffix for GitLab', () => {
      expect(
        buildArtifactUrl(
          'README.md',
          'https://gitlab.com/group/project.git',
          'main',
        ),
      ).toBe('https://gitlab.com/group/project/-/blob/main/README.md');
    });

    it('handles self-hosted GitLab', () => {
      expect(
        buildArtifactUrl(
          'src/main.py',
          'https://gitlab.example.com/myorg/myproject',
          'develop',
        ),
      ).toBe(
        'https://gitlab.example.com/myorg/myproject/-/blob/develop/src/main.py',
      );
    });

    it('handles trailing slash in GitLab repo URL', () => {
      expect(
        buildArtifactUrl(
          'file.txt',
          'https://gitlab.com/group/project/',
          'main',
        ),
      ).toBe('https://gitlab.com/group/project/-/blob/main/file.txt');
    });

    it('encodes branch names with special characters', () => {
      expect(
        buildArtifactUrl(
          'file.txt',
          'https://gitlab.com/group/repo',
          'feature/foo-bar',
        ),
      ).toBe('https://gitlab.com/group/repo/-/blob/feature%2Ffoo-bar/file.txt');
    });
  });

  describe('invalid URL', () => {
    it('falls back to simple concatenation for invalid URLs', () => {
      expect(buildArtifactUrl('file.txt', 'not-a-valid-url', 'main')).toBe(
        'not-a-valid-url/blob/main/file.txt',
      );
    });

    it('falls back to simple concatenation for empty URL', () => {
      expect(buildArtifactUrl('file.txt', '', 'main')).toBe(
        '/blob/main/file.txt',
      );
    });
  });
});
