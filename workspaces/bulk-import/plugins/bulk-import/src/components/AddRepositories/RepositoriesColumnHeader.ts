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

export const getRepositoriesColumnHeader = (
  isApprovalToolGitlab: boolean = false,
  t: (key: string, ...args: any[]) => string,
): TableColumn[] => [
  {
    id: 'name',
    title: t('table.headers.name'),
    field: 'repoName',
  },
  {
    id: 'url',
    title: t('table.headers.url'),
    field: 'repoUrl',
  },
  isApprovalToolGitlab
    ? {
        id: 'group',
        title: t('table.headers.group'),
        field: 'organizationUrl', // Need to change this to according to the gitlab API
      }
    : {
        id: 'organization',
        title: t('table.headers.organization'),
        field: 'organizationUrl',
      },
  {
    id: 'cataloginfoyaml',
    title: t('table.headers.status'),
    field: 'catalogInfoYaml.status',
  },
];
