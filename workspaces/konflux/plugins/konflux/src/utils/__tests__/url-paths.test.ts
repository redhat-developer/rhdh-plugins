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

import {
  getPipelineRunOverviewPath,
  getReleaseOverviewPath,
  getApplicationOverviewPath,
  getApplicationsPath,
  getNamespacesPath,
  getCommitOverviewPath,
  getComponentOverviewPath,
  getBackstageEntityOverviewPath,
} from '../url-paths';
import { Entity } from '@backstage/catalog-model';

describe('url-paths', () => {
  const mockKonfluxUiUrl = 'https://konflux.example.com';

  describe('getPipelineRunOverviewPath', () => {
    it('should construct correct pipeline run overview path', () => {
      const result = getPipelineRunOverviewPath(
        mockKonfluxUiUrl,
        'my-namespace',
        'my-app',
        'my-plr',
      );
      expect(result).toBe(
        'https://konflux.example.com/ns/my-namespace/applications/my-app/pipelineruns/my-plr/',
      );
    });
  });

  describe('getReleaseOverviewPath', () => {
    it('should construct correct release overview path', () => {
      const result = getReleaseOverviewPath(
        mockKonfluxUiUrl,
        'my-namespace',
        'my-app',
        'my-release',
      );
      expect(result).toBe(
        'https://konflux.example.com/ns/my-namespace/applications/my-app/releases/my-release/',
      );
    });
  });

  describe('getApplicationOverviewPath', () => {
    it('should construct correct application overview path', () => {
      const result = getApplicationOverviewPath(
        mockKonfluxUiUrl,
        'my-namespace',
        'my-app',
      );
      expect(result).toBe(
        'https://konflux.example.com/ns/my-namespace/applications/my-app',
      );
    });
  });

  describe('getApplicationsPath', () => {
    it('should construct correct applications path', () => {
      const result = getApplicationsPath(mockKonfluxUiUrl, 'my-namespace');
      expect(result).toBe(
        'https://konflux.example.com/ns/my-namespace/applications',
      );
    });
  });

  describe('getNamespacesPath', () => {
    it('should construct correct namespaces path', () => {
      const result = getNamespacesPath(mockKonfluxUiUrl);
      expect(result).toBe('https://konflux.example.com/ns/');
    });
  });

  describe('getCommitOverviewPath', () => {
    it('should construct correct commit overview path', () => {
      const result = getCommitOverviewPath(
        mockKonfluxUiUrl,
        'my-namespace',
        'my-app',
        'abc123',
      );
      expect(result).toBe(
        'https://konflux.example.com/ns/my-namespace/applications/my-app/commit/abc123',
      );
    });
  });

  describe('getComponentOverviewPath', () => {
    it('should construct correct component overview path', () => {
      const result = getComponentOverviewPath(
        mockKonfluxUiUrl,
        'my-namespace',
        'my-app',
        'my-component',
      );
      expect(result).toBe(
        'https://konflux.example.com/ns/my-namespace/applications/my-app/components/my-component',
      );
    });
  });

  describe('getBackstageEntityOverviewPath', () => {
    it('should construct correct path with namespace', () => {
      const entity: Entity = {
        apiVersion: 'backstage.io/v1alpha1',
        kind: 'Component',
        metadata: {
          name: 'my-component',
          namespace: 'my-namespace',
        },
      };
      const result = getBackstageEntityOverviewPath(entity);
      expect(result).toBe('/catalog/my-namespace/component/my-component');
    });

    it('should use default namespace when namespace is missing', () => {
      const entity: Entity = {
        apiVersion: 'backstage.io/v1alpha1',
        kind: 'Component',
        metadata: {
          name: 'my-component',
        },
      };
      const result = getBackstageEntityOverviewPath(entity);
      expect(result).toBe('/catalog/default/component/my-component');
    });

    it('should lowercase entity kind', () => {
      const entity: Entity = {
        apiVersion: 'backstage.io/v1alpha1',
        kind: 'API',
        metadata: {
          name: 'my-api',
          namespace: 'my-namespace',
        },
      };
      const result = getBackstageEntityOverviewPath(entity);
      expect(result).toBe('/catalog/my-namespace/api/my-api');
    });

    it('should handle different entity kinds', () => {
      const entity: Entity = {
        apiVersion: 'backstage.io/v1alpha1',
        kind: 'System',
        metadata: {
          name: 'my-system',
          namespace: 'my-namespace',
        },
      };
      const result = getBackstageEntityOverviewPath(entity);
      expect(result).toBe('/catalog/my-namespace/system/my-system');
    });

    it('should handle empty namespace string', () => {
      const entity: Entity = {
        apiVersion: 'backstage.io/v1alpha1',
        kind: 'Component',
        metadata: {
          name: 'my-component',
          namespace: '',
        },
      };
      const result = getBackstageEntityOverviewPath(entity);
      expect(result).toBe('/catalog/default/component/my-component');
    });
  });
});
