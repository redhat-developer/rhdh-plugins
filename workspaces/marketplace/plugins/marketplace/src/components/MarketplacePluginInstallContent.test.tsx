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

import React from 'react';
import { BrowserRouter } from 'react-router-dom';

import { TestApiProvider } from '@backstage/test-utils';

import { render, waitFor } from '@testing-library/react';
import { usePluginConfig } from '../hooks/usePluginConfig';
import { MarketplacePluginInstallContent } from './MarketplacePluginInstallContent';
import { marketplaceApiRef } from '../api';
import { alertApiRef } from '@backstage/core-plugin-api';
import { usePluginConfigurationPermissions } from '../hooks/usePluginConfigurationPermissions';

const usePluginConfigMock = usePluginConfig as jest.Mock;
const useExtensionsConfigurationPermissionsMock =
  usePluginConfigurationPermissions as jest.Mock;

jest.mock('../hooks/usePluginConfig', () => ({
  usePluginConfig: jest.fn(),
}));

jest.mock('./CodeEditor', () => ({
  useCodeEditor: jest.fn(),
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

jest.mock('../hooks/useExtensionsConfigurationPermissions', () => ({
  useExtensionsConfigurationPermissions: jest.fn(),
}));
const mockCodeEditorSetValue = jest.fn();

jest.mock('./CodeEditor', () => ({
  CodeEditor: ({ onLoaded }: any) => {
    React.useEffect(() => {
      onLoaded?.();
    }, [onLoaded]);
    return <div>Code Editor Mock</div>;
  },
  useCodeEditor: () => ({
    setValue: mockCodeEditorSetValue,
  }),
}));

beforeEach(() => {
  jest.clearAllMocks();
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
        links: [],
        tags: [],
      },
      apiVersion: 'extensions.backstage.io/v1alpha1',
      kind: 'Package',
      spec: {
        packageName: '@backstage-community/plugin-3scale-backend',
        dynamicArtifact:
          './dynamic-plugins/dist/backstage-community-plugin-3scale-backend-dynamic',
        author: 'Red Hat',
        support: 'tech-preview',
        lifecycle: 'active',
        partOf: ['backstage-community-plugin-3scale-backend'],
        appConfigExamples: [],
      },
      relations: [],
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
      icon: 'https://janus-idp.io/images/plugins/3scale.svg',
      packages: ['backstage-community-plugin-3scale-backend'],
      authors: [
        {
          name: 'Red Hat',
        },
      ],
    },
  };
  it('should load YAML from artifacts if pluginConfig is not found for the plugin', async () => {
    usePluginConfigMock.mockReturnValue({
      isLoading: false,
      data: {},
    });
    useExtensionsConfigurationPermissionsMock.mockReturnValue({
      data: {
        write: 'ALLOW',
      },
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
    useExtensionsConfigurationPermissionsMock.mockReturnValue({
      data: {
        write: 'ALLOW',
      },
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

    useExtensionsConfigurationPermissionsMock.mockReturnValue({
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
});
