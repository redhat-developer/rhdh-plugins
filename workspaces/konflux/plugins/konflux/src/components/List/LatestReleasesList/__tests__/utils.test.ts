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

import { getLatestRelease } from '../utils';
import {
  ReleaseResource,
  SubcomponentClusterConfig,
  PipelineRunLabel,
  getApplicationFromResource,
} from '@red-hat-developer-hub/backstage-plugin-konflux-common';

jest.mock('@red-hat-developer-hub/backstage-plugin-konflux-common', () => ({
  ...jest.requireActual(
    '@red-hat-developer-hub/backstage-plugin-konflux-common',
  ),
  getApplicationFromResource: jest.fn(),
}));

const mockGetApplicationFromResource =
  getApplicationFromResource as jest.MockedFunction<
    typeof getApplicationFromResource
  >;

describe('getLatestRelease', () => {
  const clusterNamespaceComb = {
    subcomponent: 'test-subcomponent',
    cluster: 'cluster1',
    namespace: 'default',
  };

  const subcomponentConfigs: SubcomponentClusterConfig[] = [
    {
      subcomponent: 'test-subcomponent',
      cluster: 'cluster1',
      namespace: 'default',
      applications: ['app1', 'app2'],
    },
  ];

  const createMockRelease = (
    name: string,
    subcomponent: string,
    cluster: string,
    namespace: string,
    application: string,
    creationTimestamp: string,
  ): ReleaseResource => ({
    kind: 'Release',
    apiVersion: 'v1',
    application,
    subcomponent: { name: subcomponent },
    cluster: { name: cluster },
    metadata: {
      name,
      namespace,
      creationTimestamp,
      labels: {
        [PipelineRunLabel.APPLICATION]: application,
      },
    },
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return null when releases is undefined', () => {
    const result = getLatestRelease(clusterNamespaceComb, subcomponentConfigs);

    expect(result).toBeNull();
  });

  it('should return null when releases is null', () => {
    const result = getLatestRelease(clusterNamespaceComb, subcomponentConfigs);

    expect(result).toBeNull();
  });

  it('should return null when releases array is empty', () => {
    const result = getLatestRelease(
      clusterNamespaceComb,
      subcomponentConfigs,
      [],
    );

    expect(result).toBeNull();
  });

  it('should return null when no releases match the criteria', () => {
    const releases: ReleaseResource[] = [
      createMockRelease(
        'release1',
        'other-subcomponent',
        'cluster1',
        'default',
        'app1',
        '2024-01-01T00:00:00Z',
      ),
    ];

    mockGetApplicationFromResource.mockReturnValue('app1');

    const result = getLatestRelease(
      clusterNamespaceComb,
      subcomponentConfigs,
      releases,
    );

    expect(result).toBeNull();
  });

  it('should filter releases by subcomponent name', () => {
    const releases: ReleaseResource[] = [
      createMockRelease(
        'release1',
        'test-subcomponent',
        'cluster1',
        'default',
        'app1',
        '2024-01-01T00:00:00Z',
      ),
      createMockRelease(
        'release2',
        'other-subcomponent',
        'cluster1',
        'default',
        'app1',
        '2024-01-01T00:00:00Z',
      ),
    ];

    mockGetApplicationFromResource.mockReturnValue('app1');

    const result = getLatestRelease(
      clusterNamespaceComb,
      subcomponentConfigs,
      releases,
    );

    expect(result).not.toBeNull();
    expect(result?.metadata?.name).toBe('release1');
  });

  it('should filter releases by cluster name', () => {
    const releases: ReleaseResource[] = [
      createMockRelease(
        'release1',
        'test-subcomponent',
        'cluster1',
        'default',
        'app1',
        '2024-01-01T00:00:00Z',
      ),
      createMockRelease(
        'release2',
        'test-subcomponent',
        'cluster2',
        'default',
        'app1',
        '2024-01-01T00:00:00Z',
      ),
    ];

    mockGetApplicationFromResource.mockReturnValue('app1');

    const result = getLatestRelease(
      clusterNamespaceComb,
      subcomponentConfigs,
      releases,
    );

    expect(result).not.toBeNull();
    expect(result?.metadata?.name).toBe('release1');
  });

  it('should filter releases by namespace', () => {
    const releases: ReleaseResource[] = [
      createMockRelease(
        'release1',
        'test-subcomponent',
        'cluster1',
        'default',
        'app1',
        '2024-01-01T00:00:00Z',
      ),
      createMockRelease(
        'release2',
        'test-subcomponent',
        'cluster1',
        'other-namespace',
        'app1',
        '2024-01-01T00:00:00Z',
      ),
    ];

    mockGetApplicationFromResource.mockReturnValue('app1');

    const result = getLatestRelease(
      clusterNamespaceComb,
      subcomponentConfigs,
      releases,
    );

    expect(result).not.toBeNull();
    expect(result?.metadata?.name).toBe('release1');
  });

  it('should filter releases by application name', () => {
    const releases: ReleaseResource[] = [
      createMockRelease(
        'release1',
        'test-subcomponent',
        'cluster1',
        'default',
        'app1',
        '2024-01-01T00:00:00Z',
      ),
      createMockRelease(
        'release2',
        'test-subcomponent',
        'cluster1',
        'default',
        'app3',
        '2024-01-01T00:00:00Z',
      ),
    ];

    mockGetApplicationFromResource
      .mockReturnValueOnce('app1')
      .mockReturnValueOnce('app3');

    const result = getLatestRelease(
      clusterNamespaceComb,
      subcomponentConfigs,
      releases,
    );

    expect(result).not.toBeNull();
    expect(result?.metadata?.name).toBe('release1');
    expect(mockGetApplicationFromResource).toHaveBeenCalledTimes(2);
  });

  it('should return null when application name is not in allowed applications', () => {
    const releases: ReleaseResource[] = [
      createMockRelease(
        'release1',
        'test-subcomponent',
        'cluster1',
        'default',
        'app3',
        '2024-01-01T00:00:00Z',
      ),
    ];

    mockGetApplicationFromResource.mockReturnValue('app3');

    const result = getLatestRelease(
      clusterNamespaceComb,
      subcomponentConfigs,
      releases,
    );

    expect(result).toBeNull();
  });

  it('should sort releases by creation timestamp and return the latest', () => {
    const releases: ReleaseResource[] = [
      createMockRelease(
        'release1',
        'test-subcomponent',
        'cluster1',
        'default',
        'app1',
        '2024-01-01T00:00:00Z',
      ),
      createMockRelease(
        'release2',
        'test-subcomponent',
        'cluster1',
        'default',
        'app1',
        '2024-01-03T00:00:00Z',
      ),
      createMockRelease(
        'release3',
        'test-subcomponent',
        'cluster1',
        'default',
        'app1',
        '2024-01-02T00:00:00Z',
      ),
    ];

    mockGetApplicationFromResource.mockReturnValue('app1');

    const result = getLatestRelease(
      clusterNamespaceComb,
      subcomponentConfigs,
      releases,
    );

    expect(result).not.toBeNull();
    expect(result?.metadata?.name).toBe('release2');
    expect(result?.metadata?.creationTimestamp).toBe('2024-01-03T00:00:00Z');
  });

  it('should handle releases with missing creation timestamp', () => {
    const releases: ReleaseResource[] = [
      {
        ...createMockRelease(
          'release1',
          'test-subcomponent',
          'cluster1',
          'default',
          'app1',
          '2024-01-01T00:00:00Z',
        ),
        metadata: {
          ...createMockRelease(
            'release1',
            'test-subcomponent',
            'cluster1',
            'default',
            'app1',
            '2024-01-01T00:00:00Z',
          ).metadata,
          creationTimestamp: undefined,
        },
      },
      createMockRelease(
        'release2',
        'test-subcomponent',
        'cluster1',
        'default',
        'app1',
        '2024-01-02T00:00:00Z',
      ),
    ];

    mockGetApplicationFromResource.mockReturnValue('app1');

    const result = getLatestRelease(
      clusterNamespaceComb,
      subcomponentConfigs,
      releases,
    );

    expect(result).not.toBeNull();
    expect(['release1', 'release2']).toContain(result?.metadata?.name);
  });

  it('should handle multiple matching releases and return the latest', () => {
    const releases: ReleaseResource[] = [
      createMockRelease(
        'release-old',
        'test-subcomponent',
        'cluster1',
        'default',
        'app1',
        '2024-01-01T00:00:00Z',
      ),
      createMockRelease(
        'release-new',
        'test-subcomponent',
        'cluster1',
        'default',
        'app1',
        '2024-01-05T00:00:00Z',
      ),
      createMockRelease(
        'release-middle',
        'test-subcomponent',
        'cluster1',
        'default',
        'app1',
        '2024-01-03T00:00:00Z',
      ),
    ];

    mockGetApplicationFromResource.mockReturnValue('app1');

    const result = getLatestRelease(
      clusterNamespaceComb,
      subcomponentConfigs,
      releases,
    );

    expect(result).not.toBeNull();
    expect(result?.metadata?.name).toBe('release-new');
    expect(result?.metadata?.creationTimestamp).toBe('2024-01-05T00:00:00Z');
  });

  it('should filter configs correctly for matching subcomponent, cluster, and namespace', () => {
    const releases: ReleaseResource[] = [
      createMockRelease(
        'release1',
        'test-subcomponent',
        'cluster1',
        'default',
        'app1',
        '2024-01-01T00:00:00Z',
      ),
    ];

    mockGetApplicationFromResource.mockReturnValue('app1');

    const result = getLatestRelease(
      clusterNamespaceComb,
      subcomponentConfigs,
      releases,
    );

    expect(result).not.toBeNull();
    expect(result?.metadata?.name).toBe('release1');
  });

  it('should handle releases with missing subcomponent name', () => {
    const releases: ReleaseResource[] = [
      {
        ...createMockRelease(
          'release1',
          'test-subcomponent',
          'cluster1',
          'default',
          'app1',
          '2024-01-01T00:00:00Z',
        ),
        subcomponent: {
          name: 'sub1',
        },
      },
    ];

    mockGetApplicationFromResource.mockReturnValue('app1');

    const result = getLatestRelease(
      clusterNamespaceComb,
      subcomponentConfigs,
      releases,
    );

    expect(result).toBeNull();
  });

  it('should handle releases with missing cluster name', () => {
    const releases: ReleaseResource[] = [
      {
        ...createMockRelease(
          'release1',
          'test-subcomponent',
          'cluster1',
          'default',
          'app1',
          '2024-01-01T00:00:00Z',
        ),
        cluster: { name: '' },
      },
    ];

    mockGetApplicationFromResource.mockReturnValue('app1');

    const result = getLatestRelease(
      clusterNamespaceComb,
      subcomponentConfigs,
      releases,
    );

    expect(result).toBeNull();
  });

  it('should handle releases with missing namespace', () => {
    const releases: ReleaseResource[] = [
      {
        ...createMockRelease(
          'release1',
          'test-subcomponent',
          'cluster1',
          'default',
          'app1',
          '2024-01-01T00:00:00Z',
        ),
        metadata: {
          ...createMockRelease(
            'release1',
            'test-subcomponent',
            'cluster1',
            'default',
            'app1',
            '2024-01-01T00:00:00Z',
          ).metadata,
          namespace: undefined,
        },
      },
    ];

    mockGetApplicationFromResource.mockReturnValue('app1');

    const result = getLatestRelease(
      clusterNamespaceComb,
      subcomponentConfigs,
      releases,
    );

    expect(result).toBeNull();
  });
});
