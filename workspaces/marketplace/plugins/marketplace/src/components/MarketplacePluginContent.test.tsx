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

import { fireEvent, render } from '@testing-library/react';
import { MarketplacePluginContent } from './MarketplacePluginContent';
import { marketplaceApiRef } from '../api';
import { usePluginConfigurationPermissions } from '../hooks/usePluginConfigurationPermissions';
import { usePlugin } from '../hooks/usePlugin';
import { usePluginPackages } from '../hooks/usePluginPackages';
import { MarketplacePluginInstallStatus } from '@red-hat-developer-hub/backstage-plugin-marketplace-common';

const usePluginConfigurationPermissionsMock =
  usePluginConfigurationPermissions as jest.Mock;

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

jest.mock('../hooks/usePluginPackages', () => ({
  usePluginPackages: jest.fn(),
}));

const usePluginMock = usePlugin as jest.Mock;
const usePluginPackagesMock = usePluginPackages as jest.Mock;

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
  jest.clearAllMocks();
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('MarketplacePluginContent', () => {
  const mockMarketplaceApi = {
    getPluginPackages: jest.fn(),
  };

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
        partOf: ['backstage-community-plugin-3scale-backend'],
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
      icon: 'https://janus-idp.io/images/plugins/3scale.svg',
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
    const { getByText } = render(
      <TestApiProvider apis={[[marketplaceApiRef, mockMarketplaceApi]]}>
        <BrowserRouter>
          <MarketplacePluginContent
            plugin={plugin}
            enableActionsButtonFeature
          />
        </BrowserRouter>
      </TestApiProvider>,
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

    const { getByText } = render(
      <TestApiProvider apis={[[marketplaceApiRef, mockMarketplaceApi]]}>
        <BrowserRouter>
          <MarketplacePluginContent
            plugin={plugin}
            enableActionsButtonFeature
          />
        </BrowserRouter>
      </TestApiProvider>,
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

    const { getByText } = render(
      <TestApiProvider apis={[[marketplaceApiRef, mockMarketplaceApi]]}>
        <BrowserRouter>
          <MarketplacePluginContent
            plugin={plugin}
            enableActionsButtonFeature
          />
        </BrowserRouter>
      </TestApiProvider>,
    );
    expect(getByText('Install')).toBeInTheDocument();
    const installButton = getByText('Install');
    expect(installButton).toBeDisabled();
  });

  it('should render the Actions button', async () => {
    const installedPlugin = {
      ...plugin,
      spec: {
        ...plugin.spec,
        installStatus: MarketplacePluginInstallStatus.Installed,
      },
    };

    const { getByText, getByTestId } = render(
      <TestApiProvider apis={[[marketplaceApiRef, mockMarketplaceApi]]}>
        <BrowserRouter>
          <MarketplacePluginContent
            plugin={installedPlugin}
            enableActionsButtonFeature
          />
        </BrowserRouter>
      </TestApiProvider>,
    );
    expect(getByText('Actions')).toBeInTheDocument();
    const actionsButton = getByTestId('plugin-actions');
    fireEvent.click(actionsButton);

    expect(getByTestId('actions-button')).toBeInTheDocument();
    expect(getByTestId('enable-plugin')).toBeInTheDocument();
  });
});
