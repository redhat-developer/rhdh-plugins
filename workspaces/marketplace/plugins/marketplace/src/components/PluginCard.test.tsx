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

import { BrowserRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import { TestApiProvider } from '@backstage/test-utils';

import {
  MarketplacePlugin,
  MarketplacePluginInstallStatus,
} from '@red-hat-developer-hub/backstage-plugin-extensions-common';

import { PluginCard } from './PluginCard';
import { rootRouteRef, pluginRouteRef } from '../routes';

// Mock the route refs
jest.mock('@backstage/core-plugin-api', () => ({
  ...jest.requireActual('@backstage/core-plugin-api'),
  useRouteRef: jest.fn().mockImplementation(ref => {
    if (ref === rootRouteRef) {
      return () => '/marketplace';
    }
    if (ref === pluginRouteRef) {
      return () => '/marketplace/plugin';
    }
    return () => '/';
  }),
}));

const mockPlugin: MarketplacePlugin = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'Plugin',
  metadata: {
    name: 'test-plugin',
    namespace: 'default',
    title: 'Test Plugin',
    description: 'A test plugin for testing',
  },
  spec: {
    authors: [{ name: 'Test Author' }],
    categories: ['testing'],
  },
};

const renderPluginCard = (plugin: MarketplacePlugin) => {
  return render(
    <TestApiProvider apis={[]}>
      <BrowserRouter>
        <PluginCard plugin={plugin} />
      </BrowserRouter>
    </TestApiProvider>,
  );
};

describe('PluginCard', () => {
  describe('Install Status Indicators', () => {
    it('should show "Installed" status for Installed plugin', () => {
      const pluginWithStatus = {
        ...mockPlugin,
        spec: {
          ...mockPlugin.spec,
          installStatus: MarketplacePluginInstallStatus.Installed,
        },
      };

      renderPluginCard(pluginWithStatus);

      expect(screen.getByText('Installed')).toBeInTheDocument();
      expect(screen.getByTestId('CheckCircleOutlineIcon')).toBeInTheDocument();
    });

    it('should show "Installed" status for UpdateAvailable plugin', () => {
      const pluginWithStatus = {
        ...mockPlugin,
        spec: {
          ...mockPlugin.spec,
          installStatus: MarketplacePluginInstallStatus.UpdateAvailable,
        },
      };

      renderPluginCard(pluginWithStatus);

      expect(screen.getByText('Installed')).toBeInTheDocument();
      expect(screen.getByTestId('CheckCircleOutlineIcon')).toBeInTheDocument();
    });

    it('should show "Disabled" status for Disabled plugin', () => {
      const pluginWithStatus = {
        ...mockPlugin,
        spec: {
          ...mockPlugin.spec,
          installStatus: MarketplacePluginInstallStatus.Disabled,
        },
      };

      renderPluginCard(pluginWithStatus);

      expect(screen.getByText('Disabled')).toBeInTheDocument();
      expect(screen.getByText('--')).toBeInTheDocument();
    });

    it('should not show any status for NotInstalled plugin', () => {
      const pluginWithStatus = {
        ...mockPlugin,
        spec: {
          ...mockPlugin.spec,
          installStatus: MarketplacePluginInstallStatus.NotInstalled,
        },
      };

      renderPluginCard(pluginWithStatus);

      expect(screen.queryByText('Installed')).not.toBeInTheDocument();
      expect(screen.queryByText('Disabled')).not.toBeInTheDocument();
      expect(screen.queryByTestId('CheckCircleIcon')).not.toBeInTheDocument();
      expect(screen.queryByTestId('BlockIcon')).not.toBeInTheDocument();
    });

    it('should not show any status when installStatus is undefined', () => {
      renderPluginCard(mockPlugin);

      expect(screen.queryByText('Installed')).not.toBeInTheDocument();
      expect(screen.queryByText('Disabled')).not.toBeInTheDocument();
      expect(screen.queryByTestId('CheckCircleIcon')).not.toBeInTheDocument();
      expect(screen.queryByTestId('BlockIcon')).not.toBeInTheDocument();
    });
  });

  describe('Plugin Card Layout', () => {
    it('should render plugin title', () => {
      renderPluginCard(mockPlugin);
      expect(screen.getByText('Test Plugin')).toBeInTheDocument();
    });

    it('should render plugin author', () => {
      renderPluginCard(mockPlugin);
      expect(screen.getByText('by')).toBeInTheDocument();
      expect(screen.getByText('Test Author')).toBeInTheDocument();
    });

    it('should render plugin description', () => {
      renderPluginCard(mockPlugin);
      expect(screen.getByText('A test plugin for testing')).toBeInTheDocument();
    });

    it('should render "no description available" when description is missing', () => {
      const pluginWithoutDescription = {
        ...mockPlugin,
        metadata: {
          ...mockPlugin.metadata,
          description: undefined,
        },
      };

      renderPluginCard(pluginWithoutDescription);
      expect(screen.getByText('no description available')).toBeInTheDocument();
    });

    it('should render category tag', () => {
      renderPluginCard(mockPlugin);
      expect(screen.getByText('testing')).toBeInTheDocument();
    });

    it('should handle missing categories gracefully', () => {
      const pluginWithoutCategories = {
        ...mockPlugin,
        spec: {
          ...mockPlugin.spec,
          categories: undefined,
        },
      };

      renderPluginCard(pluginWithoutCategories);
      expect(screen.getByText('Test Plugin')).toBeInTheDocument();
      expect(screen.queryByText('testing')).not.toBeInTheDocument();
    });

    it('should truncate long category names', () => {
      const pluginWithLongCategory = {
        ...mockPlugin,
        spec: {
          ...mockPlugin.spec,
          categories: [
            'this-is-a-very-long-category-name-that-should-be-truncated',
          ],
        },
      };

      renderPluginCard(pluginWithLongCategory);
      expect(
        screen.getByText('this-is-a-very-long-categ...'),
      ).toBeInTheDocument();
    });

    it('should render "Read more" link', () => {
      renderPluginCard(mockPlugin);
      expect(screen.getByText('Read more')).toBeInTheDocument();
    });
  });
});
