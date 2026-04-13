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

import { DCM_ENTITY_STATUS } from '@red-hat-developer-hub/backstage-plugin-dcm-common';
import type { DcmEntityRow, DcmRequestHistoryRow } from './dcm-mock-rows';

/** Public names for shared mock row types (service-spec detail tables). */
export type ServiceSpecEntityRow = DcmEntityRow;
export type ServiceSpecRequestHistoryRow = DcmRequestHistoryRow;

/** Table row + detail view for a service specification (mock data until API exists). */
export interface ServiceSpec {
  id: string;
  name: string;
  cpu: number;
  ram: number;
  policyPacks: string[];
  environment: string;
  /** Current active deployments using this spec */
  used: number;
  /** Max instances (quota) */
  quota: number;
  adoptionCount: number;
  resourceType: string;
  envSupport: string[];
  estDeploymentTime: string;
  costTier: string;
  port: number;
  protocol: string;
  backupPolicy: string;
  tags: string[];
}

export const SERVICE_SPEC_ENV_OPTIONS = ['Dev', 'Prod', 'Test'] as const;

export const INITIAL_SERVICE_SPECS: ServiceSpec[] = [
  {
    id: 'spec-1',
    name: 'Small – development & light workloads',
    cpu: 2,
    ram: 4,
    policyPacks: ['security-baseline'],
    environment: 'Dev',
    used: 4,
    quota: 20,
    adoptionCount: 1,
    resourceType: 'VM',
    envSupport: ['Dev', 'Test'],
    estDeploymentTime: '3 mins',
    costTier: '$',
    port: 8080,
    protocol: 'HTTP',
    backupPolicy: 'Weekly',
    tags: ['gold-image', 'security-hardened'],
  },
];

export function formatServiceSpecCpu(cpu: number): string {
  return `${cpu} vCPU`;
}

export function formatServiceSpecRam(ram: number): string {
  return `${ram} GB`;
}

/** Entities using a given service spec (mock). */
export const MOCK_SERVICE_SPEC_ENTITIES: (ServiceSpecEntityRow & {
  specId: string;
})[] = [
  {
    specId: 'spec-1',
    id: 'res-5',
    component: 'api-service',
    spec: 'Small – development & light workloads',
    status: DCM_ENTITY_STATUS.success,
    quantity: 1,
    instanceName: 'worker-node',
    requestedBy: 'guest',
  },
];

/** Adoption entity counts in Data Center — derived from {@link MOCK_SERVICE_SPEC_ENTITIES}. */
export function getMockEntityCountForServiceSpec(specId: string): number {
  return MOCK_SERVICE_SPEC_ENTITIES.filter(e => e.specId === specId).length;
}

export const MOCK_SERVICE_SPEC_REQUEST_HISTORY: (ServiceSpecRequestHistoryRow & {
  specId: string;
})[] = [
  {
    specId: 'spec-1',
    requestedAt: '3/5/2026, 1:42:38 PM',
    requestedBy: 'guest',
    component: 'documented-component',
    usageId: 'usage-spec-1-001',
    type: 'Create',
    details: 'Service spec registered',
  },
];
