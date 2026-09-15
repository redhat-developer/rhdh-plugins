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

export function makeAiResource(
  spec: Entity['spec'] = {},
  annotations?: Record<string, string>,
  name = 'test-resource',
): Entity {
  return {
    apiVersion: 'backstage.io/v1beta1',
    kind: 'AiResource',
    metadata: {
      name,
      ...(annotations ? { annotations } : {}),
    },
    spec,
  };
}

export const GIT_AI_RESOURCE: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'AiResource',
  metadata: {
    name: 'qe-git-ai-standards',
    description: 'Git-backed AI coding standards for QE validation',
    tags: ['python', 'ai-rules'],
    annotations: {
      'backstage.io/source-location':
        'url:https://github.com/my-org/qe-git-ai-standards',
    },
  },
  spec: {
    type: 'skill',
    lifecycle: 'production',
    owner: 'team-ml-platform',
    scope: 'organization',
  },
};

export const OCI_AI_RESOURCE: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'AiResource',
  metadata: {
    name: 'qe-oci-skills-bundle',
    description: 'OCI-published skills bundle for QE validation',
    tags: ['security', 'oci'],
    annotations: {
      'backstage.io/source-location':
        'url:oci://quay.io/my-org/qe-skills-bundle:v1.0.0',
    },
  },
  spec: {
    type: 'skill',
    lifecycle: 'experimental',
    owner: 'team-ml-platform',
    scope: 'team',
  },
};

export const OCI_AI_RESOURCE_WITH_TECHDOCS: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'AiResource',
  metadata: {
    name: 'qe-oci-with-docs',
    description: 'OCI skill with TechDocs annotation',
    annotations: {
      'backstage.io/source-location':
        'url:oci://quay.io/my-org/qe-skills-with-docs:v2.0.0',
      'backstage.io/techdocs-ref': 'dir:.',
    },
  },
  spec: {
    type: 'skill',
    lifecycle: 'production',
    owner: 'team-ml-platform',
    scope: 'product',
  },
};
