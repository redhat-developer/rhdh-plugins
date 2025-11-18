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

import {
  parseEntityKonfluxConfig,
  parseSubcomponentClusterConfigurations,
  parseClusterConfigs,
  parseAuthProviderConfig,
} from '../config';
import { Config } from '@backstage/config';
import { KonfluxConfig } from '../types';
import * as yaml from 'js-yaml';

jest.mock('js-yaml');

describe('config', () => {
  describe('parseEntityKonfluxConfig', () => {
    it('should return null when annotation is null', () => {
      const result = parseEntityKonfluxConfig<KonfluxConfig>(null);
      expect(result).toBeNull();
    });

    it('should return null when annotation is undefined', () => {
      const result = parseEntityKonfluxConfig<KonfluxConfig>(undefined);
      expect(result).toBeNull();
    });

    it('should return null when annotation is empty string', () => {
      const result = parseEntityKonfluxConfig<KonfluxConfig>('');
      expect(result).toBeNull();
    });

    it('should parse valid YAML annotation', () => {
      const yamlContent = `
- cluster: cluster1
  namespace: namespace1
  applications:
    - app1
    - app2
- cluster: cluster1
  namespace: namespace2
  applications:
    - app3
    - app4
`;
      const expectedConfig = [
        {
          cluster: 'cluster1',
          namespace: 'namespace1',
          applications: ['app1', 'app2'],
        },
        {
          cluster: 'cluster1',
          namespace: 'namespace2',
          applications: ['app3', 'app4'],
        },
      ];

      (yaml.load as jest.Mock).mockReturnValue(expectedConfig);

      const result =
        parseEntityKonfluxConfig<typeof expectedConfig>(yamlContent);

      expect(result).toEqual(expectedConfig);
      expect(yaml.load).toHaveBeenCalledWith(yamlContent);
    });

    it('should return null when YAML parsing fails', () => {
      const invalidYaml = 'invalid: yaml: content: [';

      (yaml.load as jest.Mock).mockImplementation(() => {
        throw new Error('YAML parse error');
      });

      const result = parseEntityKonfluxConfig<KonfluxConfig>(invalidYaml);

      expect(result).toBeNull();
    });
  });

  describe('parseSubcomponentClusterConfigurations', () => {
    it('should return empty array when konfluxConfig is undefined', () => {
      const result = parseSubcomponentClusterConfigurations(undefined, [
        'subcomp1',
      ]);
      expect(result).toEqual([]);
    });

    it('should return empty array when konfluxConfig has no subcomponentConfigs', () => {
      const konfluxConfig: KonfluxConfig = {
        clusters: {},
        subcomponentConfigs: [],
        authProvider: 'serviceAccount',
      };

      const result = parseSubcomponentClusterConfigurations(konfluxConfig, [
        'subcomp1',
      ]);
      expect(result).toEqual([]);
    });

    it('should parse subcomponent cluster configurations', () => {
      const konfluxConfig: KonfluxConfig = {
        clusters: {},
        subcomponentConfigs: [
          {
            subcomponent: 'subcomp1',
            cluster: 'cluster1',
            namespace: 'namespace1',
            applications: ['app1', 'app2'],
          },
          {
            subcomponent: 'subcomp1',
            cluster: 'cluster2',
            namespace: 'namespace2',
            applications: ['app3'],
          },
          {
            subcomponent: 'subcomp2',
            cluster: 'cluster3',
            namespace: 'namespace3',
            applications: ['app4'],
          },
        ],
        authProvider: 'serviceAccount',
      };

      const result = parseSubcomponentClusterConfigurations(konfluxConfig, [
        'subcomp1',
      ]);

      expect(result).toEqual([
        {
          subcomponent: 'subcomp1',
          cluster: 'cluster1',
          namespace: 'namespace1',
          applications: ['app1', 'app2'],
        },
        {
          subcomponent: 'subcomp1',
          cluster: 'cluster2',
          namespace: 'namespace2',
          applications: ['app3'],
        },
      ]);
    });

    it('should filter configs by subcomponent name', () => {
      const konfluxConfig: KonfluxConfig = {
        clusters: {},
        subcomponentConfigs: [
          {
            subcomponent: 'subcomp1',
            cluster: 'cluster1',
            namespace: 'namespace1',
            applications: ['app1'],
          },
          {
            subcomponent: 'subcomp2',
            cluster: 'cluster2',
            namespace: 'namespace2',
            applications: ['app2'],
          },
          {
            subcomponent: 'subcomp1',
            cluster: 'cluster3',
            namespace: 'namespace3',
            applications: ['app3'],
          },
        ],
        authProvider: 'serviceAccount',
      };

      const result = parseSubcomponentClusterConfigurations(konfluxConfig, [
        'subcomp1',
      ]);

      expect(result).toEqual([
        {
          subcomponent: 'subcomp1',
          cluster: 'cluster1',
          namespace: 'namespace1',
          applications: ['app1'],
        },
        {
          subcomponent: 'subcomp1',
          cluster: 'cluster3',
          namespace: 'namespace3',
          applications: ['app3'],
        },
      ]);
    });

    it('should handle multiple subcomponents', () => {
      const konfluxConfig: KonfluxConfig = {
        clusters: {},
        subcomponentConfigs: [
          {
            subcomponent: 'subcomp1',
            cluster: 'cluster1',
            namespace: 'namespace1',
            applications: ['app1'],
          },
          {
            subcomponent: 'subcomp2',
            cluster: 'cluster2',
            namespace: 'namespace2',
            applications: ['app2'],
          },
        ],
        authProvider: 'serviceAccount',
      };

      const result = parseSubcomponentClusterConfigurations(konfluxConfig, [
        'subcomp1',
        'subcomp2',
      ]);

      expect(result).toEqual([
        {
          subcomponent: 'subcomp1',
          cluster: 'cluster1',
          namespace: 'namespace1',
          applications: ['app1'],
        },
        {
          subcomponent: 'subcomp2',
          cluster: 'cluster2',
          namespace: 'namespace2',
          applications: ['app2'],
        },
      ]);
    });

    it('should skip subcomponents not in subcomponentNames list', () => {
      const konfluxConfig: KonfluxConfig = {
        clusters: {},
        subcomponentConfigs: [
          {
            subcomponent: 'subcomp1',
            cluster: 'cluster1',
            namespace: 'namespace1',
            applications: ['app1'],
          },
          {
            subcomponent: 'subcomp2',
            cluster: 'cluster2',
            namespace: 'namespace2',
            applications: ['app2'],
          },
        ],
        authProvider: 'serviceAccount',
      };

      const result = parseSubcomponentClusterConfigurations(konfluxConfig, [
        'subcomp1',
      ]);

      expect(result).toEqual([
        {
          subcomponent: 'subcomp1',
          cluster: 'cluster1',
          namespace: 'namespace1',
          applications: ['app1'],
        },
      ]);
    });

    it('should return empty array when no matching subcomponents', () => {
      const konfluxConfig: KonfluxConfig = {
        clusters: {},
        subcomponentConfigs: [
          {
            subcomponent: 'subcomp1',
            cluster: 'cluster1',
            namespace: 'namespace1',
            applications: ['app1'],
          },
        ],
        authProvider: 'serviceAccount',
      };

      const result = parseSubcomponentClusterConfigurations(konfluxConfig, [
        'nonexistent',
      ]);

      expect(result).toEqual([]);
    });
  });

  describe('parseClusterConfigs', () => {
    it('should return null when clustersConfig is undefined', () => {
      const result = parseClusterConfigs(undefined);
      expect(result).toBeNull();
    });

    it('should parse cluster configurations', () => {
      const mockClusterConfig1 = {
        getOptionalString: jest.fn((key: string) => {
          if (key === 'apiUrl') return 'https://api.cluster1.com';
          if (key === 'kubearchiveApiUrl')
            return 'https://archive.cluster1.com';
          if (key === 'uiUrl') return 'https://ui.cluster1.com';
          if (key === 'serviceAccountToken') return 'token123';
          return undefined;
        }),
      };

      const mockClusterConfig2 = {
        getOptionalString: jest.fn((key: string) => {
          if (key === 'apiUrl') return 'https://api.cluster2.com';
          if (key === 'serviceAccountToken') return 'token456';
          return undefined;
        }),
      };

      const mockClustersConfig = {
        keys: jest.fn().mockReturnValue(['cluster1', 'cluster2']),
        getConfig: jest.fn((key: string) => {
          if (key === 'cluster1') return mockClusterConfig1;
          if (key === 'cluster2') return mockClusterConfig2;
          return null;
        }),
      } as unknown as Config;

      const result = parseClusterConfigs(mockClustersConfig);

      expect(result).toEqual({
        cluster1: {
          apiUrl: 'https://api.cluster1.com',
          kubearchiveApiUrl: 'https://archive.cluster1.com',
          uiUrl: 'https://ui.cluster1.com',
          serviceAccountToken: 'token123',
        },
        cluster2: {
          apiUrl: 'https://api.cluster2.com',
          kubearchiveApiUrl: undefined,
          uiUrl: undefined,
          serviceAccountToken: 'token456',
        },
      });
    });

    it('should handle missing optional fields', () => {
      const mockClusterConfig = {
        getOptionalString: jest.fn().mockReturnValue(undefined),
      };

      const mockClustersConfig = {
        keys: jest.fn().mockReturnValue(['cluster1']),
        getConfig: jest.fn().mockReturnValue(mockClusterConfig),
      } as unknown as Config;

      const result = parseClusterConfigs(mockClustersConfig);

      expect(result).toEqual({
        cluster1: {
          apiUrl: undefined,
          kubearchiveApiUrl: undefined,
          uiUrl: undefined,
          serviceAccountToken: undefined,
        },
      });
    });

    it('should return null when parsing throws an error', () => {
      const mockClustersConfig = {
        keys: jest.fn().mockImplementation(() => {
          throw new Error('Config error');
        }),
      } as unknown as Config;

      const result = parseClusterConfigs(mockClustersConfig);

      expect(result).toBeNull();
    });

    it('should handle empty clusters config', () => {
      const mockClustersConfig = {
        keys: jest.fn().mockReturnValue([]),
      } as unknown as Config;

      const result = parseClusterConfigs(mockClustersConfig);

      expect(result).toEqual({});
    });

    it('should handle getConfig throwing an error', () => {
      const mockClustersConfig = {
        keys: jest.fn().mockReturnValue(['cluster1']),
        getConfig: jest.fn().mockImplementation(() => {
          throw new Error('Config not found');
        }),
      } as unknown as Config;

      const result = parseClusterConfigs(mockClustersConfig);

      expect(result).toBeNull();
    });
  });

  describe('parseAuthProviderConfig', () => {
    it('should return oidc when clustersConfig is undefined', () => {
      const result = parseAuthProviderConfig(undefined);
      expect(result).toBe('oidc');
    });

    it('should return oidc when authProvider is not specified', () => {
      const mockClustersConfig = {
        getOptionalString: jest.fn().mockReturnValue(undefined),
      } as unknown as Config;

      const result = parseAuthProviderConfig(mockClustersConfig);
      expect(result).toBe('oidc');
    });

    it('should return specified authProvider', () => {
      const mockClustersConfig = {
        getOptionalString: jest.fn((key: string) => {
          if (key === 'authProvider') return 'serviceAccount';
          return undefined;
        }),
      } as unknown as Config;

      const result = parseAuthProviderConfig(mockClustersConfig);
      expect(result).toBe('serviceAccount');
    });

    it('should return impersonationHeaders when specified', () => {
      const mockClustersConfig = {
        getOptionalString: jest.fn((key: string) => {
          if (key === 'authProvider') return 'impersonationHeaders';
          return undefined;
        }),
      } as unknown as Config;

      const result = parseAuthProviderConfig(mockClustersConfig);
      expect(result).toBe('impersonationHeaders');
    });

    it('should return oidc as default when authProvider is empty string', () => {
      const mockClustersConfig = {
        getOptionalString: jest.fn((key: string) => {
          if (key === 'authProvider') return '';
          return undefined;
        }),
      } as unknown as Config;

      const result = parseAuthProviderConfig(mockClustersConfig);
      expect(result).toBe('oidc');
    });
  });
});
