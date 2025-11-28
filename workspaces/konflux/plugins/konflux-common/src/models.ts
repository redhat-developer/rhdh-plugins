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

import { GroupVersionKind } from './types';

export const PipelineRunGVK: GroupVersionKind = {
  apiVersion: 'v1',
  apiGroup: 'tekton.dev',
  kind: 'PipelineRun',
  plural: 'pipelineruns',
};

export const PipelineRunModel = {
  ...PipelineRunGVK,
  abbr: 'PLR',
};

export const TaskRunGVK: GroupVersionKind = {
  apiVersion: 'v1',
  apiGroup: 'tekton.dev',
  kind: 'TaskRun',
  plural: 'taskruns',
};

export const ApplicationGVK: GroupVersionKind = {
  apiVersion: 'v1alpha1',
  apiGroup: 'appstudio.redhat.com',
  kind: 'Application',
  plural: 'applications',
};

export const ComponentGVK: GroupVersionKind = {
  apiVersion: 'v1alpha1',
  apiGroup: 'appstudio.redhat.com',
  kind: 'Component',
  plural: 'components',
};

export const ReleaseGVK: GroupVersionKind = {
  apiVersion: 'v1alpha1',
  apiGroup: 'appstudio.redhat.com',
  kind: 'Release',
  plural: 'releases',
};

export enum ModelsPlural {
  pipelineruns = 'pipelineruns',
  taskruns = 'taskruns',
  pods = 'pods',
  components = 'components',
  applications = 'applications',
  releases = 'releases',
}

export const konfluxResourceModels: { [key: string]: GroupVersionKind } = {
  [ModelsPlural.pipelineruns]: PipelineRunGVK,
  [ModelsPlural.taskruns]: TaskRunGVK,
  [ModelsPlural.components]: ComponentGVK,
  [ModelsPlural.applications]: ApplicationGVK,
  [ModelsPlural.releases]: ReleaseGVK,
};
