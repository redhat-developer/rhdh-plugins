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
import { readSkillImageConfigs, readQuayDiscoveryConfig } from './plugin';

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

  it('reads organization with default registry and tag', () => {
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
      tag: 'latest',
    });
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
});
