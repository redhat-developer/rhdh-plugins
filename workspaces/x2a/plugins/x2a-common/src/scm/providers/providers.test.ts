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

import { GitRepositoryRef } from '../../domain';
import { githubProvider } from './github';
import { gitlabProvider } from './gitlab';
import { bitbucketProvider } from './bitbucket';

describe('githubProvider', () => {
  describe('buildCodespace', () => {
    it('rejects a repository URL with no repository name', () => {
      expect(
        githubProvider.buildCodespace?.(
          new GitRepositoryRef('https://github.com/owner', 'main'),
          '.devcontainer/devcontainer.json',
        ),
      ).toBeUndefined();
    });
  });

  describe('getAuthTokenDescriptor', () => {
    it('returns repo scope regardless of readOnly', () => {
      expect(githubProvider.getAuthTokenDescriptor(false)).toEqual({
        provider: 'github',
        tokenType: 'oauth',
        scope: 'repo',
      });
      expect(githubProvider.getAuthTokenDescriptor(true)).toEqual({
        provider: 'github',
        tokenType: 'oauth',
        scope: 'repo',
      });
    });
  });

  describe('augmentToken', () => {
    it('returns token unchanged', () => {
      expect(githubProvider.augmentToken('my-token')).toBe('my-token');
    });
  });

  describe('extractToken', () => {
    it('returns token unchanged', () => {
      expect(githubProvider.extractToken('my-token')).toBe('my-token');
    });
  });

  describe('getContentWriteAuthTokenDescriptor', () => {
    it('requests the repo scope', () => {
      expect(githubProvider.getContentWriteAuthTokenDescriptor()).toEqual({
        provider: 'github',
        tokenType: 'oauth',
        scope: 'repo',
      });
    });
  });

  describe('matches', () => {
    it('matches github.com URLs', () => {
      expect(githubProvider.matches('https://github.com/owner/repo')).toBe(
        true,
      );
    });

    it('does not match other URLs', () => {
      expect(githubProvider.matches('https://gitlab.com/group/project')).toBe(
        false,
      );
    });

    it('does not match a host that contains github.com as a substring', () => {
      expect(
        githubProvider.matches('https://github.com.evil.com/org/repo'),
      ).toBe(false);
      expect(githubProvider.matches('https://notgithub.com/org/repo')).toBe(
        false,
      );
    });
  });
});

describe('gitlabProvider', () => {
  describe('getAuthTokenDescriptor', () => {
    it('returns write_repository scope when not readOnly', () => {
      expect(gitlabProvider.getAuthTokenDescriptor(false)).toEqual({
        provider: 'gitlab',
        tokenType: 'oauth',
        scope: 'write_repository',
      });
    });

    it('returns read_repository scope when readOnly', () => {
      expect(gitlabProvider.getAuthTokenDescriptor(true)).toEqual({
        provider: 'gitlab',
        tokenType: 'oauth',
        scope: 'read_repository',
      });
    });
  });

  describe('augmentToken', () => {
    it('prefixes token with oauth2:', () => {
      expect(gitlabProvider.augmentToken('my-token')).toBe('oauth2:my-token');
    });
  });

  describe('extractToken', () => {
    it('strips the oauth2: prefix', () => {
      expect(gitlabProvider.extractToken('oauth2:my-token')).toBe('my-token');
    });

    it('is a no-op for an unprefixed token', () => {
      expect(gitlabProvider.extractToken('my-token')).toBe('my-token');
    });

    it('round-trips with augmentToken', () => {
      expect(
        gitlabProvider.extractToken(gitlabProvider.augmentToken('my-token')),
      ).toBe('my-token');
    });
  });

  describe('getContentWriteAuthTokenDescriptor', () => {
    it('requests the api scope, as write_repository does not authorize REST calls', () => {
      expect(gitlabProvider.getContentWriteAuthTokenDescriptor()).toEqual({
        provider: 'gitlab',
        tokenType: 'oauth',
        scope: 'api',
      });
    });
  });
});

describe('bitbucketProvider', () => {
  describe('getAuthTokenDescriptor', () => {
    it('returns repository:write scope when not readOnly', () => {
      expect(bitbucketProvider.getAuthTokenDescriptor(false)).toEqual({
        provider: 'bitbucket',
        tokenType: 'oauth',
        scope: 'repository:write',
      });
    });

    it('returns repository scope when readOnly', () => {
      expect(bitbucketProvider.getAuthTokenDescriptor(true)).toEqual({
        provider: 'bitbucket',
        tokenType: 'oauth',
        scope: 'repository',
      });
    });
  });

  describe('augmentToken', () => {
    it('prefixes token with x-token-auth:', () => {
      expect(bitbucketProvider.augmentToken('my-token')).toBe(
        'x-token-auth:my-token',
      );
    });
  });

  describe('extractToken', () => {
    it('strips the x-token-auth: prefix', () => {
      expect(bitbucketProvider.extractToken('x-token-auth:my-token')).toBe(
        'my-token',
      );
    });

    it('is a no-op for an unprefixed token', () => {
      expect(bitbucketProvider.extractToken('my-token')).toBe('my-token');
    });
  });

  describe('matches', () => {
    it('matches bitbucket.org URLs', () => {
      expect(
        bitbucketProvider.matches('https://bitbucket.org/owner/repo'),
      ).toBe(true);
    });

    it('does not match self-hosted Bitbucket Server URLs', () => {
      expect(
        bitbucketProvider.matches('https://bitbucket.mycompany.com/org/repo'),
      ).toBe(false);
    });

    it('does not match a host that contains bitbucket.org as a substring', () => {
      expect(
        bitbucketProvider.matches('https://bitbucket.org.evil.com/ws/repo'),
      ).toBe(false);
      expect(
        bitbucketProvider.matches('https://notbitbucket.org/ws/repo'),
      ).toBe(false);
    });
  });
});
