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
  SERVICE_SPEC_ENV_OPTIONS,
  type ServiceSpec,
} from '../../../data/service-specs';

export type SpecFormState = {
  name: string;
  cpu: string;
  ram: string;
  maxQuota: string;
  environment: string;
  policyPacks: string[];
};

export const emptySpecForm = (): SpecFormState => ({
  name: '',
  cpu: '',
  ram: '',
  maxQuota: '',
  environment: SERVICE_SPEC_ENV_OPTIONS[0],
  policyPacks: [],
});

export function specToForm(spec: ServiceSpec): SpecFormState {
  return {
    name: spec.name,
    cpu: String(spec.cpu),
    ram: String(spec.ram),
    maxQuota: String(spec.quota),
    environment: spec.environment,
    policyPacks: [...spec.policyPacks],
  };
}

export function defaultDetailFields(
  env: string,
): Pick<
  ServiceSpec,
  | 'resourceType'
  | 'envSupport'
  | 'estDeploymentTime'
  | 'costTier'
  | 'port'
  | 'protocol'
  | 'backupPolicy'
  | 'tags'
> {
  return {
    resourceType: 'VM',
    envSupport: env ? [env] : [],
    estDeploymentTime: '—',
    costTier: '—',
    port: 8080,
    protocol: 'HTTP',
    backupPolicy: '—',
    tags: [],
  };
}
