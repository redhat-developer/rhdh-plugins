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

// Translation keys for table headers
export const getRepositoriesListColumns = (
  t: (key: string, ...args: any[]) => string,
  gitlabConfigured: boolean,
): TableColumn<AddRepositoryData>[] => [
  {
    id: 'name',
    title: t('table.headers.name'),
    field: 'repoName',
    type: 'string',
  },
  {
    id: 'repo-url',
    title: gitlabConfigured
      ? t('table.headers.url')
      : t('table.headers.repoUrl'),
    field: 'repoUrl',
    type: 'string',
  },
  {
    id: 'organization',
    title: gitlabConfigured
      ? t('table.headers.organizationGroup')
      : t('table.headers.organization'),
    field: 'organizationUrl',
    type: 'string',
  },
  {
    id: 'status',
    title: t('table.headers.status'),
    field: 'catalogInfoYaml.status',
    type: 'string',
  },
  {
    id: 'last-updated',
    title: t('table.headers.lastUpdated'),
    field: 'catalogInfoYaml.lastUpdated',
    type: 'datetime',
  },
  {
    id: 'actions',
    title: t('table.headers.actions'),
    field: 'actions',
    sorting: false,
    type: 'string',
  },
];
