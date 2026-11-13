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

import { mockServices } from '@backstage/backend-test-utils';
import type { Entity } from '@backstage/catalog-model';

import { CodecovClient } from './CodecovClient';
import type { CodecovRepoResponse } from './types';

const sampleResponse: CodecovRepoResponse = {
  name: 'rhdh-plugins',
  private: false,
  updatestamp: '2026-06-19T10:29:51.283089Z',
  author: {
    service: 'github',
    username: 'redhat-developer',
    name: 'redhat-developer',
  },
  language: 'typescript',
  branch: 'main',
  active: true,
  activated: true,
  totals: {
    files: 2252,
    lines: 85789,
    hits: 45982,
    misses: 38246,
    partials: 1561,
    coverage: 53.59,
    branches: 24121,
    methods: 13480,
    sessions: 23,
    complexity: 0.0,
    complexity_total: 0.0,
    complexity_ratio: 0,
    diff: 0,
  },
};

function createEntity(annotations: Record<string, string>): Entity {
  return {
    apiVersion: 'backstage.io/v1alpha1',
    kind: 'Component',
    metadata: {
      name: 'test-service',
      annotations,
    },
    spec: {},
  } as Entity;
}

describe('CodecovClient', () => {
  const mockLogger = mockServices.logger.mock();
  let client: CodecovClient;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
    globalThis.fetch = jest.fn();
  });

  describe('resolveApiParams', () => {
    beforeEach(() => {
      const mockConfig = mockServices.rootConfig({
        data: {},
      });
      client = new CodecovClient(mockConfig, mockLogger);
    });

    it('extracts owner and repo from codecov.io/repo with slash', () => {
      const entity = createEntity({
        'codecov.io/repo': 'redhat-developer/rhdh-plugins',
        'github.com/project-slug': 'redhat-developer/rhdh-plugins',
      });
      const params = client.resolveApiParams(entity);
      expect(params).toEqual({
        service: 'github',
        owner: 'redhat-developer',
        repo: 'rhdh-plugins',
      });
    });

    it('uses codecov.io/owner annotation when provided', () => {
      const entity = createEntity({
        'codecov.io/repo': 'org/my-repo',
        'codecov.io/owner': 'custom-owner',
        'github.com/project-slug': 'org/my-repo',
      });
      const params = client.resolveApiParams(entity);
      expect(params).toEqual({
        service: 'github',
        owner: 'custom-owner',
        repo: 'my-repo',
      });
    });

    it('uses codecov.io/service annotation when provided', () => {
      const entity = createEntity({
        'codecov.io/repo': 'org/my-repo',
        'codecov.io/service': 'gitlab',
      });
      const params = client.resolveApiParams(entity);
      expect(params).toEqual({
        service: 'gitlab',
        owner: 'org',
        repo: 'my-repo',
      });
    });

    it('defaults service to github when github.com/project-slug exists', () => {
      const entity = createEntity({
        'codecov.io/repo': 'org/my-repo',
        'github.com/project-slug': 'org/my-repo',
      });
      const params = client.resolveApiParams(entity);
      expect(params.service).toBe('github');
    });

    it('throws when no service can be determined', () => {
      const entity = createEntity({
        'codecov.io/repo': 'org/my-repo',
      });
      expect(() => client.resolveApiParams(entity)).toThrow(
        /no 'codecov.io\/service' annotation/,
      );
    });

    it('throws when codecov.io/repo annotation is missing', () => {
      const entity = createEntity({
        'github.com/project-slug': 'org/my-repo',
      });
      expect(() => client.resolveApiParams(entity)).toThrow(
        /missing required annotation 'codecov.io\/repo'/,
      );
    });

    it('throws when no owner can be determined and repo has no slash', () => {
      const entity = createEntity({
        'codecov.io/repo': 'my-repo',
        'codecov.io/service': 'github',
      });
      expect(() => client.resolveApiParams(entity)).toThrow(
        /no 'codecov.io\/owner' annotation/,
      );
    });
  });

  describe('getRepoData', () => {
    it('fetches data from the correct URL without auth for public repos', async () => {
      const mockConfig = mockServices.rootConfig({
        data: {},
      });
      client = new CodecovClient(mockConfig, mockLogger);

      (globalThis.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => sampleResponse,
      });

      const entity = createEntity({
        'codecov.io/repo': 'redhat-developer/rhdh-plugins',
        'github.com/project-slug': 'redhat-developer/rhdh-plugins',
      });

      const result = await client.getRepoData(entity);

      expect(result).toEqual(sampleResponse);
      expect(globalThis.fetch).toHaveBeenCalledWith(
        'https://api.codecov.io/api/v2/github/redhat-developer/repos/rhdh-plugins/',
        {
          headers: {
            Accept: 'application/json',
          },
        },
      );
    });

    it('includes auth header when token is configured', async () => {
      const mockConfig = mockServices.rootConfig({
        data: {
          codecov: {
            accounts: [{ name: 'default', authToken: 'test-token' }],
          },
        },
      });
      client = new CodecovClient(mockConfig, mockLogger);

      (globalThis.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => sampleResponse,
      });

      const entity = createEntity({
        'codecov.io/repo': 'redhat-developer/rhdh-plugins',
        'github.com/project-slug': 'redhat-developer/rhdh-plugins',
      });

      await client.getRepoData(entity);

      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'bearer test-token',
          }),
        }),
      );
    });

    it('uses the account specified in the entity annotation', async () => {
      const mockConfig = mockServices.rootConfig({
        data: {
          codecov: {
            accounts: [
              { name: 'default', authToken: 'default-token' },
              { name: 'custom', authToken: 'custom-token' },
            ],
          },
        },
      });
      client = new CodecovClient(mockConfig, mockLogger);

      (globalThis.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => sampleResponse,
      });

      const entity = createEntity({
        'codecov.io/repo': 'org/my-repo',
        'codecov.io/account': 'custom',
        'github.com/project-slug': 'org/my-repo',
      });

      await client.getRepoData(entity);

      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'bearer custom-token',
          }),
        }),
      );
    });

    it('uses defaultAccount from config when entity has no account annotation', async () => {
      const mockConfig = mockServices.rootConfig({
        data: {
          codecov: {
            defaultAccount: 'myaccount',
            accounts: [{ name: 'myaccount', authToken: 'my-token' }],
          },
        },
      });
      client = new CodecovClient(mockConfig, mockLogger);

      (globalThis.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => sampleResponse,
      });

      const entity = createEntity({
        'codecov.io/repo': 'org/my-repo',
        'github.com/project-slug': 'org/my-repo',
      });

      await client.getRepoData(entity);

      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'bearer my-token',
          }),
        }),
      );
    });

    it('throws when entity specifies a non-existent account', async () => {
      const mockConfig = mockServices.rootConfig({
        data: {
          codecov: {
            accounts: [{ name: 'default', authToken: 'token' }],
          },
        },
      });
      client = new CodecovClient(mockConfig, mockLogger);

      const entity = createEntity({
        'codecov.io/repo': 'org/my-repo',
        'codecov.io/account': 'nonexistent',
        'github.com/project-slug': 'org/my-repo',
      });

      await expect(client.getRepoData(entity)).rejects.toThrow(
        "Codecov account 'nonexistent' not found in configuration",
      );
    });

    it('throws on non-ok response', async () => {
      const mockConfig = mockServices.rootConfig({
        data: {},
      });
      client = new CodecovClient(mockConfig, mockLogger);

      (globalThis.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      const entity = createEntity({
        'codecov.io/repo': 'org/nonexistent',
        'github.com/project-slug': 'org/nonexistent',
      });

      await expect(client.getRepoData(entity)).rejects.toThrow(
        'Codecov API request failed with status 404: Not Found',
      );
    });
  });
});
