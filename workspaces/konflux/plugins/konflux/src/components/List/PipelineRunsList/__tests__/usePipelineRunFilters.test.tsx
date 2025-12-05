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
import { usePipelineRunFilters } from '../usePipelineRunFilters';
import {
  PipelineRunResource,
  PipelineRunLabel,
  getApplicationFromResource,
  runStatus,
} from '@red-hat-developer-hub/backstage-plugin-konflux-common';

// Mock the pipelineRunStatus function
jest.mock('../../../../utils/pipeline-runs', () => ({
  ...jest.requireActual('../../../../utils/pipeline-runs'),
  pipelineRunStatus: jest.fn(),
}));

jest.mock('@red-hat-developer-hub/backstage-plugin-konflux-common', () => ({
  ...jest.requireActual(
    '@red-hat-developer-hub/backstage-plugin-konflux-common',
  ),
  getApplicationFromResource: jest.fn(),
}));

import { pipelineRunStatus } from '../../../../utils/pipeline-runs';

const mockPipelineRunStatus = pipelineRunStatus as jest.MockedFunction<
  typeof pipelineRunStatus
>;
const mockGetApplicationFromResource =
  getApplicationFromResource as jest.MockedFunction<
    typeof getApplicationFromResource
  >;

describe('usePipelineRunFilters', () => {
  const createMockPipelineRun = (
    name: string,
    subcomponent: string,
    cluster: string,
    type: string,
  ): PipelineRunResource =>
    ({
      apiVersion: 'v1',
      apiGroup: 'tekton.dev',
      kind: 'PipelineRun',
      metadata: {
        name,
        namespace: 'test-namespace',
        labels: {
          [PipelineRunLabel.PIPELINE_TYPE]: type,
        },
      },
      subcomponent: { name: subcomponent },
      cluster: { name: cluster },
    } as PipelineRunResource);

  beforeEach(() => {
    mockPipelineRunStatus.mockReturnValue(runStatus.Succeeded);
    mockGetApplicationFromResource.mockReturnValue('app1');
  });

  it('should return empty arrays when pipelineRuns is undefined', () => {
    const { result } = renderHook(() =>
      usePipelineRunFilters({
        pipelineRuns: undefined,
        hasSubcomponents: true,
      }),
    );

    expect(result.current.uniqueSubcomponents).toEqual([]);
    expect(result.current.uniqueClusters).toEqual([]);
    expect(result.current.uniqueApplications).toEqual([]);
    expect(result.current.uniquePipelineRunStatuses).toEqual([]);
    expect(result.current.uniquePipelineRunTypes).toEqual([]);
  });

  it('should return empty arrays when pipelineRuns is empty', () => {
    const { result } = renderHook(() =>
      usePipelineRunFilters({
        pipelineRuns: [],
        hasSubcomponents: true,
      }),
    );

    expect(result.current.uniqueSubcomponents).toEqual([]);
    expect(result.current.uniqueClusters).toEqual([]);
    expect(result.current.uniqueApplications).toEqual([]);
    expect(result.current.uniquePipelineRunStatuses).toEqual([]);
    expect(result.current.uniquePipelineRunTypes).toEqual([]);
  });

  it('should extract unique values for all filter types', () => {
    mockPipelineRunStatus
      .mockReturnValueOnce(runStatus.Succeeded)
      .mockReturnValueOnce(runStatus.Failed)
      .mockReturnValueOnce(runStatus.Running);

    mockGetApplicationFromResource
      .mockReturnValueOnce('app1')
      .mockReturnValueOnce('app2')
      .mockReturnValueOnce('app1');

    const pipelineRuns = [
      createMockPipelineRun('plr1', 'subcomp1', 'cluster1', 'build'),
      createMockPipelineRun('plr2', 'subcomp1', 'cluster2', 'test'),
      createMockPipelineRun('plr3', 'subcomp2', 'cluster1', 'build'),
    ];

    const { result } = renderHook(() =>
      usePipelineRunFilters({
        pipelineRuns,
        hasSubcomponents: true,
      }),
    );

    expect(result.current.uniqueSubcomponents).toEqual([
      'subcomp1',
      'subcomp2',
    ]);
    expect(result.current.uniqueClusters).toEqual(['cluster1', 'cluster2']);
    expect(result.current.uniqueApplications).toEqual(['app1', 'app2']);
    expect(result.current.uniquePipelineRunStatuses).toEqual([
      'Failed',
      'Running',
      'Succeeded',
    ]);
    expect(result.current.uniquePipelineRunTypes).toEqual(['build', 'test']);
  });

  it('should remove duplicates and sort results', () => {
    mockPipelineRunStatus.mockReturnValue(runStatus.Succeeded);
    mockGetApplicationFromResource.mockReturnValue('app1');

    const pipelineRuns = [
      createMockPipelineRun('plr1', 'subcomp2', 'cluster2', 'build'),
      createMockPipelineRun('plr2', 'subcomp1', 'cluster1', 'test'),
      createMockPipelineRun('plr3', 'subcomp2', 'cluster1', 'build'),
      createMockPipelineRun('plr4', 'subcomp1', 'cluster2', 'test'),
    ];

    const { result } = renderHook(() =>
      usePipelineRunFilters({
        pipelineRuns,
        hasSubcomponents: true,
      }),
    );

    expect(result.current.uniqueSubcomponents).toEqual([
      'subcomp1',
      'subcomp2',
    ]);
    expect(result.current.uniqueClusters).toEqual(['cluster1', 'cluster2']);
    expect(result.current.uniquePipelineRunTypes).toEqual(['build', 'test']);
  });

  it('should return empty subcomponents when hasSubcomponents is false', () => {
    mockPipelineRunStatus.mockReturnValue(runStatus.Succeeded);
    mockGetApplicationFromResource.mockReturnValue('app1');

    const pipelineRuns = [
      createMockPipelineRun('plr1', 'subcomp1', 'cluster1', 'build'),
      createMockPipelineRun('plr2', 'subcomp2', 'cluster2', 'test'),
    ];

    const { result } = renderHook(() =>
      usePipelineRunFilters({
        pipelineRuns,
        hasSubcomponents: false,
      }),
    );

    expect(result.current.uniqueSubcomponents).toEqual([]);
    expect(result.current.uniqueClusters).toEqual(['cluster1', 'cluster2']);
    expect(result.current.uniqueApplications).toEqual(['app1']);
  });

  it('should handle pipeline runs with missing labels', () => {
    mockPipelineRunStatus.mockReturnValue(runStatus.Succeeded);
    mockGetApplicationFromResource.mockReturnValue('app1');

    const pipelineRun: PipelineRunResource = {
      apiVersion: 'v1',
      apiGroup: 'tekton.dev',
      kind: 'PipelineRun',
      metadata: {
        name: 'plr1',
        namespace: 'test-namespace',
        labels: {},
      },
      subcomponent: { name: 'subcomp1' },
      cluster: { name: 'cluster1' },
    } as PipelineRunResource;

    const { result } = renderHook(() =>
      usePipelineRunFilters({
        pipelineRuns: [pipelineRun],
        hasSubcomponents: true,
      }),
    );

    expect(result.current.uniqueSubcomponents).toEqual(['subcomp1']);
    expect(result.current.uniqueClusters).toEqual(['cluster1']);
    expect(result.current.uniquePipelineRunTypes).toEqual([]);
  });
});
