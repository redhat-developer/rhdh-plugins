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
import { getRepositoryInformationFromEntity } from './utils';

jest.mock('@backstage/catalog-model', () => ({
  ...jest.requireActual('@backstage/catalog-model'),
  getEntitySourceLocation: jest.fn(),
}));

describe('utils', () => {
  const mockEntity: Entity = {
    apiVersion: 'backstage.io/v1alpha1',
    kind: 'Component',
    metadata: {
      name: 'test-component',
    },
  };

  describe('getRepositoryInformationFromEntity', () => {
    it('should extract owner and repo from github.com/project-slug annotation', () => {
      const entity = {
        ...mockEntity,
        metadata: {
          ...mockEntity.metadata,
          annotations: {
            'github.com/project-slug': 'owner/repo-name',
          },
        },
      };

      const result = getRepositoryInformationFromEntity(entity);
      expect(result).toEqual({
        owner: 'owner',
        repo: 'repo-name',
      });
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

      expect(() =>
        getRepositoryInformationFromEntity(entity as Entity),
      ).toThrow('');
    });

    it.each([
      {
        description: 'missing owner',
        projectSlug: '/repo',
      },
      {
        description: 'missing repo',
        projectSlug: 'owner/',
      },
      {
        description: 'no separator',
        projectSlug: 'repo',
      },
    ])(
      'should throw error when project-slug has $description',
      ({ projectSlug }) => {
        const entity = {
          ...mockEntity,
          metadata: {
            ...mockEntity.metadata,
            annotations: {
              'github.com/project-slug': projectSlug,
            },
          },
        };

        expect(() => getRepositoryInformationFromEntity(entity)).toThrow(
          `Invalid format of 'github.com/project-slug' ${projectSlug} for entity component:default/test-component`,
        );
      },
    );
  });
});
