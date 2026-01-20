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

import { createItemKey } from '../resourceUtils';
import { K8sResourceCommonWithClusterInfo } from '@red-hat-developer-hub/backstage-plugin-konflux-common';

describe('createItemKey', () => {
  it('should create a key from resource metadata', () => {
    const resource: K8sResourceCommonWithClusterInfo = {
      metadata: {
        name: 'test-resource',
        namespace: 'test-namespace',
      },
      cluster: {
        name: 'test-cluster',
      },
    } as K8sResourceCommonWithClusterInfo;

    const key = createItemKey(resource);
    expect(key).toBe('test-resource-test-namespace-test-cluster');
  });

  it('should handle undefined namespace', () => {
    const resource: K8sResourceCommonWithClusterInfo = {
      metadata: {
        name: 'test-resource',
        namespace: undefined,
      },
      cluster: {
        name: 'test-cluster',
      },
    } as K8sResourceCommonWithClusterInfo;

    const key = createItemKey(resource);
    expect(key).toBe('test-resource-undefined-test-cluster');
  });

  it('should handle undefined name', () => {
    const resource: K8sResourceCommonWithClusterInfo = {
      metadata: {
        name: undefined,
        namespace: 'test-namespace',
      },
      cluster: {
        name: 'test-cluster',
      },
    } as K8sResourceCommonWithClusterInfo;

    const key = createItemKey(resource);
    expect(key).toBe('undefined-test-namespace-test-cluster');
  });

  it('should handle empty strings', () => {
    const resource: K8sResourceCommonWithClusterInfo = {
      metadata: {
        name: '',
        namespace: '',
      },
      cluster: {
        name: '',
      },
    } as K8sResourceCommonWithClusterInfo;

    const key = createItemKey(resource);
    expect(key).toBe('--');
  });

  it('should create unique keys for different resources', () => {
    const resource1: K8sResourceCommonWithClusterInfo = {
      metadata: {
        name: 'resource-1',
        namespace: 'namespace-1',
      },
      cluster: {
        name: 'cluster-1',
      },
    } as K8sResourceCommonWithClusterInfo;

    const resource2: K8sResourceCommonWithClusterInfo = {
      metadata: {
        name: 'resource-2',
        namespace: 'namespace-2',
      },
      cluster: {
        name: 'cluster-2',
      },
    } as K8sResourceCommonWithClusterInfo;

    const key1 = createItemKey(resource1);
    const key2 = createItemKey(resource2);

    expect(key1).not.toBe(key2);
    expect(key1).toBe('resource-1-namespace-1-cluster-1');
    expect(key2).toBe('resource-2-namespace-2-cluster-2');
  });

  it('should create different keys for same name but different namespace', () => {
    const resource1: K8sResourceCommonWithClusterInfo = {
      metadata: {
        name: 'same-name',
        namespace: 'namespace-1',
      },
      cluster: {
        name: 'cluster-1',
      },
    } as K8sResourceCommonWithClusterInfo;

    const resource2: K8sResourceCommonWithClusterInfo = {
      metadata: {
        name: 'same-name',
        namespace: 'namespace-2',
      },
      cluster: {
        name: 'cluster-1',
      },
    } as K8sResourceCommonWithClusterInfo;

    const key1 = createItemKey(resource1);
    const key2 = createItemKey(resource2);

    expect(key1).not.toBe(key2);
  });

  it('should create different keys for same name and namespace but different cluster', () => {
    const resource1: K8sResourceCommonWithClusterInfo = {
      metadata: {
        name: 'same-name',
        namespace: 'same-namespace',
      },
      cluster: {
        name: 'cluster-1',
      },
    } as K8sResourceCommonWithClusterInfo;

    const resource2: K8sResourceCommonWithClusterInfo = {
      metadata: {
        name: 'same-name',
        namespace: 'same-namespace',
      },
      cluster: {
        name: 'cluster-2',
      },
    } as K8sResourceCommonWithClusterInfo;

    const key1 = createItemKey(resource1);
    const key2 = createItemKey(resource2);

    expect(key1).not.toBe(key2);
  });
});
