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

import type { ComponentProps } from 'react';
import { BrowserRouter } from 'react-router-dom';
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { mockApis, MockErrorApi, TestApiProvider } from '@backstage/test-utils';
import { QueryClientProvider } from '@tanstack/react-query';
import { errorApiRef } from '@backstage/core-plugin-api';
import { translationApiRef } from '@backstage/core-plugin-api/alpha';

import { queryClient } from '../../queryclient';
import { extensionsApiRef } from '../../api';
import { dynamicPluginsInfoApiRef } from '../../api';
import { InstalledPackagesTable } from './InstalledPackagesTable';
import { useNodeEnvironment } from '../../hooks/useNodeEnvironment';
import { useExtensionsConfiguration } from '../../hooks/useExtensionsConfiguration';

jest.mock('@backstage/core-plugin-api', () => ({
  ...jest.requireActual('@backstage/core-plugin-api'),
  useRouteRef: () => (params: { namespace: string; name: string }) =>
    `/packages/${params.namespace}/${params.name}`,
}));

jest.mock('../../hooks/useNodeEnvironment', () => ({
  useNodeEnvironment: jest.fn(),
}));

jest.mock('../../hooks/useExtensionsConfiguration', () => ({
  useExtensionsConfiguration: jest.fn(),
}));

const useNodeEnvironmentMock = useNodeEnvironment as jest.Mock;
const useExtensionsConfigurationMock = useExtensionsConfiguration as jest.Mock;

type TestApiProviderApis = NonNullable<
  ComponentProps<typeof TestApiProvider>['apis']
>;

describe('InstalledPackagesTable', () => {
  const renderWithProviders = (
    apis: ReadonlyArray<readonly [unknown, unknown]>,
  ) =>
    render(
      <TestApiProvider
        apis={
          [
            ...(apis as unknown as TestApiProviderApis),
            [errorApiRef, new MockErrorApi()],
            [translationApiRef, mockApis.translation()],
          ] as TestApiProviderApis
        }
      >
        <BrowserRouter>
          <QueryClientProvider client={queryClient}>
            <InstalledPackagesTable />
          </QueryClientProvider>
        </BrowserRouter>
      </TestApiProvider>,
    );

  beforeEach(() => {
    queryClient.clear();
    queryClient.setDefaultOptions({ queries: { retry: false } });
    useNodeEnvironmentMock.mockReturnValue({
      data: { nodeEnv: 'development' },
    });
    useExtensionsConfigurationMock.mockReturnValue({
      data: { enabled: true },
    });
  });

  it('renders rows for all dynamic-plugins-info entries and maps names when entity exists', async () => {
    const dynamicPlugins = [
      {
        name: '@scope/pkg-a-dynamic',
        version: '1.0.0',
        role: 'frontend-plugin',
        platform: 'fe',
      },
      {
        name: 'pkg-b-dynamic',
        version: '2.0.0',
        role: 'backend-plugin',
        platform: 'be',
      },
    ];

    const entities = {
      items: [
        {
          apiVersion: 'extensions.backstage.io/v1alpha1',
          kind: 'Package',
          metadata: {
            namespace: 'rhdh',
            name: 'scope-pkg-a',
            title: 'Package A',
          },
          spec: { packageName: '@scope/pkg-a', version: '1.0.0' },
        },
      ],
      totalItems: 1,
      pageInfo: {},
    };

    const apis = [
      [
        dynamicPluginsInfoApiRef,
        { listLoadedPlugins: jest.fn().mockResolvedValue(dynamicPlugins) },
      ],
      [
        extensionsApiRef,
        { getPackages: jest.fn().mockResolvedValue(entities) },
      ],
    ] as const;

    renderWithProviders(apis);

    await waitFor(() =>
      expect(screen.getByText('Installed packages (2)')).toBeInTheDocument(),
    );

    // Name column shows mapped entity title for first row
    expect(screen.getByText('Package A')).toBeInTheDocument();
    // Second row has no entity -> uses readable fallback (should include raw package name minus suffixes)
    expect(screen.getByText(/pkg-b/i)).toBeInTheDocument();

    // npm package name column shows the dynamic plugin record name directly
    expect(screen.getByText('@scope/pkg-a-dynamic')).toBeInTheDocument();
    expect(screen.getByText('pkg-b-dynamic')).toBeInTheDocument();

    // Role and Version columns
    expect(
      screen.getByText('Frontend plugin'.replace('plugin', 'plugin')),
    ).toBeInTheDocument();
    expect(screen.getByText('1.0.0')).toBeInTheDocument();
    expect(screen.getByText('2.0.0')).toBeInTheDocument();
  });

  it('disables actions and shows tooltip when entity is missing', async () => {
    const dynamicPlugins = [
      {
        name: 'no-entity-dynamic',
        version: '1.0.0',
        role: 'frontend-plugin',
        platform: 'fe',
      },
    ];

    const entities = { items: [], totalItems: 0, pageInfo: {} };

    const apis = [
      [
        dynamicPluginsInfoApiRef,
        { listLoadedPlugins: jest.fn().mockResolvedValue(dynamicPlugins) },
      ],
      [
        extensionsApiRef,
        { getPackages: jest.fn().mockResolvedValue(entities) },
      ],
    ] as const;

    renderWithProviders(apis);

    await waitFor(() =>
      expect(screen.getByText('Installed packages (1)')).toBeInTheDocument(),
    );

    const disabledButtons = screen.getAllByRole('button', { hidden: true });
    // There are three disabled action buttons rendered wrapped in span
    expect(disabledButtons.length).toBeGreaterThanOrEqual(3);
  });

  // RHDHBUGS-2289: loaded custom package without catalog entity
  it('shows toggle ON and docs link in tooltip when catalog entity is missing', async () => {
    const dynamicPlugins = [
      {
        name: '@acme/third-party-widget-dynamic',
        version: '9.9.9',
        role: 'frontend-plugin',
        platform: 'web',
      },
    ];

    const entities = { items: [], totalItems: 0, pageInfo: {} };

    const apis = [
      [
        dynamicPluginsInfoApiRef,
        { listLoadedPlugins: jest.fn().mockResolvedValue(dynamicPlugins) },
      ],
      [
        extensionsApiRef,
        { getPackages: jest.fn().mockResolvedValue(entities) },
      ],
    ] as const;

    renderWithProviders(apis);

    await waitFor(() =>
      expect(screen.getByText('Installed packages (1)')).toBeInTheDocument(),
    );

    const toggle = screen.getByRole('checkbox');
    expect(toggle).toBeChecked();

    // Disabled controls don't receive pointer events; hover the custom Tooltip child.
    const tooltipAnchor = toggle.closest('span') ?? toggle;
    fireEvent.mouseOver(tooltipAnchor);
    const tooltip = await screen.findByRole('tooltip');
    expect(tooltip).toHaveTextContent(/the catalog-entity is missing/i);
    expect(tooltip).toHaveTextContent(/to enable actions/i);
    const docsLink = within(tooltip).getByRole('link', {
      name: /view documentation/i,
    });
    expect(docsLink).toHaveAttribute(
      'href',
      expect.stringContaining('catalog-entities/extensions'),
    );
  });

  it('disables actions in the production env', async () => {
    useNodeEnvironmentMock.mockReturnValue({
      data: {
        nodeEnv: 'production',
      },
    });
    const dynamicPlugins = [
      {
        name: '@scope/pkg-a-dynamic',
        version: '1.0.0',
        role: 'frontend-plugin',
        platform: 'fe',
      },
    ];

    const entities = {
      items: [
        {
          apiVersion: 'extensions.backstage.io/v1alpha1',
          kind: 'Package',
          metadata: {
            namespace: 'rhdh',
            name: 'scope-pkg-a',
            title: 'Package A',
          },
          spec: { packageName: '@scope/pkg-a', version: '1.0.0' },
        },
      ],
      totalItems: 1,
      pageInfo: {},
    };

    const apis = [
      [
        dynamicPluginsInfoApiRef,
        { listLoadedPlugins: jest.fn().mockResolvedValue(dynamicPlugins) },
      ],
      [
        extensionsApiRef,
        { getPackages: jest.fn().mockResolvedValue(entities) },
      ],
    ] as const;

    renderWithProviders(apis);

    await waitFor(() =>
      expect(screen.getByText('Installed packages (1)')).toBeInTheDocument(),
    );

    const disabledButtons = screen.getAllByRole('button', { hidden: true });
    // There are three disabled action buttons rendered wrapped in span
    expect(disabledButtons.length).toBeGreaterThanOrEqual(3);
  });

  it('filters by search query', async () => {
    const dynamicPlugins = [
      {
        name: 'alpha-dynamic',
        version: '1.0.0',
        role: 'frontend-plugin',
        platform: 'fe',
      },
      {
        name: 'beta-dynamic',
        version: '1.0.0',
        role: 'backend-plugin',
        platform: 'be',
      },
    ];
    const entities = { items: [], totalItems: 0, pageInfo: {} };
    const apis = [
      [
        dynamicPluginsInfoApiRef,
        { listLoadedPlugins: jest.fn().mockResolvedValue(dynamicPlugins) },
      ],
      [
        extensionsApiRef,
        { getPackages: jest.fn().mockResolvedValue(entities) },
      ],
    ] as const;

    renderWithProviders(apis);

    await waitFor(() =>
      expect(screen.getByText('Installed packages (2)')).toBeInTheDocument(),
    );

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'alpha' } });

    await waitFor(() =>
      expect(screen.getByText('Installed packages (1)')).toBeInTheDocument(),
    );
    expect(screen.queryByText('beta')).not.toBeInTheDocument();
  });
});
