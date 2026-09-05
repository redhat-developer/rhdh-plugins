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

import { type Entity } from '@backstage/catalog-model';
import { getProjectSlugFromEntity } from './utils';

describe('utils', () => {
  const mockEntity: Entity = {
    apiVersion: 'backstage.io/v1alpha1',
    kind: 'Component',
    metadata: {
      name: 'test-component',
    },
  };

  describe('getProjectSlugFromEntity', () => {
    it('should extract project slug from gitlab.com/project-slug annotation', () => {
      const entity = {
        ...mockEntity,
        metadata: {
          ...mockEntity.metadata,
          annotations: {
            'gitlab.com/project-slug': 'my-group/my-project',
          },
        },
      };

      const result = getProjectSlugFromEntity(entity);
      expect(result).toBe('my-group/my-project');
    });

    it('should support nested group paths', () => {
      const entity = {
        ...mockEntity,
        metadata: {
          ...mockEntity.metadata,
          annotations: {
            'gitlab.com/project-slug': 'group/subgroup/my-project',
          },
        },
      };

      const result = getProjectSlugFromEntity(entity);
      expect(result).toBe('group/subgroup/my-project');
    });

    it.each([
      {
        description: 'annotation is missing entirely',
        annotations: undefined,
      },
      {
        description: 'project-slug is missing',
        annotations: {
          'other-annotation': 'dummy-value',
        },
      },
    ])('should throw error when $description', ({ annotations }) => {
      const entity = {
        ...mockEntity,
        metadata: { ...mockEntity.metadata, annotations },
      };

      expect(() => getProjectSlugFromEntity(entity as Entity)).toThrow(
        "Missing annotation 'gitlab.com/project-slug'",
      );
    });
  });
});
