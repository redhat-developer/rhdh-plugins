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

import { renderHook } from '@testing-library/react';
import { useKonfluxConfig } from '../useKonfluxConfig';
import { useApi } from '@backstage/core-plugin-api';
import { useEntitiesKonfluxConfig } from '../useEntitiesKonfluxConfig';
import * as konfluxCommon from '@red-hat-developer-hub/backstage-plugin-konflux-common';

jest.mock('@backstage/core-plugin-api', () => ({
  ...jest.requireActual('@backstage/core-plugin-api'),
  useApi: jest.fn(),
}));

jest.mock('../useEntitiesKonfluxConfig', () => ({
  useEntitiesKonfluxConfig: jest.fn(),
}));

jest.mock('@red-hat-developer-hub/backstage-plugin-konflux-common', () => ({
  ...jest.requireActual(
    '@red-hat-developer-hub/backstage-plugin-konflux-common',
  ),
  parseClusterConfigs: jest.fn(),
  parseAuthProviderConfig: jest.fn(),
}));

const mockUseApi = useApi as jest.MockedFunction<typeof useApi>;
const mockUseEntitiesKonfluxConfig =
  useEntitiesKonfluxConfig as jest.MockedFunction<
    typeof useEntitiesKonfluxConfig
  >;
const mockParseClusterConfigs =
  konfluxCommon.parseClusterConfigs as jest.MockedFunction<
    typeof konfluxCommon.parseClusterConfigs
  >;
const mockParseAuthProviderConfig =
  konfluxCommon.parseAuthProviderConfig as jest.MockedFunction<
    typeof konfluxCommon.parseAuthProviderConfig
  >;

describe('useKonfluxConfig', () => {
  const mockConfigApi = {
    getOptionalConfig: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseApi.mockReturnValue(mockConfigApi);
    mockUseEntitiesKonfluxConfig.mockReturnValue(null);
    mockParseClusterConfigs.mockReturnValue({});
    mockParseAuthProviderConfig.mockReturnValue('serviceAccount');
  });

  it('should return minimal config when konflux config is not found', () => {
    mockConfigApi.getOptionalConfig.mockReturnValue(undefined);

    const { result } = renderHook(() => useKonfluxConfig());

    expect(result.current).toEqual({
      clusters: {},
      subcomponentConfigs: [],
      authProvider: 'serviceAccount',
    });
    expect(mockConfigApi.getOptionalConfig).toHaveBeenCalledWith('konflux');
  });

  it('should return config with clusters and authProvider', () => {
    const mockKonfluxConfig = {
      getOptionalConfig: jest.fn(),
    };
    const mockClustersConfig = {};

    mockConfigApi.getOptionalConfig.mockReturnValue(mockKonfluxConfig);
    mockKonfluxConfig.getOptionalConfig.mockReturnValue(mockClustersConfig);
    mockParseClusterConfigs.mockReturnValue({
      cluster1: {
        apiUrl: 'https://api.cluster1.example.com',
        uiUrl: 'https://cluster1.example.com',
        serviceAccountToken: 'ABC123',
      },
    });
    mockParseAuthProviderConfig.mockReturnValue('serviceAccount');

    const { result } = renderHook(() => useKonfluxConfig());

    expect(result.current).toEqual({
      clusters: {
        cluster1: {
          apiUrl: 'https://api.cluster1.example.com',
          uiUrl: 'https://cluster1.example.com',
          serviceAccountToken: 'ABC123',
        },
      },
      subcomponentConfigs: [],
      authProvider: 'serviceAccount',
    });
  });

  it('should use subcomponentConfigs from useEntitiesKonfluxConfig when available', () => {
    const mockKonfluxConfig = {
      getOptionalConfig: jest.fn(),
    };
    const mockClustersConfig = {};
    const mockSubcomponentConfigs = [
      {
        subcomponent: 'component1',
        cluster: 'cluster1',
        namespace: 'namespace1',
        applications: ['app1'],
      },
    ];

    mockConfigApi.getOptionalConfig.mockReturnValue(mockKonfluxConfig);
    mockKonfluxConfig.getOptionalConfig.mockReturnValue(mockClustersConfig);
    mockUseEntitiesKonfluxConfig.mockReturnValue(mockSubcomponentConfigs);

    const { result } = renderHook(() => useKonfluxConfig());

    expect(result.current?.subcomponentConfigs).toEqual(
      mockSubcomponentConfigs,
    );
  });

  it('should use empty subcomponentConfigs array when useEntitiesKonfluxConfig returns null', () => {
    const mockKonfluxConfig = {
      getOptionalConfig: jest.fn(),
    };
    const mockClustersConfig = {};

    mockConfigApi.getOptionalConfig.mockReturnValue(mockKonfluxConfig);
    mockKonfluxConfig.getOptionalConfig.mockReturnValue(mockClustersConfig);
    mockUseEntitiesKonfluxConfig.mockReturnValue(null);

    const { result } = renderHook(() => useKonfluxConfig());

    expect(result.current?.subcomponentConfigs).toEqual([]);
  });

  it('should handle parseClusterConfigs returning null', () => {
    const mockKonfluxConfig = {
      getOptionalConfig: jest.fn(),
    };
    const mockClustersConfig = {};

    mockConfigApi.getOptionalConfig.mockReturnValue(mockKonfluxConfig);
    mockKonfluxConfig.getOptionalConfig.mockReturnValue(mockClustersConfig);
    mockParseClusterConfigs.mockReturnValue(null);

    const { result } = renderHook(() => useKonfluxConfig());

    expect(result.current?.clusters).toEqual({});
  });

  it('should return minimal config when config parsing throws an error', () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    mockConfigApi.getOptionalConfig.mockImplementation(() => {
      throw new Error('Config error');
    });

    const { result } = renderHook(() => useKonfluxConfig());

    expect(result.current).toEqual({
      clusters: {},
      subcomponentConfigs: [],
      authProvider: 'serviceAccount',
    });
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Failed to read Konflux configuration:',
      expect.any(Error),
    );

    consoleErrorSpy.mockRestore();
  });

  it('should call parseClusterConfigs with clusters config', () => {
    const mockKonfluxConfig = {
      getOptionalConfig: jest.fn(),
    };
    const mockClustersConfig = {};

    mockConfigApi.getOptionalConfig.mockReturnValue(mockKonfluxConfig);
    mockKonfluxConfig.getOptionalConfig.mockReturnValue(mockClustersConfig);

    renderHook(() => useKonfluxConfig());

    expect(mockKonfluxConfig.getOptionalConfig).toHaveBeenCalledWith(
      'clusters',
    );
    expect(mockParseClusterConfigs).toHaveBeenCalledWith(mockClustersConfig);
  });

  it('should call parseAuthProviderConfig with konflux config', () => {
    const mockKonfluxConfig = {
      getOptionalConfig: jest.fn(),
    };
    const mockClustersConfig = {};

    mockConfigApi.getOptionalConfig.mockReturnValue(mockKonfluxConfig);
    mockKonfluxConfig.getOptionalConfig.mockReturnValue(mockClustersConfig);

    renderHook(() => useKonfluxConfig());

    expect(mockParseAuthProviderConfig).toHaveBeenCalledWith(mockKonfluxConfig);
  });

  it('should return complete config with all properties', () => {
    const mockKonfluxConfig = {
      getOptionalConfig: jest.fn(),
    };
    const mockClustersConfig = {};
    const mockClusters = {
      cluster1: {
        apiUrl: 'https://api.cluster1.example.com',
        uiUrl: 'https://cluster1.example.com',
        serviceAccountToken: 'ABC123',
      },
    };
    const mockSubcomponentConfigs = [
      {
        subcomponent: 'component1',
        cluster: 'cluster1',
        namespace: 'namespace1',
        applications: ['app1'],
      },
    ];

    mockConfigApi.getOptionalConfig.mockReturnValue(mockKonfluxConfig);
    mockKonfluxConfig.getOptionalConfig.mockReturnValue(mockClustersConfig);
    mockParseClusterConfigs.mockReturnValue(mockClusters);
    mockParseAuthProviderConfig.mockReturnValue('impersonationHeaders');
    mockUseEntitiesKonfluxConfig.mockReturnValue(mockSubcomponentConfigs);

    const { result } = renderHook(() => useKonfluxConfig());

    expect(result.current).toEqual({
      clusters: mockClusters,
      subcomponentConfigs: mockSubcomponentConfigs,
      authProvider: 'impersonationHeaders',
    });
  });

  it('should handle when clusters config is undefined', () => {
    const mockKonfluxConfig = {
      getOptionalConfig: jest.fn(),
    };

    mockConfigApi.getOptionalConfig.mockReturnValue(mockKonfluxConfig);
    mockKonfluxConfig.getOptionalConfig.mockReturnValue(undefined);
    mockParseClusterConfigs.mockReturnValue(null);

    const { result } = renderHook(() => useKonfluxConfig());

    expect(result.current?.clusters).toEqual({});
    expect(mockParseClusterConfigs).toHaveBeenCalledWith(undefined);
  });
});
