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
import type { ServiceTypeInstance } from '@red-hat-developer-hub/backstage-plugin-dcm-common';
import { resourcesApiRef } from '../../apis';
import { ResourcesTabContent } from './ResourcesTabContent';

jest.mock('../../hooks/useTranslation', () => {
  const mod = require('../../test-utils/mockTranslations');
  return { useTranslation: mod.mockUseTranslation };
});

const MOCK_INSTANCE: ServiceTypeInstance = {
  id: 'inst-1',
  provider_name: 'my-provider',
  status: 'active',
  spec: { service_type: 'vm' },
};

const baseResourcesApi = {
  listServiceTypeInstances: jest.fn().mockResolvedValue({
    instances: [MOCK_INSTANCE],
    next_page_token: undefined,
  }),
};

function buildApi(overrides: Partial<typeof baseResourcesApi> = {}) {
  return { ...baseResourcesApi, ...overrides };
}

async function renderResourcesTab(
  mockApi: ReturnType<typeof buildApi> = buildApi(),
) {
  return renderInTestApp(
    <TestApiProvider apis={[[resourcesApiRef, mockApi]]}>
      <ResourcesTabContent />
    </TestApiProvider>,
  );
}

describe('ResourcesTabContent', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('initial load', () => {
    it('calls listServiceTypeInstances with pagination params on mount', async () => {
      const mockApi = buildApi();
      await renderResourcesTab(mockApi);

      await waitFor(() =>
        expect(mockApi.listServiceTypeInstances).toHaveBeenCalledTimes(1),
      );
      expect(mockApi.listServiceTypeInstances).toHaveBeenCalledWith(
        expect.objectContaining({ max_page_size: expect.any(Number) }),
      );
    });

    it('shows instance id in the table after successful load', async () => {
      const mockApi = buildApi();
      await renderResourcesTab(mockApi);

      expect(await screen.findByText('inst-1')).toBeInTheDocument();
    });

    it('shows the empty state when no instances are returned', async () => {
      const mockApi = buildApi({
        listServiceTypeInstances: jest
          .fn()
          .mockResolvedValue({ instances: [] }),
      });
      await renderResourcesTab(mockApi);

      expect(
        await screen.findByText(/no resources found/i),
      ).toBeInTheDocument();
    });
  });

  describe('load error', () => {
    it('shows an error alert when listServiceTypeInstances rejects', async () => {
      const mockApi = buildApi({
        listServiceTypeInstances: jest
          .fn()
          .mockRejectedValue(new Error('Resources unavailable')),
      });
      await renderResourcesTab(mockApi);

      expect(
        await screen.findByText(/Resources unavailable/i),
      ).toBeInTheDocument();
    });

    it('shows a Retry button when the API rejects', async () => {
      const mockApi = buildApi({
        listServiceTypeInstances: jest
          .fn()
          .mockRejectedValue(new Error('Resources unavailable')),
      });
      await renderResourcesTab(mockApi);

      expect(
        await screen.findByRole('button', { name: /retry/i }),
      ).toBeInTheDocument();
    });

    it('re-calls listServiceTypeInstances when Retry is clicked', async () => {
      const listServiceTypeInstances = jest
        .fn()
        .mockRejectedValue(new Error('Resources unavailable'));
      const mockApi = buildApi({ listServiceTypeInstances });
      await renderResourcesTab(mockApi);

      const retryBtn = await screen.findByRole('button', { name: /retry/i });
      fireEvent.click(retryBtn);

      await waitFor(() =>
        expect(listServiceTypeInstances).toHaveBeenCalledTimes(2),
      );
    });
  });

  describe('cursor pagination', () => {
    it('shows Next button when next_page_token is returned', async () => {
      const mockApi = buildApi({
        listServiceTypeInstances: jest.fn().mockResolvedValue({
          instances: [MOCK_INSTANCE],
          next_page_token: 'tok-2',
        }),
      });
      await renderResourcesTab(mockApi);

      expect(
        await screen.findByRole('button', { name: /next/i }),
      ).toBeInTheDocument();
    });

    it('Next button is disabled when no next_page_token', async () => {
      const mockApi = buildApi({
        listServiceTypeInstances: jest.fn().mockResolvedValue({
          instances: [MOCK_INSTANCE],
          next_page_token: '',
        }),
      });
      await renderResourcesTab(mockApi);

      const nextBtn = await screen.findByRole('button', { name: /next/i });
      expect(nextBtn).toBeDisabled();
    });

    it('calls listServiceTypeInstances with next_page_token after clicking Next', async () => {
      const listServiceTypeInstances = jest
        .fn()
        .mockResolvedValueOnce({
          instances: [MOCK_INSTANCE],
          next_page_token: 'tok-2',
        })
        .mockResolvedValueOnce({
          instances: [MOCK_INSTANCE],
          next_page_token: '',
        });
      const mockApi = buildApi({ listServiceTypeInstances });
      await renderResourcesTab(mockApi);

      const nextBtn = await screen.findByRole('button', { name: /next/i });
      fireEvent.click(nextBtn);

      await waitFor(() =>
        expect(listServiceTypeInstances).toHaveBeenCalledWith(
          expect.objectContaining({ page_token: 'tok-2' }),
        ),
      );
    });

    it('Previous button is disabled on the first page', async () => {
      const mockApi = buildApi({
        listServiceTypeInstances: jest.fn().mockResolvedValue({
          instances: [MOCK_INSTANCE],
          next_page_token: 'tok-2',
        }),
      });
      await renderResourcesTab(mockApi);

      const prevBtn = await screen.findByRole('button', { name: /previous/i });
      expect(prevBtn).toBeDisabled();
    });

    it('Previous button is enabled after navigating to page 2', async () => {
      const listServiceTypeInstances = jest
        .fn()
        .mockResolvedValueOnce({
          instances: [MOCK_INSTANCE],
          next_page_token: 'tok-2',
        })
        .mockResolvedValueOnce({
          instances: [MOCK_INSTANCE],
          next_page_token: '',
        });
      const mockApi = buildApi({ listServiceTypeInstances });
      await renderResourcesTab(mockApi);

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
