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

import { renderInTestApp } from '@backstage/test-utils';
import { Table, TableBody } from '@material-ui/core';
import {
  PipelineRunLabel,
  ReleaseResource,
  runStatus,
} from '@red-hat-developer-hub/backstage-plugin-konflux-common';
import { LatestReleaseItemRow } from '../LatestReleaseItemRow';
import { Entity } from '@backstage/catalog-model';
import { useReleaseStatus } from '../../../../hooks/useReleaseStatus';
import { useEntitySubcomponents } from '../../../../hooks/useEntitySubcomponents';

jest.mock('../../../../hooks/useReleaseStatus', () => ({
  useReleaseStatus: jest.fn(),
}));
jest.mock('../../../../hooks/useEntitySubcomponents', () => ({
  useEntitySubcomponents: jest.fn(),
}));
jest.mock('@backstage/plugin-catalog-react', () => ({
  ...jest.requireActual('@backstage/plugin-catalog-react'),
  useEntity: jest.fn(),
  useRelatedEntities: jest.fn().mockReturnValue({
    entities: [],
    loading: false,
    error: undefined,
  }),
}));
const mockUseReleaseStatus = useReleaseStatus as jest.Mock;
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

const renderLatestReleaseItemRow = async (
  release: ReleaseResource,
  hasSubcomponents = false,
) =>
  await renderInTestApp(
    <Table>
      <TableBody>
        <LatestReleaseItemRow
          entity={mockEntity}
          release={release}
          hasSubcomponents={hasSubcomponents}
        />
      </TableBody>
    </Table>,
  );

describe('LatestReleaseItemRow', () => {
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

  const createMockRelease = (
    name: string,
    application: string,
    subcomponent: string,
    cluster: string,
  ): ReleaseResource => ({
    apiVersion: 'v1',
    apiGroup: 'appstudio.redhat.com',
    kind: 'Release',
    metadata: {
      name,
      namespace: 'test-namespace',
      labels: {
        [PipelineRunLabel.APPLICATION]: application,
      },
    },
    application,
    subcomponent: { name: subcomponent },
    cluster: { name: cluster },
  });

  it('should render release name', async () => {
    const release = createMockRelease(
      'my-release',
      'my-app',
      'subcomp1',
      'cluster1',
    );

    await renderLatestReleaseItemRow(release, true);

    expect(screen.getByText('my-release')).toBeInTheDocument();
  });

  it('should render application name', async () => {
    const release = createMockRelease(
      'my-release',
      'my-app',
      'subcomp1',
      'cluster1',
    );

    await renderLatestReleaseItemRow(release, true);

    expect(screen.getByText('my-app')).toBeInTheDocument();
  });

  it('should render subcomponent when hasSubcomponents is true', async () => {
    const release = createMockRelease(
      'my-release',
      'my-app',
      'subcomp1',
      'cluster1',
    );

    await renderLatestReleaseItemRow(release, true);

    expect(screen.getByText('subcomp1')).toBeInTheDocument();
  });

  it('should not render subcomponent when hasSubcomponents is false', async () => {
    const release = createMockRelease(
      'my-release',
      'my-app',
      'subcomp1',
      'cluster1',
    );

    await renderLatestReleaseItemRow(release, false);

    expect(screen.queryByText('subcomp1')).not.toBeInTheDocument();
  });

  it('should render release status', async () => {
    mockUseReleaseStatus.mockReturnValue(runStatus.Succeeded);
    const release = createMockRelease(
      'my-release',
      'my-app',
      'subcomp1',
      'cluster1',
    );

    await renderLatestReleaseItemRow(release, false);

    expect(screen.getByText(runStatus.Succeeded)).toBeInTheDocument();
  });
});
