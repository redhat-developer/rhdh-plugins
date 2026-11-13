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

import { readSkillsCatalogProviderConfigs } from './config';

describe('readSkillsCatalogProviderConfigs', () => {
  it.each(['.', '..', ' '])(
    'rejects documentation-unsafe source ID %s',
    sourceId => {
      const config = new ConfigReader({
        catalog: {
          providers: {
            skillsCatalogProvider: {
              test: {
                sources: [
                  {
                    connectorPluginId: 'skill-image-connector',
                    sourceId,
                    sourceType: 'oci',
                  },
                ],
                defaultOwner: 'team',
                defaultLifecycle: 'production',
              },
            },
          },
        },
      });
      expect(() => readSkillsCatalogProviderConfigs(config)).toThrow(
        'sourceId must be nonblank',
      );
    },
  );

  it('returns empty array when no config is present', () => {
    const config = new ConfigReader({});
    expect(readSkillsCatalogProviderConfigs(config)).toEqual([]);
  });

  it('reads a valid provider configuration', () => {
    const config = new ConfigReader({
      catalog: {
        providers: {
          skillsCatalogProvider: {
            production: {
              sources: [
                {
                  connectorPluginId: 'skill-image-connector',
                  sourceId: 'quay-public',
                  sourceType: 'oci',
                },
                {
                  connectorPluginId: 'npx-skill-connector',
                  sourceId: 'rhess-index',
                  sourceType: 'npx',
                },
              ],
              defaultOwner: 'team-skills',
              defaultLifecycle: 'production',
              namespace: 'skills',
            },
          },
        },
      },
    });

    const configs = readSkillsCatalogProviderConfigs(config);
    expect(configs).toHaveLength(1);
    expect(configs[0].id).toBe('production');
    expect(configs[0].sources).toHaveLength(2);
    expect(configs[0].sources[0].connectorPluginId).toBe(
      'skill-image-connector',
    );
    expect(configs[0].sources[0].sourceId).toBe('quay-public');
    expect(configs[0].sources[0].sourceType).toBe('oci');
    expect(configs[0].sources[1].sourceType).toBe('npx');
    expect(configs[0].defaultOwner).toBe('team-skills');
    expect(configs[0].defaultLifecycle).toBe('production');
    expect(configs[0].namespace).toBe('skills');
  });

  it('defaults namespace to "default"', () => {
    const config = new ConfigReader({
      catalog: {
        providers: {
          skillsCatalogProvider: {
            test: {
              sources: [
                {
                  connectorPluginId: 'skill-image-connector',
                  sourceId: 'quay-public',
                  sourceType: 'oci',
                },
              ],
              defaultOwner: 'team-skills',
              defaultLifecycle: 'production',
            },
          },
        },
      },
    });

    const configs = readSkillsCatalogProviderConfigs(config);
    expect(configs[0].namespace).toBe('default');
  });

  it('reads schedule configuration', () => {
    const config = new ConfigReader({
      catalog: {
        providers: {
          skillsCatalogProvider: {
            test: {
              sources: [
                {
                  connectorPluginId: 'skill-image-connector',
                  sourceId: 'quay-public',
                  sourceType: 'oci',
                },
              ],
              defaultOwner: 'team-skills',
              defaultLifecycle: 'production',
              schedule: {
                frequency: { minutes: 5 },
                timeout: { minutes: 10 },
              },
            },
          },
        },
      },
    });

    const configs = readSkillsCatalogProviderConfigs(config);
    expect(configs[0].schedule).toBeDefined();
  });

  it('rejects invalid source type', () => {
    const config = new ConfigReader({
      catalog: {
        providers: {
          skillsCatalogProvider: {
            test: {
              sources: [
                {
                  connectorPluginId: 'skill-image-connector',
                  sourceId: 'quay-public',
                  sourceType: 'invalid',
                },
              ],
              defaultOwner: 'team-skills',
              defaultLifecycle: 'production',
            },
          },
        },
      },
    });

    expect(() => readSkillsCatalogProviderConfigs(config)).toThrow(
      /sourceType must be 'oci' or 'npx'/,
    );
  });

  it('rejects duplicate (connectorPluginId, sourceId) consumers', () => {
    const config = new ConfigReader({
      catalog: {
        providers: {
          skillsCatalogProvider: {
            test: {
              sources: [
                {
                  connectorPluginId: 'skill-image-connector',
                  sourceId: 'quay-public',
                  sourceType: 'oci',
                },
                {
                  connectorPluginId: 'skill-image-connector',
                  sourceId: 'quay-public',
                  sourceType: 'oci',
                },
              ],
              defaultOwner: 'team-skills',
              defaultLifecycle: 'production',
            },
          },
        },
      },
    });

    expect(() => readSkillsCatalogProviderConfigs(config)).toThrow(
      /duplicate consumer/,
    );
  });

  it('rejects duplicate (sourceType, sourceId) assignments', () => {
    const config = new ConfigReader({
      catalog: {
        providers: {
          skillsCatalogProvider: {
            test: {
              sources: [
                {
                  connectorPluginId: 'connector-a',
                  sourceId: 'quay-public',
                  sourceType: 'oci',
                },
                {
                  connectorPluginId: 'connector-b',
                  sourceId: 'quay-public',
                  sourceType: 'oci',
                },
              ],
              defaultOwner: 'team-skills',
              defaultLifecycle: 'production',
            },
          },
        },
      },
    });

    expect(() => readSkillsCatalogProviderConfigs(config)).toThrow(
      /duplicate source assignment/,
    );
  });

  it('rejects empty sources array', () => {
    const config = new ConfigReader({
      catalog: {
        providers: {
          skillsCatalogProvider: {
            test: {
              sources: [],
              defaultOwner: 'team-skills',
              defaultLifecycle: 'production',
            },
          },
        },
      },
    });

    expect(() => readSkillsCatalogProviderConfigs(config)).toThrow(
      /at least one source is required/,
    );
  });
});
