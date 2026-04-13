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

import type { DcmEntityStatus } from '@red-hat-developer-hub/backstage-plugin-dcm-common';

/**
 * Shared mock row for “entities” tables (environment detail vs service-spec detail).
 * Scoped in mock data by `envId` or `specId`.
 */
export interface DcmEntityRow {
  id: string;
  component: string;
  spec: string;
  /** Canonical lowercase value — use {@link displayDcmEntityStatus} in the UI. */
  status: DcmEntityStatus;
  quantity: number;
  instanceName: string;
  requestedBy: string;
}

/**
 * Shared mock row for “request history” tables (environment vs service-spec).
 */
export interface DcmRequestHistoryRow {
  requestedAt: string;
  requestedBy: string;
  component: string;
  usageId: string;
  type: 'Create' | 'Update';
  details: string;
}
