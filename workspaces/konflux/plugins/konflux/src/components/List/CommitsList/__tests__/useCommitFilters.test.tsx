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

import { renderHook } from '@testing-library/react';
import { useCommitFilters } from '../useCommitFilters';
import { Commit, pipelineRunStatus } from '../../../../utils/pipeline-runs';
import {
  PipelineRunResource,
  runStatus,
} from '@red-hat-developer-hub/backstage-plugin-konflux-common';

// Mock the pipelineRunStatus function
jest.mock('../../../../utils/pipeline-runs', () => ({
  ...jest.requireActual('../../../../utils/pipeline-runs'),
  pipelineRunStatus: jest.fn(),
}));

const mockPipelineRunStatus = pipelineRunStatus as jest.MockedFunction<
  typeof pipelineRunStatus
>;

describe('useCommitFilters', () => {
  const createMockCommit = (
    sha: string,
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
    branch: 'main',
    components: ['comp1'],
    application: 'app1',
    subcomponent: { name: subcomponent },
    cluster: { name: cluster },
    isPullRequest: false,
    pipelineRuns: [
      {
        metadata: { name: 'plr1' },
      } as PipelineRunResource,
    ],
  });

  beforeEach(() => {
    mockPipelineRunStatus.mockReturnValue(runStatus.Succeeded);
  });

  it('should return empty arrays when commits is undefined', () => {
    const { result } = renderHook(() =>
      useCommitFilters({
        commits: undefined,
        hasSubcomponents: true,
      }),
    );

    expect(result.current.uniqueSubcomponents).toEqual([]);
    expect(result.current.uniqueClusters).toEqual([]);
    expect(result.current.uniquePipelineRunStatuses).toEqual([]);
  });

  it('should return empty arrays when commits is empty', () => {
    const { result } = renderHook(() =>
      useCommitFilters({
        commits: [],
        hasSubcomponents: true,
      }),
    );

    expect(result.current.uniqueSubcomponents).toEqual([]);
    expect(result.current.uniqueClusters).toEqual([]);
    expect(result.current.uniquePipelineRunStatuses).toEqual([]);
  });

  it('should extract unique subcomponents, clusters, and statuses', () => {
    mockPipelineRunStatus
      .mockReturnValueOnce(runStatus.Succeeded)
      .mockReturnValueOnce(runStatus.Failed)
      .mockReturnValueOnce(runStatus.Succeeded);

    const commits = [
      createMockCommit('sha1', 'subcomp1', 'cluster1'),
      createMockCommit('sha2', 'subcomp1', 'cluster2'),
      createMockCommit('sha3', 'subcomp2', 'cluster1'),
    ];

    const { result } = renderHook(() =>
      useCommitFilters({
        commits,
        hasSubcomponents: true,
      }),
    );

    expect(result.current.uniqueSubcomponents).toEqual([
      'subcomp1',
      'subcomp2',
    ]);
    expect(result.current.uniqueClusters).toEqual(['cluster1', 'cluster2']);
    expect(result.current.uniquePipelineRunStatuses).toEqual([
      'Failed',
      'Succeeded',
    ]);
  });

  it('should remove duplicates and sort results', () => {
    mockPipelineRunStatus
      .mockReturnValueOnce(runStatus.Succeeded)
      .mockReturnValueOnce(runStatus.Failed)
      .mockReturnValueOnce(runStatus.Succeeded)
      .mockReturnValueOnce(runStatus.Failed);

    const commits = [
      createMockCommit('sha1', 'subcomp2', 'cluster2'),
      createMockCommit('sha2', 'subcomp1', 'cluster1'),
      createMockCommit('sha3', 'subcomp2', 'cluster1'),
      createMockCommit('sha4', 'subcomp1', 'cluster2'),
    ];

    const { result } = renderHook(() =>
      useCommitFilters({
        commits,
        hasSubcomponents: true,
      }),
    );

    expect(result.current.uniqueSubcomponents).toEqual([
      'subcomp1',
      'subcomp2',
    ]);
    expect(result.current.uniqueClusters).toEqual(['cluster1', 'cluster2']);
    expect(result.current.uniquePipelineRunStatuses).toEqual([
      'Failed',
      'Succeeded',
    ]);
  });

  it('should return empty subcomponents when hasSubcomponents is false', () => {
    mockPipelineRunStatus.mockReturnValue(runStatus.Succeeded);

    const commits = [
      createMockCommit('sha1', 'subcomp1', 'cluster1'),
      createMockCommit('sha2', 'subcomp2', 'cluster2'),
    ];

    const { result } = renderHook(() =>
      useCommitFilters({
        commits,
        hasSubcomponents: false,
      }),
    );

    expect(result.current.uniqueSubcomponents).toEqual([]);
    expect(result.current.uniqueClusters).toEqual(['cluster1', 'cluster2']);
    expect(result.current.uniquePipelineRunStatuses).toEqual(['Succeeded']);
  });

  it('should handle commits with empty pipelineRuns array', () => {
    const commit: Commit = {
      ...createMockCommit('sha1', 'subcomp1', 'cluster1'),
      pipelineRuns: [],
    };

    mockPipelineRunStatus.mockReturnValue(runStatus.Unknown);

    const { result } = renderHook(() =>
      useCommitFilters({
        commits: [commit],
        hasSubcomponents: true,
      }),
    );

    expect(result.current.uniqueSubcomponents).toEqual(['subcomp1']);
    expect(result.current.uniqueClusters).toEqual(['cluster1']);
    expect(result.current.uniquePipelineRunStatuses).toEqual(['Unknown']);
  });
});
