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

import type { Config } from '@backstage/config';
import type { Entity } from '@backstage/catalog-model';
import { ThresholdConfig } from '@red-hat-developer-hub/backstage-plugin-scorecard-common';
import { mockServices } from '@backstage/backend-test-utils';

export function newEntityComponent(
  annotations: Record<string, string> = {},
): Entity {
  return {
    apiVersion: 'backstage.io/v1alpha1',
    kind: 'Component',
    metadata: {
      name: 'mock-entity',
      annotations: annotations,
    },
    spec: {
      owner: 'guests',
    },
  };
}

export function newThresholdsConfig(): ThresholdConfig {
  return {
    rules: [
      { key: 'success', expression: '<3' },
      { key: 'warning', expression: '11-32' },
      { key: 'error', expression: '>33' },
    ],
  };
}

interface NewMockRootConfigProps {
  thresholds?: ThresholdConfig;
  options?: {
    mandatoryFilter?: string;
    customFilter?: string;
  };
  jiraConfig?: {
    baseUrl?: string;
    token?: string;
    product?: string;
    proxyPath?: string;
  };
}

export function newMockRootConfig({
  thresholds,
  options,
  jiraConfig,
}: NewMockRootConfigProps = {}): Config {
  const jira = {
    baseUrl: 'https://example.com/api',
    token: 'Fds31dsF32',
    product: 'cloud',
    proxyPath: '/jira/api',
    ...jiraConfig,
  };

  return mockServices.rootConfig({
    data: {
      jira,
      scorecard: {
        plugins: {
          jira: {
            open_issues: {
              options,
              thresholds,
            },
          },
        },
      },
    },
  });
}
