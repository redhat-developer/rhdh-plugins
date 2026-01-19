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
import { PipelineRunItemRow } from '../PipelineRunItemRow';
import {
  PipelineRunResource,
  PipelineRunLabel,
  getApplicationFromResource,
  runStatus,
} from '@red-hat-developer-hub/backstage-plugin-konflux-common';
import { Entity } from '@backstage/catalog-model';
import { renderInTestApp, TestApiProvider } from '@backstage/test-utils';
import { Table, TableBody } from '@material-ui/core';
import { catalogApiRef, CatalogApi } from '@backstage/plugin-catalog-react';

jest.mock('../../../../utils/pipeline-runs', () => ({
  ...jest.requireActual('../../../../utils/pipeline-runs'),
  pipelineRunStatus: jest.fn(),
  calculateDuration: jest.fn(),
}));

jest.mock('../../../../utils/commits', () => ({
  ...jest.requireActual('../../../../utils/commits'),
  createCommitObjectFromPLR: jest.fn(),
}));

jest.mock('@red-hat-developer-hub/backstage-plugin-konflux-common', () => ({
  ...jest.requireActual(
    '@red-hat-developer-hub/backstage-plugin-konflux-common',
  ),
  getApplicationFromResource: jest.fn(),
}));
jest.mock('../../../../hooks/useEntitySubcomponents', () => ({
  useEntitySubcomponents: jest.fn(),
}));

import {
  pipelineRunStatus,
  calculateDuration,
} from '../../../../utils/pipeline-runs';
import { createCommitObjectFromPLR } from '../../../../utils/commits';
import { useEntitySubcomponents } from '../../../../hooks/useEntitySubcomponents';

const mockPipelineRunStatus = pipelineRunStatus as jest.MockedFunction<
  typeof pipelineRunStatus
>;
const mockCalculateDuration = calculateDuration as jest.MockedFunction<
  typeof calculateDuration
>;
const mockCreateCommitObjectFromPLR =
  createCommitObjectFromPLR as jest.MockedFunction<
    typeof createCommitObjectFromPLR
  >;
const mockGetApplicationFromResource =
  getApplicationFromResource as jest.MockedFunction<
    typeof getApplicationFromResource
  >;
const mockUseEntitySubcomponents =
  useEntitySubcomponents as jest.MockedFunction<typeof useEntitySubcomponents>;

mockUseEntitySubcomponents.mockReturnValue({
  subcomponentNames: ['subcomp1'],
  subcomponentEntities: [
    {
      apiVersion: 'backstage.io/v1alpha1',
      kind: 'Component',
      metadata: {
        name: 'subcomp1',
        namespace: 'default',
      },
    },
  ],
  loading: false,
  error: undefined,
});

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

const renderPipelinerunItemRow = async (
  pipelineRun: PipelineRunResource,
  hasSubcomponents = false,
) =>
  await renderInTestApp(
    <TestApiProvider apis={[[catalogApiRef, mockCatalogApi]]}>
      <Table>
        <TableBody>
          <PipelineRunItemRow
            pipelineRun={pipelineRun}
            hasSubcomponents={hasSubcomponents}
            entity={mockEntity}
          />
        </TableBody>
      </Table>
    </TestApiProvider>,
  );

describe('PipelineRunItemRow', () => {
  beforeEach(() => {
    mockUseEntitySubcomponents.mockReturnValue({
      subcomponentNames: ['subcomp1'],
      subcomponentEntities: [mockSubcomponentEntity],
      loading: false,
      error: undefined,
    });
    mockPipelineRunStatus.mockReturnValue(runStatus.Succeeded);
    mockCalculateDuration.mockReturnValue('1 hour');
    mockCreateCommitObjectFromPLR.mockReturnValue({
      sha: 'abc123',
      shaURL: 'https://github.com/test/repo/commit/abc123',
      eventType: 'push',
    } as any);
    mockGetApplicationFromResource.mockReturnValue('my-app');
  });

  afterEach(() => {
    jest.clearAllMocks();
    mockUseEntitySubcomponents.mockReturnValue({
      subcomponentNames: ['subcomp1'],
      subcomponentEntities: [mockSubcomponentEntity],
      loading: false,
      error: undefined,
    });
    mockPipelineRunStatus.mockReturnValue(runStatus.Succeeded);
    mockCalculateDuration.mockReturnValue('1 hour');
    mockCreateCommitObjectFromPLR.mockReturnValue({
      sha: 'abc123',
      shaURL: 'https://github.com/test/repo/commit/abc123',
      eventType: 'push',
    } as any);
    mockGetApplicationFromResource.mockReturnValue('my-app');
  });

  const createMockPipelineRun = (
    name: string,
    namespace: string,
    cluster: string,
    subcomponent: string,
  ): PipelineRunResource =>
    ({
      apiVersion: 'v1',
      apiGroup: 'tekton.dev',
      kind: 'PipelineRun',
      metadata: {
        name,
        namespace,
        labels: {
          [PipelineRunLabel.PIPELINE_TYPE]: 'build',
        },
      },
      subcomponent: { name: subcomponent },
      cluster: {
        name: cluster,
        konfluxUI: `https://${cluster}.example.com`,
      },
      status: {
        startTime: '2024-01-01T00:00:00Z',
        completionTime: '2024-01-01T01:00:00Z',
      },
    } as PipelineRunResource);

  it('should render pipeline run name', async () => {
    const pipelineRun = createMockPipelineRun(
      'my-plr',
      'test-namespace',
      'cluster1',
      'subcomp1',
    );

    await renderPipelinerunItemRow(pipelineRun, true);

    expect(screen.getByText('my-plr')).toBeInTheDocument();
  });

  it('should render pipeline run type', async () => {
    const pipelineRun = createMockPipelineRun(
      'my-plr',
      'test-namespace',
      'cluster1',
      'subcomp1',
    );

    await renderPipelinerunItemRow(pipelineRun, true);

    expect(screen.getByText('build')).toBeInTheDocument();
  });

  it('should render subcomponent when hasSubcomponents is true', async () => {
    const pipelineRun = createMockPipelineRun(
      'my-plr',
      'test-namespace',
      'cluster1',
      'subcomp1',
    );

    await renderPipelinerunItemRow(pipelineRun, true);

    expect(screen.getByText('subcomp1')).toBeInTheDocument();
  });

  it('should not render subcomponent when hasSubcomponents is false', async () => {
    const pipelineRun = createMockPipelineRun(
      'my-plr',
      'test-namespace',
      'cluster1',
      'subcomp1',
    );

    await renderPipelinerunItemRow(pipelineRun, false);

    expect(screen.queryByText('subcomp1')).not.toBeInTheDocument();
  });

  it('should render duration when status is not Pending', async () => {
    mockPipelineRunStatus.mockReturnValue(runStatus.Succeeded);

    const pipelineRun = createMockPipelineRun(
      'my-plr',
      'test-namespace',
      'cluster1',
      'subcomp1',
    );

    await renderPipelinerunItemRow(pipelineRun, true);

    expect(mockCalculateDuration).toHaveBeenCalled();
    expect(screen.getByText('1 hour')).toBeInTheDocument();
  });

  it('should render "-" for duration when status is Pending', async () => {
    mockPipelineRunStatus.mockReturnValue(runStatus.Pending);

    const pipelineRun = createMockPipelineRun(
      'my-plr',
      'test-namespace',
      'cluster1',
      'subcomp1',
    );

    await renderPipelinerunItemRow(pipelineRun, true);

    const cells = screen.getAllByText('-');
    expect(cells.length).toBeGreaterThan(0);
    expect(cells[cells.length - 1]).toBeInTheDocument();
  });
});
