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
import { CommitItemRow } from '../CommitItemRow';
import { Commit, pipelineRunStatus } from '../../../../utils/pipeline-runs';
import {
  PipelineRunResource,
  runStatus,
} from '@red-hat-developer-hub/backstage-plugin-konflux-common';
import { Entity } from '@backstage/catalog-model';
import { renderInTestApp, TestApiProvider } from '@backstage/test-utils';
import { Table, TableBody } from '@material-ui/core';
import { catalogApiRef, CatalogApi } from '@backstage/plugin-catalog-react';
import { getCommitSha, createRepoBranchURL } from '../../../../utils/commits';
import { useEntitySubcomponents } from '../../../../hooks/useEntitySubcomponents';

// Mock the pipelineRunStatus function
jest.mock('../../../../utils/pipeline-runs', () => ({
  ...jest.requireActual('../../../../utils/pipeline-runs'),
  pipelineRunStatus: jest.fn(),
}));

jest.mock('../../../../utils/commits', () => ({
  ...jest.requireActual('../../../../utils/commits'),
  getCommitSha: jest.fn(),
  createRepoBranchURL: jest.fn(),
  statuses: [
    'Running',
    'In Progress',
    'Pending',
    'Succeeded',
    'Failed',
    'Cancelled',
    'Unknown',
  ],
}));
jest.mock('../../../../hooks/useEntitySubcomponents', () => ({
  useEntitySubcomponents: jest.fn(),
}));

const mockPipelineRunStatus = pipelineRunStatus as jest.MockedFunction<
  typeof pipelineRunStatus
>;
const mockGetCommitSha = getCommitSha as jest.MockedFunction<
  typeof getCommitSha
>;
const mockCreateRepoBranchURL = createRepoBranchURL as jest.MockedFunction<
  typeof createRepoBranchURL
>;
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

const renderCommitItemRow = async (commit: Commit, hasSubcomponents = false) =>
  await renderInTestApp(
    <TestApiProvider apis={[[catalogApiRef, mockCatalogApi]]}>
      <Table>
        <TableBody>
          <CommitItemRow
            commit={commit}
            pipelineRuns={[]}
            entity={mockEntity}
            hasSubcomponents={hasSubcomponents}
          />
        </TableBody>
      </Table>
    </TestApiProvider>,
  );

describe('CommitItemRow', () => {
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

  const createMockCommit = (
    sha: string,
    shaTitle: string,
    application: string,
    subcomponent: string,
    cluster: string,
  ): Commit => ({
    apiVersion: 'v1',
    apiGroup: 'appstudio.redhat.com',
    kind: 'Commit',
    metadata: {
      name: sha,
      namespace: 'test-namespace',
      uid: sha,
    },
    sha,
    shaURL: `https://github.com/test/repo/commit/${sha}`,
    shaTitle,
    branch: 'main',
    components: ['comp1'],
    application,
    subcomponent: { name: subcomponent },
    cluster: { name: cluster },
    isPullRequest: false,
    pipelineRuns: [
      {
        apiVersion: 'v1',
        kind: 'PipelineRun',
        metadata: { name: 'plr1' },
        status: { startTime: '2024-01-01T00:00:00Z' },
        cluster: {
          name: 'cluster_1',
        },
        subcomponent: {
          name: 'sub1',
        },
      } as PipelineRunResource,
    ],
    status: {
      startTime: '2024-01-01T00:00:00Z',
    },
  });

  beforeEach(() => {
    mockPipelineRunStatus.mockReturnValue(runStatus.Succeeded);
    mockGetCommitSha.mockReturnValue('abc123');
    mockCreateRepoBranchURL.mockReturnValue(
      'https://github.com/test/repo/tree/main',
    );
  });

  it('should render commit sha title', async () => {
    const commit = createMockCommit(
      'abc123',
      'Test commit',
      'my-app',
      'subcomp1',
      'cluster1',
    );

    await renderCommitItemRow(commit, true);

    expect(screen.getByText('Test commit')).toBeInTheDocument();
  });

  it('should render application name', async () => {
    const commit = createMockCommit(
      'abc123',
      'Test commit',
      'my-app',
      'subcomp1',
      'cluster1',
    );

    await renderCommitItemRow(commit, true);

    expect(screen.getByText('my-app')).toBeInTheDocument();
  });

  it('should render subcomponent when hasSubcomponents is true', async () => {
    const commit = createMockCommit(
      'abc123',
      'Test commit',
      'my-app',
      'subcomp1',
      'cluster1',
    );

    await renderCommitItemRow(commit, true);

    expect(screen.getByText('subcomp1')).toBeInTheDocument();
  });

  it('should not render subcomponent when hasSubcomponents is false', async () => {
    const commit = createMockCommit(
      'abc123',
      'Test commit',
      'my-app',
      'subcomp1',
      'cluster1',
    );

    await renderCommitItemRow(commit, false);

    expect(screen.queryByText('subcomp1')).not.toBeInTheDocument();
  });

  it('should render pull request number when isPullRequest is true', async () => {
    const commit: Commit = {
      ...createMockCommit(
        'abc123',
        'Test commit',
        'my-app',
        'subcomp1',
        'cluster1',
      ),
      isPullRequest: true,
      pullRequestNumber: '123',
    };

    await renderCommitItemRow(commit, true);

    // PR number is rendered as "#123 Test commit"
    expect(screen.getByText(/#123 Test commit/)).toBeInTheDocument();
  });

  it('should render branch name', async () => {
    const commit = createMockCommit(
      'abc123',
      'Test commit',
      'my-app',
      'subcomp1',
      'cluster1',
    );

    await renderCommitItemRow(commit, true);

    expect(screen.getByText('main')).toBeInTheDocument();
  });
});
