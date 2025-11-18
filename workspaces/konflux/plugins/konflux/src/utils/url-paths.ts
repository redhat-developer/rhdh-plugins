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

import { Entity } from '@backstage/catalog-model';

// pipelineRuns
export const getPipelineRunOverviewPath = (
  konfluxUiUrl: string,
  namespace: string,
  application: string,
  plrName: string,
) =>
  `${konfluxUiUrl}/ns/${namespace}/applications/${application}/pipelineruns/${plrName}/`;

// releases
export const getReleaseOverviewPath = (
  konfluxUiUrl: string,
  namespace: string,
  application: string,
  release: string,
) =>
  `${konfluxUiUrl}/ns/${namespace}/applications/${application}/releases/${release}/`;

// applications
export const getApplicationOverviewPath = (
  konfluxUiUrl: string,
  namespace: string,
  application: string,
) => `${konfluxUiUrl}/ns/${namespace}/applications/${application}`;

export const getApplicationsPath = (konfluxUiUrl: string, namespace: string) =>
  `${konfluxUiUrl}/ns/${namespace}/applications`;

// namespaces
export const getNamespacesPath = (konfluxUiUrl: string) =>
  `${konfluxUiUrl}/ns/`;

// commits

export const getCommitOverviewPath = (
  konfluxUiUrl: string,
  namespace: string,
  application: string,
  commitSha: string,
) =>
  `${konfluxUiUrl}/ns/${namespace}/applications/${application}/commit/${commitSha}`;

// components

export const getComponentOverviewPath = (
  konfluxUiUrl: string,
  namespace: string,
  application: string,
  component: string,
) =>
  `${konfluxUiUrl}/ns/${namespace}/applications/${application}/components/${component}`;

// backstage entities
export const getBackstageEntityOverviewPath = (entity: Entity) =>
  `/catalog/${
    entity.metadata?.namespace || 'default'
  }/${entity.kind.toLowerCase()}/${entity.metadata.name}`;
