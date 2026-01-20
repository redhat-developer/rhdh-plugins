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

import { screen, waitFor, render } from '@testing-library/react';
import { SubcomponentsLatestPipelineRunByTypeComponent } from '../SubcomponentsLatestPipelineRunByTypeComponent';
import {
  PipelineRunResource,
  ReleaseResource,
  PipelineRunLabel,
} from '@red-hat-developer-hub/backstage-plugin-konflux-common';
import { Entity } from '@backstage/catalog-model';
import { getGeneralStatus } from '../utils';
import { getEntityDisplayName } from '../../../utils/entities';
import {
  LatestPipelineRunByType,
  SubcomponentLatestPipelineRunByType,
} from '../types';

jest.mock('../utils', () => ({
  ...jest.requireActual('../utils'),
  getGeneralStatus: jest.fn(),
}));

jest.mock('../../../utils/entities', () => ({
  getEntityDisplayName: jest.fn(),
}));

jest.mock('../components/PipelineRunInfo', () => ({
  PipelineRunInfo: ({
    pipelineRun,
    text,
  }: {
    pipelineRun: any;
    text: string;
  }) => (
    <div data-testid={`pipeline-run-info-${text.toLowerCase()}`}>
      {text}: {pipelineRun?.metadata?.name || 'None'}
    </div>
  ),
}));

jest.mock('../components/ReleaseInfo', () => ({
  ReleaseInfo: ({ release, text }: { release: any; text: string }) => (
    <div data-testid={`release-info-${text.toLowerCase()}`}>
      {text}: {release?.metadata?.name || 'None'}
    </div>
  ),
}));

const mockGetGeneralStatus = getGeneralStatus as jest.MockedFunction<
  typeof getGeneralStatus
>;
const mockGetEntityDisplayName = getEntityDisplayName as jest.MockedFunction<
  typeof getEntityDisplayName
>;

describe('SubcomponentsLatestPipelineRunByTypeComponent', () => {
  const mockEntity: Entity = {
    apiVersion: 'backstage.io/v1alpha1',
    kind: 'Component',
    metadata: {
      name: 'test-entity',
      namespace: 'default',
    },
  };

  const createMockPipelineRun = (
    name: string,
    type: string,
  ): PipelineRunResource => ({
    kind: 'PipelineRun',
    apiVersion: 'v1',
    metadata: {
      name,
      namespace: 'default',
      creationTimestamp: '2024-01-01T00:00:00Z',
      labels: {
        [PipelineRunLabel.PIPELINE_TYPE]: type,
      },
    },
    subcomponent: { name: 'test-entity' },
    cluster: { name: 'cluster1' },
  });

  const createMockRelease = (name: string): ReleaseResource => ({
    kind: 'Release',
    apiVersion: 'v1',
    metadata: {
      name,
      namespace: 'default',
      creationTimestamp: '2024-01-01T00:00:00Z',
    },
    subcomponent: { name: 'test-entity' },
    cluster: { name: 'cluster1' },
    application: 'app1',
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetGeneralStatus.mockReturnValue('status-unknown');
    mockGetEntityDisplayName.mockImplementation(name => name);
  });

  it('should render loading state when isLoading is true', () => {
    const subcomponentsLatestPipelineRunByType: SubcomponentLatestPipelineRunByType =
      {};

    render(
      <SubcomponentsLatestPipelineRunByTypeComponent
        isLoading
        subcomponentsLatestPipelineRunByType={
          subcomponentsLatestPipelineRunByType
        }
        entities={[]}
      />,
    );

    expect(screen.getByTestId('progress')).toBeInTheDocument();
  });

  it('should render with single subcomponent (no accordion)', () => {
    const mockPipelineRun = createMockPipelineRun('test-plr', 'build');
    const latestPipelineRunByType: LatestPipelineRunByType = {
      build: mockPipelineRun,
      test: null,
      release: null,
    };

    const subcomponentsLatestPipelineRunByType: SubcomponentLatestPipelineRunByType =
      {
        'test-entity': latestPipelineRunByType,
      };

    render(
      <SubcomponentsLatestPipelineRunByTypeComponent
        isLoading={false}
        subcomponentsLatestPipelineRunByType={
          subcomponentsLatestPipelineRunByType
        }
        entities={[mockEntity]}
      />,
    );

    expect(screen.queryByText(/Build/)).toBeInTheDocument();
    expect(screen.queryByText(/Test/)).toBeInTheDocument();
    expect(screen.queryByText(/Release/)).toBeInTheDocument();
    expect(screen.queryByText(/test-plr/)).toBeInTheDocument();
    // Should not render accordion for single subcomponent
    expect(
      screen.queryByRole('button', { name: 'test-entity' }),
    ).not.toBeInTheDocument();
  });

  it('should render with multiple subcomponents (accordion)', () => {
    const mockPipelineRun1 = createMockPipelineRun('test-plr-1', 'build');
    const mockPipelineRun2 = createMockPipelineRun('test-plr-2', 'test');
    const latestPipelineRunByType1: LatestPipelineRunByType = {
      build: mockPipelineRun1,
      test: null,
      release: null,
    };
    const latestPipelineRunByType2: LatestPipelineRunByType = {
      build: null,
      test: mockPipelineRun2,
      release: null,
    };

    const subcomponentsLatestPipelineRunByType: SubcomponentLatestPipelineRunByType =
      {
        subcomp1: latestPipelineRunByType1,
        subcomp2: latestPipelineRunByType2,
      };

    const entities: Entity[] = [
      { ...mockEntity, metadata: { ...mockEntity.metadata, name: 'subcomp1' } },
      { ...mockEntity, metadata: { ...mockEntity.metadata, name: 'subcomp2' } },
    ];

    mockGetEntityDisplayName
      .mockReturnValueOnce('subcomp1')
      .mockReturnValueOnce('subcomp2');

    render(
      <SubcomponentsLatestPipelineRunByTypeComponent
        isLoading={false}
        subcomponentsLatestPipelineRunByType={
          subcomponentsLatestPipelineRunByType
        }
        entities={entities}
      />,
    );

    // Should render accordion with subcomponent names
    expect(screen.getByText('subcomp1')).toBeInTheDocument();
    expect(screen.getByText('subcomp2')).toBeInTheDocument();
  });

  it('should toggle accordion items when clicked', async () => {
    const mockPipelineRun1 = createMockPipelineRun('test-plr-1', 'build');
    const mockPipelineRun2 = createMockPipelineRun('test-plr-2', 'test');
    const latestPipelineRunByType1: LatestPipelineRunByType = {
      build: mockPipelineRun1,
      test: null,
      release: null,
    };
    const latestPipelineRunByType2: LatestPipelineRunByType = {
      build: null,
      test: mockPipelineRun2,
      release: null,
    };

    const subcomponentsLatestPipelineRunByType: SubcomponentLatestPipelineRunByType =
      {
        subcomp1: latestPipelineRunByType1,
        subcomp2: latestPipelineRunByType2,
      };

    const entities: Entity[] = [
      { ...mockEntity, metadata: { ...mockEntity.metadata, name: 'subcomp1' } },
      { ...mockEntity, metadata: { ...mockEntity.metadata, name: 'subcomp2' } },
    ];

    mockGetEntityDisplayName
      .mockReturnValueOnce('subcomp1')
      .mockReturnValueOnce('subcomp2');

    render(
      <SubcomponentsLatestPipelineRunByTypeComponent
        isLoading={false}
        subcomponentsLatestPipelineRunByType={
          subcomponentsLatestPipelineRunByType
        }
        entities={entities}
      />,
    );

    const toggle1 = screen.getByRole('button', { name: 'subcomp1' });
    expect(toggle1).toBeInTheDocument();

    // Initially collapsed, content should be hidden
    const contentBefore = screen.getByText(/test-plr-1/);
    expect(contentBefore).toBeInTheDocument();
    expect(contentBefore.closest('dd')).toHaveAttribute('hidden');

    // Click to expand
    toggle1.click();

    await waitFor(() => {
      const contentAfter = screen.getByText(/test-plr-1/);
      expect(contentAfter).toBeInTheDocument();
      expect(contentAfter.closest('dd')).not.toHaveAttribute('hidden');
    });

    // Click again to collapse
    toggle1.click();

    await waitFor(() => {
      const contentCollapsed = screen.getByText(/test-plr-1/);
      expect(contentCollapsed).toBeInTheDocument();
      expect(contentCollapsed.closest('dd')).toHaveAttribute('hidden');
    });
  });

  it('should call getGeneralStatus for each subcomponent in accordion', () => {
    const mockPipelineRun1 = createMockPipelineRun('test-plr-1', 'build');
    const mockPipelineRun2 = createMockPipelineRun('test-plr-2', 'test');
    const latestPipelineRunByType1: LatestPipelineRunByType = {
      build: mockPipelineRun1,
      test: null,
      release: null,
    };
    const latestPipelineRunByType2: LatestPipelineRunByType = {
      build: null,
      test: mockPipelineRun2,
      release: null,
    };

    const subcomponentsLatestPipelineRunByType: SubcomponentLatestPipelineRunByType =
      {
        subcomp1: latestPipelineRunByType1,
        subcomp2: latestPipelineRunByType2,
      };

    const entities: Entity[] = [
      { ...mockEntity, metadata: { ...mockEntity.metadata, name: 'subcomp1' } },
      { ...mockEntity, metadata: { ...mockEntity.metadata, name: 'subcomp2' } },
    ];

    mockGetEntityDisplayName
      .mockReturnValueOnce('subcomp1')
      .mockReturnValueOnce('subcomp2');

    render(
      <SubcomponentsLatestPipelineRunByTypeComponent
        isLoading={false}
        subcomponentsLatestPipelineRunByType={
          subcomponentsLatestPipelineRunByType
        }
        entities={entities}
      />,
    );

    expect(mockGetGeneralStatus).toHaveBeenCalledTimes(2);
    expect(mockGetGeneralStatus).toHaveBeenCalledWith(latestPipelineRunByType1);
    expect(mockGetGeneralStatus).toHaveBeenCalledWith(latestPipelineRunByType2);
  });

  it('should call getEntityDisplayName for each subcomponent in accordion', () => {
    const mockPipelineRun1 = createMockPipelineRun('test-plr-1', 'build');
    const latestPipelineRunByType1: LatestPipelineRunByType = {
      build: mockPipelineRun1,
      test: null,
      release: null,
    };

    const subcomponentsLatestPipelineRunByType: SubcomponentLatestPipelineRunByType =
      {
        subcomp1: latestPipelineRunByType1,
        subcomp2: latestPipelineRunByType1,
      };

    const entities: Entity[] = [
      { ...mockEntity, metadata: { ...mockEntity.metadata, name: 'subcomp1' } },
      { ...mockEntity, metadata: { ...mockEntity.metadata, name: 'subcomp2' } },
    ];

    mockGetEntityDisplayName
      .mockReturnValueOnce('Subcomponent 1')
      .mockReturnValueOnce('Subcomponent 2');

    render(
      <SubcomponentsLatestPipelineRunByTypeComponent
        isLoading={false}
        subcomponentsLatestPipelineRunByType={
          subcomponentsLatestPipelineRunByType
        }
        entities={entities}
      />,
    );

    expect(mockGetEntityDisplayName).toHaveBeenCalledTimes(2);
    expect(mockGetEntityDisplayName).toHaveBeenCalledWith('subcomp1', entities);
    expect(mockGetEntityDisplayName).toHaveBeenCalledWith('subcomp2', entities);
    expect(screen.getByText('Subcomponent 1')).toBeInTheDocument();
    expect(screen.getByText('Subcomponent 2')).toBeInTheDocument();
  });

  it('should render all pipeline run types (build, test, release)', () => {
    const mockBuildPLR = createMockPipelineRun('build-plr', 'build');
    const mockTestPLR = createMockPipelineRun('test-plr', 'test');
    const mockRelease = createMockRelease('release-1');

    const latestPipelineRunByType: LatestPipelineRunByType = {
      build: mockBuildPLR,
      test: mockTestPLR,
      release: mockRelease,
    };

    const subcomponentsLatestPipelineRunByType: SubcomponentLatestPipelineRunByType =
      {
        'test-entity': latestPipelineRunByType,
      };

    render(
      <SubcomponentsLatestPipelineRunByTypeComponent
        isLoading={false}
        subcomponentsLatestPipelineRunByType={
          subcomponentsLatestPipelineRunByType
        }
        entities={[mockEntity]}
      />,
    );

    expect(screen.queryByText(/build-plr/)).toBeInTheDocument();
    expect(screen.queryByText(/test-plr/)).toBeInTheDocument();
    expect(screen.queryByText(/release-1/)).toBeInTheDocument();
  });

  it('should handle empty subcomponentsLatestPipelineRunByType', () => {
    const subcomponentsLatestPipelineRunByType: SubcomponentLatestPipelineRunByType =
      {};

    render(
      <SubcomponentsLatestPipelineRunByTypeComponent
        isLoading={false}
        subcomponentsLatestPipelineRunByType={
          subcomponentsLatestPipelineRunByType
        }
        entities={[]}
      />,
    );

    // Should render nothing or empty state
    expect(screen.queryByText('Build')).not.toBeInTheDocument();
  });
});
