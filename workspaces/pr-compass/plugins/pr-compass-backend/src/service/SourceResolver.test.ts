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

import { ConfigReader } from '@backstage/config';
import { createMockPullRequestProvider } from '../../__fixtures__';
import { PullRequestProvidersRegistry } from '../providers/PullRequestProvidersRegistry';
import { SourceResolver } from './SourceResolver';

const CONFIG = {
  integrations: {
    github: [
      { host: 'github.com', token: 'unused' },
      {
        host: 'ghe.corp.example',
        apiBaseUrl: 'https://ghe.corp.example/api/v3',
      },
    ],
    gitlab: [
      {
        host: 'gitlab.corp.example',
        apiBaseUrl: 'https://gitlab.corp.example/api/v4',
      },
    ],
  },
};

describe('SourceResolver', () => {
  let registry: PullRequestProvidersRegistry;
  let config: ConfigReader;

  beforeEach(() => {
    registry = new PullRequestProvidersRegistry();
    config = new ConfigReader(CONFIG);
  });

  describe('resolve', () => {
    let resolver: SourceResolver;

    beforeEach(() => {
      registry.register(createMockPullRequestProvider('github'));
      resolver = SourceResolver.fromConfig(config, {
        providersRegistry: registry,
      });
    });

    it('returns the source for a known id', () => {
      expect(resolver.resolve('github:github.com')).toEqual({
        id: 'github:github.com',
        type: 'github',
        host: 'github.com',
        title: 'github.com',
        baseUrl: 'https://github.com',
      });
    });

    it('returns undefined for an unknown id', () => {
      expect(resolver.resolve('github:evil.example')).toBeUndefined();
      expect(resolver.resolve('')).toBeUndefined();
    });

    it('rejects a source whose integration type has no registered provider', () => {
      // gitlab.corp.example integration is configured, but only a github provider is registered.
      expect(resolver.resolve('gitlab:gitlab.corp.example')).toBeUndefined();
    });

    it('rejects every id when no provider is registered', () => {
      const withoutProviders = SourceResolver.fromConfig(config, {
        providersRegistry: new PullRequestProvidersRegistry(),
      });
      expect(withoutProviders.resolve('github:github.com')).toBeUndefined();
      expect(resolver.resolve('gitlab:gitlab.corp.example')).toBeUndefined();
    });
  });

  describe('listSources', () => {
    it('discovers every supported SCM integration with a registered provider', () => {
      const sourceTypes = [
        'azure',
        'bitbucketCloud',
        'bitbucketServer',
        'github',
        'gitlab',
      ];
      for (const type of sourceTypes) {
        registry.register(createMockPullRequestProvider(type));
      }
      const resolver = SourceResolver.fromConfig(
        new ConfigReader({
          integrations: {
            bitbucketServer: [{ host: 'bitbucket.example' }],
          },
        }),
        { providersRegistry: registry },
      );

      expect(
        new Set(resolver.listSources().map(source => source.type)),
      ).toEqual(new Set(sourceTypes));
      for (const source of resolver.listSources()) {
        expect(resolver.resolve(source.id)).toEqual(source);
      }
    });

    it('pairs each servable host with its SCM type', () => {
      registry.register(createMockPullRequestProvider('github'));
      const resolver = SourceResolver.fromConfig(config, {
        providersRegistry: registry,
      });

      expect(resolver.listSources()).toEqual([
        {
          id: 'github:github.com',
          type: 'github',
          host: 'github.com',
          title: 'github.com',
          baseUrl: 'https://github.com',
        },
        {
          id: 'github:ghe.corp.example',
          type: 'github',
          host: 'ghe.corp.example',
          title: 'ghe.corp.example',
          baseUrl: 'https://ghe.corp.example',
        },
      ]);
    });

    it('omits integration types with no registered provider', () => {
      // gitlab and github integrations are configured, only github provider
      registry.register(createMockPullRequestProvider('gitlab'));
      const resolver = SourceResolver.fromConfig(config, {
        providersRegistry: registry,
      });

      expect(resolver.listSources()).toEqual([
        {
          id: 'gitlab:gitlab.corp.example',
          type: 'gitlab',
          host: 'gitlab.corp.example',
          title: 'gitlab.corp.example',
          baseUrl: 'https://gitlab.corp.example',
        },
        {
          id: 'gitlab:gitlab.com',
          type: 'gitlab',
          host: 'gitlab.com',
          title: 'gitlab.com',
          baseUrl: 'https://gitlab.com',
        },
      ]);
    });

    it('lists sources of several types', () => {
      registry.register(createMockPullRequestProvider('gitlab'));
      registry.register(createMockPullRequestProvider('github'));
      const resolver = SourceResolver.fromConfig(config, {
        providersRegistry: registry,
      });

      expect(resolver.listSources()).toEqual([
        {
          id: 'github:github.com',
          type: 'github',
          host: 'github.com',
          title: 'github.com',
          baseUrl: 'https://github.com',
        },
        {
          id: 'github:ghe.corp.example',
          type: 'github',
          host: 'ghe.corp.example',
          title: 'ghe.corp.example',
          baseUrl: 'https://ghe.corp.example',
        },
        {
          id: 'gitlab:gitlab.corp.example',
          type: 'gitlab',
          host: 'gitlab.corp.example',
          title: 'gitlab.corp.example',
          baseUrl: 'https://gitlab.corp.example',
        },
        {
          id: 'gitlab:gitlab.com',
          type: 'gitlab',
          host: 'gitlab.com',
          title: 'gitlab.com',
          baseUrl: 'https://gitlab.com',
        },
      ]);
    });

    it('is empty when no provider is registered', () => {
      // The integrations exist, including defaults — but not in sources.
      const resolver = SourceResolver.fromConfig(config, {
        providersRegistry: registry,
      });
      expect(resolver.listSources()).toEqual([]);
    });

    it('includes sources that exist only as integration defaults', () => {
      // gitlab.com is a built-in default; an empty config still provides it once a gitlab provider is registered.
      registry.register(createMockPullRequestProvider('gitlab'));
      const withDefault = SourceResolver.fromConfig(new ConfigReader({}), {
        providersRegistry: registry,
      });
      expect(withDefault.listSources()).toEqual([
        {
          id: 'gitlab:gitlab.com',
          type: 'gitlab',
          host: 'gitlab.com',
          title: 'gitlab.com',
          baseUrl: 'https://gitlab.com',
        },
      ]);
    });

    it('throws on a duplicate SCM source', () => {
      registry.register(createMockPullRequestProvider('github'));
      expect(() =>
        SourceResolver.fromConfig(
          new ConfigReader({
            integrations: {
              github: [
                { host: 'shared.example' },
                {
                  host: 'shared.example',
                  apiBaseUrl: 'https://shared.example/api/v3',
                },
              ],
            },
          }),
          { providersRegistry: registry },
        ),
      ).toThrow('Duplicate SCM source');
    });

    it('keeps a configured base URL, including its scheme, port and path', () => {
      registry.register(createMockPullRequestProvider('gitlab'));
      const resolver = SourceResolver.fromConfig(
        new ConfigReader({
          integrations: {
            gitlab: [
              {
                host: 'gitlab.example:8080',
                apiBaseUrl: 'http://gitlab.example:8080/gitlab/api/v4',
                baseUrl: 'http://gitlab.example:8080/gitlab',
              },
            ],
          },
        }),
        { providersRegistry: registry },
      );
      expect(resolver.listSources()).toContainEqual({
        id: 'gitlab:gitlab.example:8080',
        type: 'gitlab',
        host: 'gitlab.example:8080',
        title: 'gitlab.example:8080',
        baseUrl: 'http://gitlab.example:8080/gitlab',
      });
      expect(resolver.resolve('gitlab:gitlab.example:8080')?.baseUrl).toBe(
        'http://gitlab.example:8080/gitlab',
      );
    });
  });
});
