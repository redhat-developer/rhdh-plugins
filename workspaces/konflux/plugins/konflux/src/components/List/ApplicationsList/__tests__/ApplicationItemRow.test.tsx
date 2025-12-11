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

import { screen } from '@testing-library/react';
import { ApplicationItemRow } from '../ApplicationItemRow';
import { ApplicationResource } from '@red-hat-developer-hub/backstage-plugin-konflux-common';
import { Entity } from '@backstage/catalog-model';
import { renderInTestApp, TestApiProvider } from '@backstage/test-utils';
import { Table, TableBody } from '@material-ui/core';
import { catalogApiRef, CatalogApi } from '@backstage/plugin-catalog-react';
import { useEntitySubcomponents } from '../../../../hooks/useEntitySubcomponents';

jest.mock('../../../../hooks/useEntitySubcomponents', () => ({
  useEntitySubcomponents: jest.fn(),
}));

const mockUseEntitySubcomponents =
  useEntitySubcomponents as jest.MockedFunction<typeof useEntitySubcomponents>;

const mockEntity: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'Component',
  metadata: {
    name: 'test-entity',
    namespace: 'default',
  },
};

const mockSubcomponentEntity: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'Component',
  metadata: {
    name: 'subcomp1',
    namespace: 'default',
  },
};

const mockCatalogApi: Partial<CatalogApi> = {
  getEntities: jest.fn().mockResolvedValue({ items: [] }),
  getEntityByRef: jest.fn().mockResolvedValue(mockEntity),
};

const renderApplicationItemRow = async (
  application: ApplicationResource,
  hasSubcomponents = false,
) =>
  await renderInTestApp(
    <TestApiProvider apis={[[catalogApiRef, mockCatalogApi]]}>
      <Table>
        <TableBody>
          <ApplicationItemRow
            application={application}
            hasSubcomponents={hasSubcomponents}
            entity={mockEntity}
          />
        </TableBody>
      </Table>
    </TestApiProvider>,
  );

describe('ApplicationItemRow', () => {
  beforeEach(() => {
    mockUseEntitySubcomponents.mockReturnValue({
      subcomponentNames: ['subcomp1'],
      subcomponentEntities: [mockSubcomponentEntity],
      loading: false,
      error: undefined,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const createMockApplication = (
    name: string,
    namespace: string,
    cluster: string,
    subcomponent: string,
  ): ApplicationResource => ({
    apiVersion: 'v1',
    apiGroup: 'appstudio.redhat.com',
    kind: 'Application',
    metadata: {
      name,
      namespace,
    },
    subcomponent: { name: subcomponent },
    cluster: {
      name: cluster,
      konfluxUI: `https://${cluster}.example.com`,
    },
  });

  it('should render application name', async () => {
    const application = createMockApplication(
      'my-app',
      'test-namespace',
      'cluster1',
      'subcomp1',
    );

    await renderApplicationItemRow(application, true);

    expect(screen.getByText('my-app')).toBeInTheDocument();
  });

  it('should render subcomponent when hasSubcomponents is true', async () => {
    const application = createMockApplication(
      'my-app',
      'test-namespace',
      'cluster1',
      'subcomp1',
    );

    await renderApplicationItemRow(application, true);

    expect(screen.getByText('subcomp1')).toBeInTheDocument();
  });

  it('should not render subcomponent when hasSubcomponents is false', async () => {
    const application = createMockApplication(
      'my-app',
      'test-namespace',
      'cluster1',
      'subcomp1',
    );

    await renderApplicationItemRow(application, false);

    expect(screen.queryByText('subcomp1')).not.toBeInTheDocument();
    expect(screen.getByText('my-app')).toBeInTheDocument();
  });

  it('should render namespace and cluster', async () => {
    const application = createMockApplication(
      'my-app',
      'test-namespace',
      'cluster1',
      'subcomp1',
    );

    await renderApplicationItemRow(application, true);

    expect(screen.getByText('test-namespace')).toBeInTheDocument();
    expect(screen.getByText('cluster1')).toBeInTheDocument();
  });

  it('should handle missing metadata gracefully', async () => {
    const application: ApplicationResource = {
      apiVersion: 'v1',
      apiGroup: 'appstudio.redhat.com',
      kind: 'Application',
      metadata: {},
      subcomponent: { name: 'subcomp1' },
      cluster: { name: 'cluster1' },
    };

    await renderApplicationItemRow(application, true);

    // Should render without crashing
    expect(screen.getByText('subcomp1')).toBeInTheDocument();
  });
});
