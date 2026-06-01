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

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TestApiProvider, renderInTestApp } from '@backstage/test-utils';
import { catalogApiRef } from '../../apis';
import { ServiceTypesTabContent } from './ServiceTypesTabContent';

const MOCK_SERVICE_TYPES = [
  {
    uid: 'st-1',
    service_type: 'vm',
    api_version: 'v1alpha1',
    path: '/vm',
    create_time: '2024-01-01T00:00:00Z',
  },
  {
    uid: 'st-2',
    service_type: 'container',
    api_version: 'v1',
    path: '/container',
    create_time: undefined,
  },
];

function renderWith(mockCatalogApi: { listServiceTypes: jest.Mock }) {
  return render(
    <TestApiProvider apis={[[catalogApiRef, mockCatalogApi]]}>
      <ServiceTypesTabContent />
    </TestApiProvider>,
  );
}

async function renderWithApp(mockCatalogApi: { listServiceTypes: jest.Mock }) {
  return renderInTestApp(
    <TestApiProvider apis={[[catalogApiRef, mockCatalogApi]]}>
      <ServiceTypesTabContent />
    </TestApiProvider>,
  );
}

describe('ServiceTypesTabContent', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('load error', () => {
    it('shows an error alert when the API rejects', async () => {
      const mockApi = {
        listServiceTypes: jest
          .fn()
          .mockRejectedValue(new Error('Service unavailable')),
      };
      renderWith(mockApi);

      await waitFor(() =>
        expect(screen.getByText(/Service unavailable/i)).toBeInTheDocument(),
      );
    });

    it('shows a Retry button when the API rejects', async () => {
      const mockApi = {
        listServiceTypes: jest
          .fn()
          .mockRejectedValue(new Error('Service unavailable')),
      };
      renderWith(mockApi);

      await waitFor(() =>
        expect(
          screen.getByRole('button', { name: /retry/i }),
        ).toBeInTheDocument(),
      );
    });

    it('re-calls listServiceTypes when Retry is clicked', async () => {
      const mockApi = {
        listServiceTypes: jest
          .fn()
          .mockRejectedValue(new Error('Service unavailable')),
      };
      renderWith(mockApi);

      const retryBtn = await screen.findByRole('button', { name: /retry/i });
      fireEvent.click(retryBtn);

      await waitFor(() =>
        expect(mockApi.listServiceTypes).toHaveBeenCalledTimes(2),
      );
    });
  });

  describe('successful load', () => {
    it('does not show an error alert when the API succeeds', async () => {
      const mockApi = {
        listServiceTypes: jest
          .fn()
          .mockResolvedValue({ results: MOCK_SERVICE_TYPES }),
      };
      await renderWithApp(mockApi);

      await waitFor(() =>
        expect(mockApi.listServiceTypes).toHaveBeenCalledTimes(1),
      );

      // Error UI must not be present after a successful load
      expect(
        screen.queryByRole('button', { name: /retry/i }),
      ).not.toBeInTheDocument();
    });

    it('calls listServiceTypes on mount', async () => {
      const mockApi = {
        listServiceTypes: jest
          .fn()
          .mockResolvedValue({ results: MOCK_SERVICE_TYPES }),
      };
      await renderWithApp(mockApi);

      await waitFor(() =>
        expect(mockApi.listServiceTypes).toHaveBeenCalledTimes(1),
      );
    });
  });

  describe('empty state', () => {
    it('shows the empty state message when no service types are returned', async () => {
      const mockApi = {
        listServiceTypes: jest.fn().mockResolvedValue({ results: [] }),
      };
      renderWith(mockApi);

      await waitFor(() =>
        expect(
          screen.getByText(/no service types defined/i),
        ).toBeInTheDocument(),
      );
    });

    it('does not show an error alert when the list is empty', async () => {
      const mockApi = {
        listServiceTypes: jest.fn().mockResolvedValue({ results: [] }),
      };
      renderWith(mockApi);

      await waitFor(() =>
        expect(
          screen.getByText(/no service types defined/i),
        ).toBeInTheDocument(),
      );
      expect(
        screen.queryByRole('button', { name: /retry/i }),
      ).not.toBeInTheDocument();
    });
  });
});
