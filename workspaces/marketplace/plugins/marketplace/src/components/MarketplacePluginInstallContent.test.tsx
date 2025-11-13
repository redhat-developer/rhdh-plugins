/*
 * Copyright The Backstage Authors
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

import { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';

import { TestApiProvider } from '@backstage/test-utils';

import { fireEvent, render, waitFor } from '@testing-library/react';
import { usePluginConfig } from '../hooks/usePluginConfig';
import { MarketplacePluginInstallContent } from './MarketplacePluginInstallContent';
import { marketplaceApiRef } from '../api';
import { alertApiRef } from '@backstage/core-plugin-api';
import { usePluginConfigurationPermissions } from '../hooks/usePluginConfigurationPermissions';
import { useInstallPlugin } from '../hooks/useInstallPlugin';
import { useExtensionsConfiguration } from '../hooks/useExtensionsConfiguration';

const usePluginConfigMock = usePluginConfig as jest.Mock;
const useExtensionsConfigurationMock = useExtensionsConfiguration as jest.Mock;

const usePluginConfigurationPermissionsMock =
  usePluginConfigurationPermissions as jest.Mock;
const useInstallPluginMock = useInstallPlugin as jest.Mock;

jest.mock('../hooks/usePluginConfig', () => ({
  usePluginConfig: jest.fn(),
}));

jest.mock('../hooks/useNodeEnvironment', () => ({
  useNodeEnvironment: jest.fn(),
}));

jest.mock('../hooks/useInstallPlugin', () => ({
  useInstallPlugin: jest.fn(),
}));

jest.mock('../hooks/usePluginConfigurationPermissions', () => ({
  usePluginConfigurationPermissions: jest.fn(),
}));

jest.mock('./CodeEditor', () => ({
  useCodeEditor: jest.fn(),
}));

jest.mock('../hooks/useExtensionsConfiguration', () => ({
  useExtensionsConfiguration: jest.fn(),
}));

jest.mock('@backstage/core-plugin-api', () => {
  const actual = jest.requireActual('@backstage/core-plugin-api');
  return {
    ...actual,
    attachComponentData: jest.fn(),
    useRouteRef: jest.fn().mockImplementation(() => () => '/mock-plugin-route'),
    useRouteRefParams: jest
      .fn()
      .mockReturnValue({ namespace: 'default', name: 'test' }),
  };
});

const mockCodeEditorSetValue = jest.fn();

jest.mock('./CodeEditor', () => ({
  CodeEditor: ({ onLoaded }: any) => {
    useEffect(() => {
      onLoaded?.();
    }, [onLoaded]);
    return <div>Code Editor Mock</div>;
  },
  useCodeEditor: () => ({
    setValue: mockCodeEditorSetValue,
    getValue: jest.fn(),
  }),
}));

beforeEach(() => {
  jest.clearAllMocks();
  usePluginConfigMock.mockReturnValue({
    isLoading: false,
    data: {},
  });

  usePluginConfigurationPermissionsMock.mockReturnValue({
    data: {
      write: 'ALLOW',
    },
    isLoading: false,
    error: null,
    refetch: jest.fn(),
  });

  useExtensionsConfigurationMock.mockReturnValue({
    data: {
      enabled: true,
    },
  });
});

describe('MarketplacePluginInstallContent', () => {
  const mockMarketplaceApi = {
    getPluginConfigByName: jest.fn(),
  };
  const mockAlertApiRef = {
    post: jest.fn(),
  };

  const configYaml =
    '- package: ./dynamic-plugins/dist/red-hat-developer-hub-backstage-plugin-marketplace\n  disabled: false # DEBSMITA\n  pluginConfig:\n    dynamicPlugins:\n      frontend:\n        red-hat-developer-hub.backstage-plugin-marketplace:\n          appIcons:\n            - name: marketplace\n              importName: MarketplaceIcon\n          dynamicRoutes:\n            - path: /extensions/catalog\n              importName: DynamicMarketplacePluginRouter\n          mountPoints:\n            - mountPoint: internal.plugins/tab\n              importName: DynamicMarketplacePluginContent\n              config:\n                path: marketplace\n                title: Catalog\n- package: ./dynamic-plugins/dist/red-hat-developer-hub-backstage-plugin-marketplace-backend-dynamic\n  disabled: false\n';

  const packages = [
    {
      metadata: {
        annotations: {},
        name: 'backstage-community-plugin-3scale-backend',
        namespace: 'marketplace-plugin-demo',
        title: '@backstage-community/plugin-3scale-backend',
      },
      apiVersion: 'extensions.backstage.io/v1alpha1',
      kind: 'Package',
      spec: {
        packageName: '@backstage-community/plugin-3scale-backend',
        dynamicArtifact:
          './dynamic-plugins/dist/backstage-community-plugin-3scale-backend-dynamic',
      },
    },
  ];

  const plugin = {
    metadata: {
      annotations: {},
      namespace: 'marketplace-plugin-demo',
      name: '3scale',
      title: 'APIs with 3scale',
      description: 'Synchronize 3scale content into the Backstage catalog.',
    },
    apiVersion: 'extensions.backstage.io/v1alpha1',
    kind: 'Plugin',
    spec: {
      packages: ['backstage-community-plugin-3scale-backend'],
    },
  };

  it('should load YAML from artifacts if pluginConfig is not found for the plugin', async () => {
    useInstallPluginMock.mockReturnValue({
      mutateAsync: jest.fn().mockResolvedValue({
        status: 'OK',
      }),
    });

    const { getByTestId } = render(
      <TestApiProvider
        apis={[
          [marketplaceApiRef, mockMarketplaceApi],
          [alertApiRef, mockAlertApiRef],
        ]}
      >
        <BrowserRouter>
          <MarketplacePluginInstallContent
            packages={packages}
            plugin={plugin}
          />
        </BrowserRouter>
      </TestApiProvider>,
    );
    await waitFor(() => {
      expect(mockCodeEditorSetValue).toHaveBeenCalled();
    });
    const yamlString = mockCodeEditorSetValue.mock.calls[0][0];
    expect(yamlString).toContain('plugins:');
    expect(yamlString).toContain(
      'package: ./dynamic-plugins/dist/backstage-community-plugin-3scale-backend-dynamic',
    );
    expect(yamlString).toContain('disabled: false');
    expect(getByTestId('install')).toBeInTheDocument();
  });

  it('should load YAML from pluginConfig and set it in the editor', async () => {
    usePluginConfigMock.mockReturnValue({
      isLoading: false,
      data: {
        configYaml,
      },
    });

    const { getByTestId } = render(
      <TestApiProvider
        apis={[
          [marketplaceApiRef, mockMarketplaceApi],
          [alertApiRef, mockAlertApiRef],
        ]}
      >
        <BrowserRouter>
          <MarketplacePluginInstallContent
            packages={packages}
            plugin={plugin}
          />
        </BrowserRouter>
      </TestApiProvider>,
    );
    await waitFor(() => {
      expect(mockCodeEditorSetValue).toHaveBeenCalled();
    });
    expect(mockCodeEditorSetValue.mock.calls[0][0]).toContain(
      'package: ./dynamic-plugins/dist/red-hat-developer-hub-backstage-plugin-marketplace',
    );
    expect(getByTestId('install')).toBeInTheDocument();
  });

  it('should have the `Install` button disabled for limited permissions', async () => {
    usePluginConfigMock.mockReturnValue({
      isLoading: false,
      data: {
        configYaml,
      },
    });

    usePluginConfigurationPermissionsMock.mockReturnValue({
      data: {},
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });

    const { getByTestId } = render(
      <TestApiProvider
        apis={[
          [marketplaceApiRef, mockMarketplaceApi],
          [alertApiRef, mockAlertApiRef],
        ]}
      >
        <BrowserRouter>
          <MarketplacePluginInstallContent
            packages={packages}
            plugin={plugin}
          />
        </BrowserRouter>
      </TestApiProvider>,
    );
    expect(getByTestId('install-disabled')).toBeInTheDocument();
  });

  it('should have the `Install` button disabled for when extensions installation is disabled', async () => {
    usePluginConfigMock.mockReturnValue({
      isLoading: false,
      data: {
        configYaml,
      },
    });
    useExtensionsConfigurationMock.mockReturnValue({
      data: {
        enabled: false,
      },
    });
    const { getByTestId } = render(
      <TestApiProvider
        apis={[
          [marketplaceApiRef, mockMarketplaceApi],
          [alertApiRef, mockAlertApiRef],
        ]}
      >
        <BrowserRouter>
          <MarketplacePluginInstallContent
            packages={packages}
            plugin={plugin}
          />
        </BrowserRouter>
      </TestApiProvider>,
    );
    expect(getByTestId('install-disabled')).toBeInTheDocument();
  });

  it('should have the `Install` button disabled for when dynamicArtifact for a package is missing', async () => {
    usePluginConfigMock.mockReturnValue({
      isLoading: false,
      data: {
        configYaml,
      },
    });
    useExtensionsConfigurationMock.mockReturnValue({
      data: {
        enabled: false,
      },
    });
    const { getByTestId } = render(
      <TestApiProvider
        apis={[
          [marketplaceApiRef, mockMarketplaceApi],
          [alertApiRef, mockAlertApiRef],
        ]}
      >
        <BrowserRouter>
          <MarketplacePluginInstallContent
            packages={[
              {
                ...packages[0],
                spec: { ...packages[0].spec, dynamicArtifact: undefined },
              },
            ]}
            plugin={plugin}
          />
        </BrowserRouter>
      </TestApiProvider>,
    );
    expect(getByTestId('install-disabled')).toBeInTheDocument();
  });

  it('should show an error when installation fails', async () => {
    useInstallPluginMock.mockReturnValue({
      mutateAsync: jest.fn().mockResolvedValue({
        status: 'Installation error',
        error: { message: 'Installation failed' },
      }),
    });

    const { getByTestId, getByText } = render(
      <TestApiProvider
        apis={[
          [marketplaceApiRef, mockMarketplaceApi],
          [alertApiRef, mockAlertApiRef],
        ]}
      >
        <BrowserRouter>
          <MarketplacePluginInstallContent
            packages={packages}
            plugin={plugin}
          />
        </BrowserRouter>
      </TestApiProvider>,
    );
    await waitFor(() => {
      expect(mockCodeEditorSetValue).toHaveBeenCalled();
    });
    expect(getByTestId('install')).toBeInTheDocument();
    const installButton = getByText('Install');
    fireEvent.click(installButton);
    await waitFor(() => {
      expect(getByTestId('install-disabled')).toBeInTheDocument();
      expect(getByText('Installation failed')).toBeInTheDocument();
    });
  });
});
