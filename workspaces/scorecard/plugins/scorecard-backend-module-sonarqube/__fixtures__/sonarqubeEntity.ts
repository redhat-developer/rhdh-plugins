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

import type { Entity } from '@backstage/catalog-model';

/**
 * Builds a Component entity with an optional SonarQube project-key annotation.
 * Pass `null` for projectKey to omit the annotation entirely.
 */
export function sonarqubeEntity(
  projectKey: string | null = 'my-project',
): Entity {
  const annotations: Record<string, string> = {};
  if (projectKey !== null) {
    annotations['sonarqube.org/project-key'] = projectKey;
  }
  return {
    apiVersion: 'backstage.io/v1alpha1',
    kind: 'Component',
    metadata: {
      name: 'my-service',
      annotations,
    },
  };
}
