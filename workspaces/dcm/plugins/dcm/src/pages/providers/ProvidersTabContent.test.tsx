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

import { screen, fireEvent, waitFor } from '@testing-library/react';
import { TestApiProvider, renderInTestApp } from '@backstage/test-utils';
import type {
  Provider,
  ServiceType,
} from '@red-hat-developer-hub/backstage-plugin-dcm-common';
import { catalogApiRef, providersApiRef } from '../../apis';
import { ProvidersTabContent } from './ProvidersTabContent';

jest.mock('../../hooks/useTranslation', () => {
  const mod = require('../../test-utils/mockTranslations');
  return { useTranslation: mod.mockUseTranslation };
});

const MOCK_PROVIDER: Provider = {
  id: 'provider-1',
  name: 'my-provider',
  display_name: 'My Provider',
  endpoint: 'http://example.com',
  service_type: 'vm',
  schema_version: 'v1alpha1',
};

const MOCK_SERVICE_TYPE: ServiceType = {
  uid: 'st-1',
  service_type: 'vm',
  api_version: 'v1alpha1',
  spec: {},
};

const baseProvidersApi = {
  listProviders: jest.fn().mockResolvedValue({
    providers: [MOCK_PROVIDER],
    next_page_token: undefined,
  }),
  createProvider: jest.fn(),
  applyProvider: jest.fn(),
  deleteProvider: jest.fn(),
  getProvider: jest.fn(),
};

const baseCatalogApi = {
  listServiceTypes: jest
    .fn()
    .mockResolvedValue({ results: [MOCK_SERVICE_TYPE] }),
  listCatalogItems: jest.fn().mockResolvedValue({ results: [] }),
  listCatalogItemInstances: jest.fn().mockResolvedValue({ results: [] }),
  getCatalogItem: jest.fn(),
  getCatalogItemInstance: jest.fn(),
  getServiceType: jest.fn(),
  createServiceType: jest.fn(),
  createCatalogItem: jest.fn(),
  updateCatalogItem: jest.fn(),
  deleteCatalogItem: jest.fn(),
  createCatalogItemInstance: jest.fn(),
  deleteCatalogItemInstance: jest.fn(),
  rehydrateCatalogItemInstance: jest.fn(),
};

function buildApis(
  providerOverrides: Partial<typeof baseProvidersApi> = {},
  catalogOverrides: Partial<typeof baseCatalogApi> = {},
) {
  return {
    providers: { ...baseProvidersApi, ...providerOverrides },
    catalog: { ...baseCatalogApi, ...catalogOverrides },
  };
}

async function renderProvidersTab(
  apis: ReturnType<typeof buildApis> = buildApis(),
) {
  return renderInTestApp(
    <TestApiProvider
      apis={[
        [providersApiRef, apis.providers],
        [catalogApiRef, apis.catalog],
      ]}
    >
      <ProvidersTabContent />
    </TestApiProvider>,
  );
}

describe('ProvidersTabContent', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('initial load', () => {
    it('calls listProviders with pagination params on mount', async () => {
      const apis = buildApis();
      await renderProvidersTab(apis);

      await waitFor(() =>
        expect(apis.providers.listProviders).toHaveBeenCalledTimes(1),
      );
      expect(apis.providers.listProviders).toHaveBeenCalledWith(
        expect.objectContaining({ max_page_size: expect.any(Number) }),
      );
    });

    it('calls listServiceTypes with max_page_size: 100 for the dropdown (once on mount)', async () => {
      const apis = buildApis();
      await renderProvidersTab(apis);

      await waitFor(() =>
        expect(apis.catalog.listServiceTypes).toHaveBeenCalledTimes(1),
      );
      expect(apis.catalog.listServiceTypes).toHaveBeenCalledWith({
        max_page_size: 100,
      });
    });

    it('shows provider name in the table after successful load', async () => {
      const apis = buildApis();
      await renderProvidersTab(apis);

      expect(await screen.findByText('my-provider')).toBeInTheDocument();
    });

    it('shows the empty state when no providers are returned', async () => {
      const apis = buildApis({
        listProviders: jest.fn().mockResolvedValue({ providers: [] }),
      });
      await renderProvidersTab(apis);

      expect(
        await screen.findByText(/no providers registered/i),
      ).toBeInTheDocument();
    });
  });

  describe('load error', () => {
    it('shows an error alert when listProviders rejects', async () => {
      const apis = buildApis({
        listProviders: jest.fn().mockRejectedValue(new Error('API down')),
      });
      await renderProvidersTab(apis);

      expect(await screen.findByText(/API down/i)).toBeInTheDocument();
    });

    it('shows a Retry button when listProviders rejects', async () => {
      const apis = buildApis({
        listProviders: jest.fn().mockRejectedValue(new Error('API down')),
      });
      await renderProvidersTab(apis);

      expect(
        await screen.findByRole('button', { name: /retry/i }),
      ).toBeInTheDocument();
    });
  });

  describe('cursor pagination', () => {
    it('shows Next button when next_page_token is returned', async () => {
      const apis = buildApis({
        listProviders: jest.fn().mockResolvedValue({
          providers: [MOCK_PROVIDER],
          next_page_token: 'tok-2',
        }),
      });
      await renderProvidersTab(apis);

      expect(
        await screen.findByRole('button', { name: /next/i }),
      ).toBeInTheDocument();
    });

    it('Next button is disabled when no next_page_token', async () => {
      const apis = buildApis({
        listProviders: jest.fn().mockResolvedValue({
          providers: [MOCK_PROVIDER],
          next_page_token: '',
        }),
      });
      await renderProvidersTab(apis);

      const nextBtn = await screen.findByRole('button', { name: /next/i });
      expect(nextBtn).toBeDisabled();
    });

    it('calls listProviders with next_page_token after clicking Next', async () => {
      const listProviders = jest
        .fn()
        .mockResolvedValueOnce({
          providers: [MOCK_PROVIDER],
          next_page_token: 'tok-2',
        })
        .mockResolvedValueOnce({
          providers: [MOCK_PROVIDER],
          next_page_token: '',
        });
      const apis = buildApis({ listProviders });
      await renderProvidersTab(apis);

      const nextBtn = await screen.findByRole('button', { name: /next/i });
      fireEvent.click(nextBtn);

      await waitFor(() =>
        expect(listProviders).toHaveBeenCalledWith(
          expect.objectContaining({ page_token: 'tok-2' }),
        ),
      );
    });

    it('Previous button is disabled on the first page', async () => {
      const apis = buildApis({
        listProviders: jest.fn().mockResolvedValue({
          providers: [MOCK_PROVIDER],
          next_page_token: 'tok-2',
        }),
      });
      await renderProvidersTab(apis);

      const prevBtn = await screen.findByRole('button', { name: /previous/i });
      expect(prevBtn).toBeDisabled();
    });

    it('shows the current page size in the rows-per-page selector', async () => {
      const apis = buildApis();
      await renderProvidersTab(apis);

      await screen.findByText('my-provider');
      // The Select renders the selected value as "5 rows" via renderValue.
      expect(screen.getByText('5 rows')).toBeInTheDocument();
    });

    it('re-fetches with new max_page_size when the page-size option is selected', async () => {
      const listProviders = jest
        .fn()
        .mockResolvedValue({ providers: [MOCK_PROVIDER], next_page_token: '' });
      const apis = buildApis({ listProviders });
      await renderProvidersTab(apis);

      await screen.findByText('my-provider');
      expect(listProviders).toHaveBeenCalledTimes(1);

      // Open the MUI Select by clicking its trigger button (displays current size).
      // The trigger renders as a button inside the pagination controls.
      fireEvent.mouseDown(screen.getByRole('button', { name: /rows/i }));

      // Pick "10" from the opened dropdown menu.
      const option10 = await screen.findByRole('option', { name: '10' });
      fireEvent.click(option10);

      await waitFor(() =>
        expect(listProviders).toHaveBeenCalledWith(
          expect.objectContaining({ max_page_size: 10 }),
        ),
      );
    });

    it('Previous button is enabled after navigating to page 2', async () => {
      const listProviders = jest
        .fn()
        .mockResolvedValueOnce({
          providers: [MOCK_PROVIDER],
          next_page_token: 'tok-2',
        })
        .mockResolvedValueOnce({
          providers: [MOCK_PROVIDER],
          next_page_token: '',
        });
      const apis = buildApis({ listProviders });
      await renderProvidersTab(apis);

      const nextBtn = await screen.findByRole('button', { name: /next/i });
      fireEvent.click(nextBtn);

      await waitFor(() =>
        expect(
          screen.getByRole('button', { name: /previous/i }),
        ).not.toBeDisabled(),
      );
    });
  });
});
