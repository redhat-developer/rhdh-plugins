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
  type Entity,
  getEntitySourceLocation,
  stringifyEntityRef,
} from '@backstage/catalog-model';
import { GithubRepository } from './types';

export const getHostnameFromEntity = (entity: Entity): string => {
  const { target } = getEntitySourceLocation(entity);
  return new URL(target).hostname;
};

export const getRepositoryInformationFromEntity = (
  entity: Entity,
): GithubRepository => {
  const projectSlug = entity.metadata.annotations?.['github.com/project-slug'];
  if (!projectSlug) {
    throw new Error(
      `Missing annotation 'github.com/project-slug' for entity ${stringifyEntityRef(
        entity,
      )}`,
    );
  }

  const [owner, repo] = projectSlug.split('/');
  if (!owner || !repo) {
    throw new Error(
      `Invalid format of 'github.com/project-slug' ${projectSlug} for entity ${stringifyEntityRef(
        entity,
      )}`,
    );
  }

  return { owner, repo };
};
