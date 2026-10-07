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
import {
  readSkillImageConfigs,
  readQuayDiscoveryConfig,
  mergeDiscoveredRefs,
} from './plugin';

describe('readSkillImageConfigs', () => {
  it('should return empty array when no config', () => {
    const config = new ConfigReader({});
    const result = readSkillImageConfigs(config);
    expect(result).toEqual([]);
  });

  it('should return empty array when images array is missing', () => {
    const config = new ConfigReader({
      skillImageConnector: {},
    });
    const result = readSkillImageConfigs(config);
    expect(result).toEqual([]);
  });

  it('should read image configs from array', () => {
    const config = new ConfigReader({
      skillImageConnector: {
        images: [
          {
            imageRef: 'quay.io/gabemontero/hello-world-skill:1.0.0-draft',
          },
          {
            imageRef: 'quay.io/org/another-skill:latest',
          },
        ],
      },
    });
    const result = readSkillImageConfigs(config);
    expect(result).toEqual([
      {
        id: 'image-0',
        imageRef: 'quay.io/gabemontero/hello-world-skill:1.0.0-draft',
      },
      {
        id: 'image-1',
        imageRef: 'quay.io/org/another-skill:latest',
      },
    ]);
  });

  it('should skip entries without imageRef', () => {
    const config = new ConfigReader({
      skillImageConnector: {
        images: [
          {
            imageRef: 'quay.io/gabemontero/hello-world-skill:1.0.0-draft',
          },
          {},
        ],
      },
    });
    const result = readSkillImageConfigs(config);
    expect(result).toHaveLength(1);
    expect(result[0].imageRef).toBe(
      'quay.io/gabemontero/hello-world-skill:1.0.0-draft',
    );
  });

  it('should read credentials and skip duplicate image references', () => {
    const config = new ConfigReader({
      skillImageConnector: {
        images: [
          {
            imageRef: 'quay.io/org/skill:v1',
            credentials: {
              username: 'user',
              password: 'secret',
              tokenRealm: 'https://auth.example.com/token',
            },
          },
          { imageRef: 'quay.io/org/skill:v1' },
        ],
      },
    });

    expect(readSkillImageConfigs(config)).toEqual([
      {
        id: 'image-0',
        imageRef: 'quay.io/org/skill:v1',
        credentials: {
          username: 'user',
          password: 'secret',
          tokenRealm: 'https://auth.example.com/token',
        },
      },
    ]);
  });

  it('should allow an explicit token realm without registry credentials', () => {
    const config = new ConfigReader({
      skillImageConnector: {
        images: [
          {
            imageRef: 'quay.io/org/skill:v1',
            credentials: { tokenRealm: 'https://auth.example.com/token' },
          },
        ],
      },
    });

    expect(readSkillImageConfigs(config)).toEqual([
      {
        id: 'image-0',
        imageRef: 'quay.io/org/skill:v1',
        credentials: { tokenRealm: 'https://auth.example.com/token' },
      },
    ]);
  });

  it.each([
    [{ username: 'user' }, 'username and password must be provided together'],
    [{ password: 'secret' }, 'username and password must be provided together'],
    [
      { username: 'user', password: 'secret', tokenRealm: 'not-a-url' },
      'valid HTTPS URL',
    ],
    [
      {
        username: 'user',
        password: 'secret',
        tokenRealm: 'http://auth.example.com/token',
      },
      'valid HTTPS URL',
    ],
  ])('should reject invalid credentials: %p', (credentials, message) => {
    const config = new ConfigReader({
      skillImageConnector: {
        images: [{ imageRef: 'quay.io/org/skill:v1', credentials }],
      },
    });

    expect(() => readSkillImageConfigs(config)).toThrow(message);
  });
});

describe('readQuayDiscoveryConfig', () => {
  it.each([
    'bad tag',
    '../bad',
    '-bad',
    '*',
    'v.*',
    '^v[0-9]+$',
    'a'.repeat(129),
  ])('rejects invalid tag %s at configuration time', tag => {
    const config = new ConfigReader({
      skillImageConnector: {
        quayDiscovery: { organization: 'test-org', tag },
      },
    });
    expect(() => readQuayDiscoveryConfig(config)).toThrow('quayDiscovery.tag');
  });

  it('returns undefined when no config', () => {
    const config = new ConfigReader({});
    expect(readQuayDiscoveryConfig(config)).toBeUndefined();
  });

  it('returns undefined when quayDiscovery section is missing', () => {
    const config = new ConfigReader({
      skillImageConnector: {},
    });
    expect(readQuayDiscoveryConfig(config)).toBeUndefined();
  });

  it('returns undefined when organization is missing', () => {
    const config = new ConfigReader({
      skillImageConnector: {
        quayDiscovery: {},
      },
    });
    expect(readQuayDiscoveryConfig(config)).toBeUndefined();
  });

  it('leaves the tag unset to discover all active tags by default', () => {
    const config = new ConfigReader({
      skillImageConnector: {
        quayDiscovery: {
          organization: 'my-org',
        },
      },
    });
    const result = readQuayDiscoveryConfig(config);
    expect(result).toEqual({
      registry: 'quay.io',
      organization: 'my-org',
    });
  });

  it.each(['', '   ', null])(
    'treats an empty tag (%p) as all active tags',
    tag => {
      const config = new ConfigReader({
        skillImageConnector: {
          quayDiscovery: { organization: 'my-org', tag },
        },
      });
      expect(readQuayDiscoveryConfig(config)?.tag).toBeUndefined();
    },
  );

  it.each([false, 123, ['latest'], {}])(
    'rejects non-string tag %p instead of enabling all-tag discovery',
    tag => {
      const config = new ConfigReader({
        skillImageConnector: {
          quayDiscovery: { organization: 'my-org', tag },
        },
      });
      expect(() => readQuayDiscoveryConfig(config)).toThrow(
        'quayDiscovery.tag',
      );
    },
  );

  it('preserves an explicit latest tag as an exact selection', () => {
    const config = new ConfigReader({
      skillImageConnector: {
        quayDiscovery: { organization: 'my-org', tag: ' latest ' },
      },
    });
    expect(readQuayDiscoveryConfig(config)?.tag).toBe('latest');
  });

  it('reads explicit registry and tag', () => {
    const config = new ConfigReader({
      skillImageConnector: {
        quayDiscovery: {
          registry: 'custom-quay.example.com',
          organization: 'test-org',
          tag: 'v2.0',
        },
      },
    });
    const result = readQuayDiscoveryConfig(config);
    expect(result).toEqual({
      registry: 'custom-quay.example.com',
      organization: 'test-org',
      tag: 'v2.0',
    });
  });

  it('throws when registry has invalid format', () => {
    const config = new ConfigReader({
      skillImageConnector: {
        quayDiscovery: {
          registry: 'not a valid host!',
          organization: 'my-org',
        },
      },
    });
    expect(() => readQuayDiscoveryConfig(config)).toThrow(
      'must be a valid registry host',
    );
  });
});

describe('mergeDiscoveredRefs', () => {
  const mockLogger = { warn: jest.fn() };

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('merges discovered refs with zero-based IDs', () => {
    const existing = [{ id: 'image-0', imageRef: 'quay.io/org/existing:v1' }];
    const discovered = ['quay.io/org/new-a:latest', 'quay.io/org/new-b:latest'];

    const result = mergeDiscoveredRefs(existing, discovered, 25, mockLogger);

    expect(result.merged).toHaveLength(3);
    expect(result.merged[1]).toEqual({
      id: 'discovered-0',
      imageRef: 'quay.io/org/new-a:latest',
      warnOnNotFound: false,
    });
    expect(result.merged[2]).toEqual({
      id: 'discovered-1',
      imageRef: 'quay.io/org/new-b:latest',
      warnOnNotFound: false,
    });
    expect(result.added).toBe(2);
    expect(result.skipped).toBe(0);
  });

  it('skips duplicate refs already in explicit configs', () => {
    const existing = [{ id: 'image-0', imageRef: 'quay.io/org/repo:latest' }];
    const discovered = ['quay.io/org/repo:latest', 'quay.io/org/new:latest'];

    const result = mergeDiscoveredRefs(existing, discovered, 25, mockLogger);

    expect(result.merged).toHaveLength(2);
    expect(result.added).toBe(1);
    expect(result.skipped).toBe(0);
  });

  it('enforces the supplied image cap and warns about skipped repos', () => {
    const existing = Array.from({ length: 23 }, (_, i) => ({
      id: `image-${i}`,
      imageRef: `quay.io/org/img-${i}:v1`,
    }));
    const discovered = [
      'quay.io/org/disc-0:latest',
      'quay.io/org/disc-1:latest',
      'quay.io/org/disc-2:latest',
      'quay.io/org/disc-3:latest',
      'quay.io/org/disc-4:latest',
    ];

    const result = mergeDiscoveredRefs(existing, discovered, 25, mockLogger);

    expect(result.merged).toHaveLength(25);
    expect(result.added).toBe(2);
    expect(result.skipped).toBe(3);
    expect(mockLogger.warn).toHaveBeenCalledWith(
      expect.stringContaining('3 discovered image candidate(s) were dropped'),
    );
  });

  it('returns unchanged list when all discovered refs are duplicates', () => {
    const existing = [{ id: 'image-0', imageRef: 'quay.io/org/repo:latest' }];
    const discovered = ['quay.io/org/repo:latest'];

    const result = mergeDiscoveredRefs(existing, discovered, 25, mockLogger);

    expect(result.merged).toHaveLength(1);
    expect(result.added).toBe(0);
    expect(result.skipped).toBe(0);
  });
});
