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

/** Public names for shared mock row types (environment detail tables). */
export type EntityRow = DcmEntityRow;
export type RequestHistoryRow = DcmRequestHistoryRow;

/** Mock environment list row (environments tab + API shape). */
export interface Environment {
  id: string;
  name: string;
  type: string;
  envLabel: string;
  resourceLoadCurrent: number;
  resourceLoadTotal: number;
  infrastructureLoadCount: number;
  maxRamGb?: number;
}

export const ENVIRONMENT_TYPES = ['AWS', 'OpenShift'] as const;

export const INITIAL_ENVIRONMENTS: Environment[] = [
  {
    id: '1',
    name: 'AWS Prod',
    type: 'AWS',
    envLabel: 'Prod',
    resourceLoadCurrent: 17,
    resourceLoadTotal: 100,
    infrastructureLoadCount: 1,
    maxRamGb: 256,
  },
  {
    id: '2',
    name: 'OpenShift Dev',
    type: 'OpenShift',
    envLabel: 'Dev',
    resourceLoadCurrent: 17,
    resourceLoadTotal: 50,
    infrastructureLoadCount: 0,
    maxRamGb: 128,
  },
];

/** Mock extended env for detail page (url, maxRamGb). */
export const MOCK_ENVIRONMENTS_DETAILS: (Environment & {
  url?: string;
  maxRamGb?: number;
})[] = [
  {
    id: '1',
    name: 'AWS Prod',
    type: 'AWS',
    envLabel: 'Prod',
    resourceLoadCurrent: 17,
    resourceLoadTotal: 100,
    infrastructureLoadCount: 1,
    url: 'https://aws.prod.example.com',
    maxRamGb: 256,
  },
  {
    id: '2',
    name: 'OpenShift Dev',
    type: 'OpenShift',
    envLabel: 'Dev',
    resourceLoadCurrent: 17,
    resourceLoadTotal: 50,
    infrastructureLoadCount: 0,
    url: 'https://openshift.dev.example.com',
    maxRamGb: 128,
  },
];

export const MOCK_ENTITIES: (EntityRow & { envId: string })[] = [
  {
    envId: '1',
    id: 'res-7',
    component: 'analytics-service',
    spec: 'Large - high-performance workloads',
    status: DCM_ENTITY_STATUS.success,
    quantity: 1,
    instanceName: 'analytics-svc',
    requestedBy: 'guest',
  },
];

/** Entity counts shown in Data Center / overview / tabs — derived from {@link MOCK_ENTITIES}. */
export function getMockEntityCountForEnvironment(envId: string): number {
  return MOCK_ENTITIES.filter(e => e.envId === envId).length;
}

export const MOCK_REQUEST_HISTORY: (RequestHistoryRow & { envId: string })[] = [
  {
    envId: '1',
    requestedAt: '3/5/2026, 1:42:38 PM',
    requestedBy: 'guest',
    component: 'documented-component',
    usageId: 'usage-env-1-001',
    type: 'Create',
    details: 'AWS Prod registered',
  },
];
