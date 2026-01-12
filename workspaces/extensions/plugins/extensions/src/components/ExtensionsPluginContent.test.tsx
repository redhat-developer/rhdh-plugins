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

import type { ReactNode } from 'react';
import { BrowserRouter } from 'react-router-dom';

import { mockApis, MockErrorApi, TestApiProvider } from '@backstage/test-utils';

import { fireEvent, render } from '@testing-library/react';
import { ExtensionsPluginContent } from './ExtensionsPluginContent';
import { extensionsApiRef } from '../api';
import { usePluginConfigurationPermissions } from '../hooks/usePluginConfigurationPermissions';
import { usePlugin } from '../hooks/usePlugin';
import { usePluginPackages } from '../hooks/usePluginPackages';
import { ExtensionsPluginInstallStatus } from '@red-hat-developer-hub/backstage-plugin-extensions-common';
import { useExtensionsConfiguration } from '../hooks/useExtensionsConfiguration';
import { useNodeEnvironment } from '../hooks/useNodeEnvironment';
import { errorApiRef } from '@backstage/core-plugin-api';
import { translationApiRef } from '@backstage/core-plugin-api/alpha';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../queryclient';

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

jest.mock('../hooks/usePluginConfigurationPermissions', () => ({
  usePluginConfigurationPermissions: jest.fn(),
}));

jest.mock('../hooks/usePlugin', () => ({
  usePlugin: jest.fn(),
}));

jest.mock('../hooks/useExtensionsConfiguration', () => ({
  useExtensionsConfiguration: jest.fn(),
}));

jest.mock('../hooks/useNodeEnvironment', () => ({
  useNodeEnvironment: jest.fn(),
}));

jest.mock('../hooks/usePluginPackages', () => ({
  usePluginPackages: jest.fn(),
}));

const usePluginMock = usePlugin as jest.Mock;
const useNodeEnvironmentMock = useNodeEnvironment as jest.Mock;
const usePluginPackagesMock = usePluginPackages as jest.Mock;
const usePluginConfigurationPermissionsMock =
  usePluginConfigurationPermissions as jest.Mock;
const useExtensionsConfigurationMock = useExtensionsConfiguration as jest.Mock;

queryClient.setDefaultOptions({
  queries: { retry: false },
});

beforeEach(() => {
  usePluginConfigurationPermissionsMock.mockReturnValue({
    data: {
      write: 'ALLOW',
      read: 'ALLOW',
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
  useNodeEnvironmentMock.mockReturnValue({
    data: {
      nodeEnv: 'test',
    },
  });
  jest.clearAllMocks();
});

const mockExtensionsApi = {
  getPluginPackages: jest.fn(),
};

afterEach(() => {
  jest.clearAllMocks();
});

const renderWithProviders = (ui: ReactNode) =>
  render(
    <TestApiProvider
      apis={[
        [extensionsApiRef, mockExtensionsApi],
        [errorApiRef, new MockErrorApi()],
        [translationApiRef, mockApis.translation()],
      ]}
    >
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
      </BrowserRouter>
    </TestApiProvider>,
  );

describe('ExtensionsPluginContent', () => {
  const packages = [
    {
      metadata: {
        annotations: {},
        name: 'backstage-community-plugin-3scale-backend',
        namespace: 'extensions-plugin-demo',
        title: '@backstage-community/plugin-3scale-backend',
      },
      apiVersion: 'extensions.backstage.io/v1alpha1',
      kind: 'Package',
      spec: {
        packageName: '@backstage-community/plugin-3scale-backend',
        dynamicArtifact:
          './dynamic-plugins/dist/backstage-community-plugin-3scale-backend-dynamic',
        partOf: ['backstage-community-plugin-3scale-backend'],
      },
    },
  ];

  const plugin = {
    metadata: {
      annotations: {},
      namespace: 'extensions-plugin-demo',
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

  usePluginPackagesMock.mockReturnValue({
    isLoading: false,
    data: packages,
  });
  usePluginMock.mockReturnValue({
    isLoading: false,
    data: plugin,
  });
  it('should have the Install button enabled', async () => {
    const { getByText } = renderWithProviders(
      <ExtensionsPluginContent plugin={plugin} />,
    );
    expect(getByText('Install')).toBeInTheDocument();
    const installButton = getByText('Install');
    expect(installButton).toBeEnabled();
  });

  it('should have the View button', async () => {
    usePluginConfigurationPermissionsMock.mockReturnValue({
      data: {
        write: 'DENY',
        read: 'ALLOW',
      },
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });

    const { getByText } = renderWithProviders(
      <QueryClientProvider client={queryClient}>
        <ExtensionsPluginContent plugin={plugin} />,
      </QueryClientProvider>,
    );
    expect(getByText('View')).toBeInTheDocument();
  });

  it('should have the View button for production env', async () => {
    useNodeEnvironmentMock.mockReturnValue({
      data: {
        nodeEnv: 'production',
      },
    });

    const { getByText } = renderWithProviders(
      <ExtensionsPluginContent plugin={plugin} />,
    );
    expect(getByText('View')).toBeInTheDocument();
  });

  it('should have the Install button disabled', async () => {
    usePluginConfigurationPermissionsMock.mockReturnValue({
      data: {
        write: 'DENY',
        read: 'DENY',
      },
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });

    const { getByText } = renderWithProviders(
      <ExtensionsPluginContent plugin={plugin} />,
    );
    expect(getByText('Install')).toBeInTheDocument();
    const installButton = getByText('Install');
    expect(installButton).toBeDisabled();
  });

  it('should render the Actions button', async () => {
    usePluginPackagesMock.mockReturnValue({
      isLoading: false,
      data: packages,
    });

    const installedPlugin = {
      ...plugin,
      spec: {
        ...plugin.spec,
        installStatus: ExtensionsPluginInstallStatus.Installed,
      },
    };

    const { getByText, getByTestId } = renderWithProviders(
      <ExtensionsPluginContent plugin={installedPlugin} />,
    );
    expect(getByText('Actions')).toBeInTheDocument();
    const actionsButton = getByTestId('plugin-actions');
    fireEvent.click(actionsButton);

    expect(getByTestId('actions-button')).toBeInTheDocument();
    expect(getByTestId('disable-plugin')).toBeInTheDocument();
  });

  it('should have the View button when user has read only access even when the plugin is installed', async () => {
    usePluginConfigurationPermissionsMock.mockReturnValue({
      data: {
        write: 'DENY',
        read: 'ALLOW',
      },
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });
    const installedPlugin = {
      ...plugin,
      spec: {
        ...plugin.spec,
        installStatus: ExtensionsPluginInstallStatus.Installed,
      },
    };

    const { getByText } = renderWithProviders(
      <QueryClientProvider client={queryClient}>
        <ExtensionsPluginContent plugin={installedPlugin} />,
      </QueryClientProvider>,
    );
    expect(getByText('View')).toBeInTheDocument();
  });

  it('should have the View button when package is missing dynamicArtifact', async () => {
    const packageWithoutDynamicArtifact = {
      ...packages[0],
      spec: {
        partOf: ['backstage-community-plugin-3scale-backend'],
      },
    };

    const { getByText } = renderWithProviders(
      <ExtensionsPluginContent plugin={packageWithoutDynamicArtifact} />,
    );
    expect(getByText('View')).toBeInTheDocument();
  });

  it('should render the Actions button when packages have dynamicArtifact', async () => {
    const installedPlugin = {
      ...plugin,
      spec: {
        ...plugin.spec,
        installStatus: ExtensionsPluginInstallStatus.Installed,
      },
    };

    usePluginPackagesMock.mockReturnValue({
      isLoading: false,
      data: packages,
    });

    const { getByText, getByTestId } = renderWithProviders(
      <ExtensionsPluginContent plugin={installedPlugin} />,
    );
    expect(getByText('Actions')).toBeInTheDocument();
    const actionsButton = getByTestId('plugin-actions');
    fireEvent.click(actionsButton);

    expect(getByTestId('actions-button')).toBeInTheDocument();
    expect(getByTestId('disable-plugin')).toBeInTheDocument();
  });
});
