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

/* eslint-disable no-script-url */

import { computeRepositoryUrl } from './repository';

describe('computeRepositoryUrl', () => {
  it('returns undefined when repository.url fails D11', () => {
    const result = computeRepositoryUrl({
      url: 'javascript:alert(1)',
      source: 'github',
    });
    expect(result).toBeUndefined();
  });

  it('returns normalized base when no subfolder', () => {
    const result = computeRepositoryUrl({
      url: 'https://github.com/org/repo',
      source: 'github',
    });
    expect(result).toEqual({
      combinedUrl: 'https://github.com/org/repo',
      originalUrl: 'https://github.com/org/repo',
    });
  });

  it('strips trailing slash from base URL', () => {
    const result = computeRepositoryUrl({
      url: 'https://github.com/org/repo/',
      source: 'github',
    });
    expect(result?.combinedUrl).toBe('https://github.com/org/repo');
    expect(result?.originalUrl).toBe('https://github.com/org/repo/');
  });

  it('strips trailing .git from base URL', () => {
    const result = computeRepositoryUrl({
      url: 'https://github.com/org/repo.git',
      source: 'github',
    });
    expect(result?.combinedUrl).toBe('https://github.com/org/repo');
  });

  it('strips trailing .git/ from base URL without double-slash', () => {
    const result = computeRepositoryUrl({
      url: 'https://github.com/org/repo.git/',
      source: 'github',
    });
    expect(result?.combinedUrl).toBe('https://github.com/org/repo');
  });

  it('trims whitespace from repository.url', () => {
    const result = computeRepositoryUrl({
      url: '  https://github.com/org/repo  ',
      source: 'github',
    });
    expect(result?.originalUrl).toBe('https://github.com/org/repo');
    expect(result?.combinedUrl).toBe('https://github.com/org/repo');
  });

  it('strips .git from pathname when URL has query parameters', () => {
    const result = computeRepositoryUrl({
      url: 'https://example.com/org/repo.git?ref=main',
      source: 'github',
    });
    expect(result?.combinedUrl).toBe('https://example.com/org/repo?ref=main');
  });

  it('strips .git from pathname when URL has fragment', () => {
    const result = computeRepositoryUrl({
      url: 'https://example.com/org/repo.git#readme',
      source: 'github',
    });
    expect(result?.combinedUrl).toBe('https://example.com/org/repo#readme');
  });

  describe('SCM-aware subfolder combination', () => {
    it('uses /tree/HEAD/ for GitHub', () => {
      const result = computeRepositoryUrl({
        url: 'https://github.com/org/repo',
        source: 'github',
        subfolder: 'src/server',
      });
      expect(result?.combinedUrl).toBe(
        'https://github.com/org/repo/tree/HEAD/src/server',
      );
    });

    it('uses /-/tree/HEAD/ for GitLab', () => {
      const result = computeRepositoryUrl({
        url: 'https://gitlab.com/group/repo',
        source: 'gitlab',
        subfolder: 'servers/weather',
      });
      expect(result?.combinedUrl).toBe(
        'https://gitlab.com/group/repo/-/tree/HEAD/servers/weather',
      );
    });

    it('uses /src/HEAD/ for Bitbucket', () => {
      const result = computeRepositoryUrl({
        url: 'https://bitbucket.org/org/repo',
        source: 'bitbucket',
        subfolder: 'src/server',
      });
      expect(result?.combinedUrl).toBe(
        'https://bitbucket.org/org/repo/src/HEAD/src/server',
      );
    });

    it('uses ?path= for Azure DevOps', () => {
      const result = computeRepositoryUrl({
        url: 'https://dev.azure.com/org/project/_git/repo',
        source: 'azure-devops',
        subfolder: 'src/server',
      });
      expect(result?.combinedUrl).toBe(
        'https://dev.azure.com/org/project/_git/repo?path=/src/server',
      );
    });

    it('encodes Azure DevOps subfolder segments', () => {
      const result = computeRepositoryUrl({
        url: 'https://dev.azure.com/org/project/_git/repo',
        source: 'azure-devops',
        subfolder: 'src/my&folder/file name',
      });
      expect(result?.combinedUrl).toBe(
        'https://dev.azure.com/org/project/_git/repo?path=/src/my%26folder/file%20name',
      );
    });

    it('falls back to path join for unknown SCM', () => {
      const result = computeRepositoryUrl({
        url: 'https://git.example.com/org/repo',
        source: 'gerrit',
        subfolder: 'src/server',
      });
      expect(result?.combinedUrl).toBe(
        'https://git.example.com/org/repo/src/server',
      );
    });

    it('source comparison is case-insensitive', () => {
      const result = computeRepositoryUrl({
        url: 'https://github.com/org/repo',
        source: 'GitHub',
        subfolder: 'src',
      });
      expect(result?.combinedUrl).toBe(
        'https://github.com/org/repo/tree/HEAD/src',
      );
    });
  });

  describe('subfolder normalization', () => {
    it('strips leading and trailing slashes from subfolder', () => {
      const result = computeRepositoryUrl({
        url: 'https://github.com/org/repo',
        source: 'github',
        subfolder: '/src/server/',
      });
      expect(result?.combinedUrl).toBe(
        'https://github.com/org/repo/tree/HEAD/src/server',
      );
    });

    it('treats empty subfolder as no subfolder', () => {
      const result = computeRepositoryUrl({
        url: 'https://github.com/org/repo',
        source: 'github',
        subfolder: '',
      });
      expect(result?.combinedUrl).toBe('https://github.com/org/repo');
    });

    it('treats whitespace-only subfolder as no subfolder', () => {
      const result = computeRepositoryUrl({
        url: 'https://github.com/org/repo',
        source: 'github',
        subfolder: '   ',
      });
      expect(result?.combinedUrl).toBe('https://github.com/org/repo');
    });

    it('rejects subfolder with .. path-traversal segments', () => {
      const result = computeRepositoryUrl({
        url: 'https://github.com/org/repo',
        source: 'github',
        subfolder: '../../etc/passwd',
      });
      // Path traversal subfolder is treated as no subfolder
      expect(result?.combinedUrl).toBe('https://github.com/org/repo');
    });

    it('rejects subfolder with embedded .. segment', () => {
      const result = computeRepositoryUrl({
        url: 'https://github.com/org/repo',
        source: 'github',
        subfolder: 'src/../../../etc',
      });
      expect(result?.combinedUrl).toBe('https://github.com/org/repo');
    });

    it('allows subfolder segments that contain .. but are not bare ..', () => {
      const result = computeRepositoryUrl({
        url: 'https://github.com/org/repo',
        source: 'github',
        subfolder: 'src/..hidden/file',
      });
      expect(result?.combinedUrl).toBe(
        'https://github.com/org/repo/tree/HEAD/src/..hidden/file',
      );
    });
  });
});
