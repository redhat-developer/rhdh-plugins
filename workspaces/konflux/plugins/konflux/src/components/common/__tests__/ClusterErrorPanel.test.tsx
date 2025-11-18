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

import { screen, waitFor } from '@testing-library/react';
import { ClusterErrorPanel } from '../ClusterErrorPanel';
import {
  EntityProvider,
  catalogApiRef,
  CatalogApi,
} from '@backstage/plugin-catalog-react';
import { Entity } from '@backstage/catalog-model';
import { ClusterError } from '@red-hat-developer-hub/backstage-plugin-konflux-common';
import {
  TestApiProvider,
  renderInTestApp,
  mockApis,
} from '@backstage/test-utils';
import { errorApiRef } from '@backstage/core-plugin-api';
import { translationApiRef } from '@backstage/core-plugin-api/alpha';

const mockEntity: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'Component',
  metadata: {
    name: 'test-entity',
    namespace: 'default',
  },
};

const mockCatalogApi: Partial<CatalogApi> = {
  getEntities: jest.fn().mockResolvedValue({ items: [] }),
  getEntityByRef: jest.fn().mockResolvedValue(mockEntity),
};

const mockErrorApi = {
  post: jest.fn(),
  error$: jest.fn(),
};

const renderClusterErrorPanel = async (errors: ClusterError[]) => {
  return await renderInTestApp(
    <TestApiProvider
      apis={[
        [catalogApiRef, mockCatalogApi],
        [errorApiRef, mockErrorApi],
        [translationApiRef, mockApis.translation()],
      ]}
    >
      <EntityProvider entity={mockEntity}>
        <ClusterErrorPanel errors={errors} />
      </EntityProvider>
    </TestApiProvider>,
  );
};

describe('ClusterErrorPanel', () => {
  it('should return null when errors array is empty', async () => {
    const { container } = await renderClusterErrorPanel([]);
    expect(container.firstChild).toBeNull();
  });

  it('should return null when errors is undefined', async () => {
    const { container } = await renderInTestApp(
      <TestApiProvider
        apis={[
          [catalogApiRef, mockCatalogApi],
          [errorApiRef, mockErrorApi],
          [translationApiRef, mockApis.translation()],
        ]}
      >
        <EntityProvider entity={mockEntity}>
          <ClusterErrorPanel errors={undefined as any} />
        </EntityProvider>
      </TestApiProvider>,
    );
    expect(container.firstChild).toBeNull();
  });

  it('should render WarningPanel with correct title and message', async () => {
    const errors: ClusterError[] = [
      {
        cluster: 'cluster1',
        namespace: 'namespace1',
        message: 'Test error',
      },
    ];

    await renderClusterErrorPanel(errors);

    await waitFor(() => {
      expect(
        screen.getByText(
          'Warning: Failed to retrieve resources from all clusters',
        ),
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          'Unable to fetch resources for entity: test-entity. All cluster requests failed.',
        ),
      ).toBeInTheDocument();
    });
  });

  it('should display single error message correctly', async () => {
    const errors: ClusterError[] = [
      {
        cluster: 'cluster1',
        namespace: 'namespace1',
        message: 'Access denied',
        errorType: 'Forbidden',
        statusCode: 403,
        source: 'kubernetes',
      },
    ];

    await renderClusterErrorPanel(errors);

    await waitFor(() => {
      expect(screen.getByText('Cluster Errors:')).toBeInTheDocument();
      expect(screen.getByText('Access denied')).toBeInTheDocument();
      expect(
        screen.getByText(
          'Cluster: cluster1 | Namespace: namespace1 | Type: Forbidden | Status: 403 | Source: kubernetes',
        ),
      ).toBeInTheDocument();
    });
  });

  it('should display multiple error messages correctly', async () => {
    const errors: ClusterError[] = [
      {
        cluster: 'cluster1',
        namespace: 'namespace1',
        message: 'Error 1',
        errorType: 'Forbidden',
        statusCode: 403,
      },
      {
        cluster: 'cluster2',
        namespace: 'namespace2',
        message: 'Error 2',
        errorType: 'NotFound',
        statusCode: 404,
      },
    ];

    await renderClusterErrorPanel(errors);

    await waitFor(() => {
      expect(screen.getByText('Error 1')).toBeInTheDocument();
      expect(screen.getByText('Error 2')).toBeInTheDocument();
      expect(
        screen.getByText(
          'Cluster: cluster1 | Namespace: namespace1 | Type: Forbidden | Status: 403',
        ),
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          'Cluster: cluster2 | Namespace: namespace2 | Type: NotFound | Status: 404',
        ),
      ).toBeInTheDocument();
    });
  });

  it('should handle missing optional fields gracefully', async () => {
    const errors: ClusterError[] = [
      {
        cluster: 'cluster1',
        namespace: 'namespace1',
        message: 'Error message',
      },
    ];

    await renderClusterErrorPanel(errors);

    await waitFor(() => {
      expect(screen.getByText('Error message')).toBeInTheDocument();
      expect(
        screen.getByText('Cluster: cluster1 | Namespace: namespace1'),
      ).toBeInTheDocument();
    });
  });

  it('should display "Unknown error" when message is missing', async () => {
    const errors: ClusterError[] = [
      {
        cluster: 'cluster1',
        namespace: 'namespace1',
      },
    ];

    await renderClusterErrorPanel(errors);

    await waitFor(() => {
      expect(screen.getByText('Unknown error')).toBeInTheDocument();
    });
  });

  it('should format error details correctly with all fields', async () => {
    const errors: ClusterError[] = [
      {
        cluster: 'cluster1',
        namespace: 'namespace1',
        message: 'Full error',
        errorType: 'InternalServerError',
        statusCode: 500,
        source: 'kubearchive',
      },
    ];

    await renderClusterErrorPanel(errors);

    await waitFor(() => {
      expect(
        screen.getByText(
          'Cluster: cluster1 | Namespace: namespace1 | Type: InternalServerError | Status: 500 | Source: kubearchive',
        ),
      ).toBeInTheDocument();
    });
  });

  it('should handle errors with only cluster and namespace', async () => {
    const errors: ClusterError[] = [
      {
        cluster: 'cluster1',
        namespace: 'namespace1',
      },
    ];

    await renderClusterErrorPanel(errors);

    await waitFor(() => {
      expect(screen.getByText('Unknown error')).toBeInTheDocument();
      expect(
        screen.getByText('Cluster: cluster1 | Namespace: namespace1'),
      ).toBeInTheDocument();
    });
  });

  it('should use entity name from useEntity hook', async () => {
    const customEntity: Entity = {
      apiVersion: 'backstage.io/v1alpha1',
      kind: 'Component',
      metadata: {
        name: 'custom-entity-name',
        namespace: 'default',
      },
    };

    const errors: ClusterError[] = [
      {
        cluster: 'cluster1',
        namespace: 'namespace1',
        message: 'Test error',
      },
    ];

    await renderInTestApp(
      <TestApiProvider
        apis={[
          [catalogApiRef, mockCatalogApi],
          [errorApiRef, mockErrorApi],
          [translationApiRef, mockApis.translation()],
        ]}
      >
        <EntityProvider entity={customEntity}>
          <ClusterErrorPanel errors={errors} />
        </EntityProvider>
      </TestApiProvider>,
    );

    await waitFor(() => {
      expect(
        screen.getByText(
          'Unable to fetch resources for entity: custom-entity-name. All cluster requests failed.',
        ),
      ).toBeInTheDocument();
    });
  });
});
