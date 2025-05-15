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

import { TableColumn } from '@backstage/core-components';

import { AddRepositoryData } from '../../types';
import { gitlabFeatureFlag } from '../../utils/repository-utils';

export const RepositoriesListColumns: TableColumn<AddRepositoryData>[] = [
  {
    id: 'name',
    title: 'Name',
    field: 'repoName',
    type: 'string',
  },
  {
    id: 'repo-url',
    title: `${gitlabFeatureFlag ? 'URL' : 'Repo URL'}`,
    field: 'repoUrl',
    type: 'string',
  },
  {
    id: 'organization',
    title: `${gitlabFeatureFlag ? 'Organization/group' : 'Organization'}`,
    field: 'organizationUrl',
    type: 'string',
  },
  {
    id: 'status',
    title: 'Status',
    field: 'catalogInfoYaml.status',
    type: 'string',
  },
  {
    id: 'last-updated',
    title: 'Last updated',
    field: 'catalogInfoYaml.lastUpdated',
    type: 'datetime',
  },
  {
    id: 'actions',
    title: 'Actions',
    field: 'actions',
    sorting: false,
    type: 'string',
  },
];
