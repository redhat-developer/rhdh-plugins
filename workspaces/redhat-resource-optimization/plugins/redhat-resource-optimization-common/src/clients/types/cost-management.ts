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

/** @public */
export interface CostValue {
  value: number;
  units: string;
}

/** @public */
export interface BasicCost {
  raw: CostValue;
  markup: CostValue;
  usage: CostValue;
  total: CostValue;
}

/** @public */
export interface DistributedCost extends BasicCost {
  platform_distributed: CostValue;
  worker_unallocated_distributed: CostValue;
  network_unattributed_distributed: CostValue;
  storage_unattributed_distributed: CostValue;
  distributed: CostValue;
}

/** @public */
export interface ProjectValue {
  date: string;
  project: string;
  cost_group: number | string;
  classification: string;
  source_uuid: string[];
  clusters: string[];
  delta_value: number;
  delta_percent: number;
  infrastructure: BasicCost;
  supplementary: BasicCost;
  cost: DistributedCost;
}

/** @public */
export interface Project {
  project: string;
  values: ProjectValue[];
}

/** @public */
export interface DateData {
  date: string;
  projects: Project[];
}

/** @public */
export interface CostManagementReport {
  meta: {
    count: number;
    limit: number;
    offset: number;
    others: number;
    currency: string;
    delta: {
      value: number;
      percent: number;
    };
    filter: {
      resolution: string;
      time_scope_value: string;
      time_scope_units: string;
      limit: number;
      offset: number;
    };
    group_by: {
      [key: string]: string[];
    };
    order_by: {
      [key: string]: string;
    };
    exclude: Record<string, unknown>;
    distributed_overhead: boolean;
    total: {
      infrastructure: BasicCost;
      supplementary: BasicCost;
      cost: DistributedCost;
    };
  };
  links: {
    first: string;
    next: string | null;
    previous: string | null;
    last: string;
  };
  data: DateData[];
}

/** @public */
export interface GetCostManagementRequest {
  query: {
    currency?: 'USD' | 'EUR' | 'GBP';
    delta?: string;
    'filter[limit]'?: number;
    'filter[offset]'?: number;
    'filter[resolution]'?: 'daily' | 'monthly';
    'filter[time_scope_units]'?: 'day' | 'month';
    'filter[time_scope_value]'?: number;
    'group_by[project]'?: '*' | string;
    'order_by[distributed_cost]'?: 'asc' | 'desc';
    'order_by[markup_cost]'?: 'asc' | 'desc';
    'order_by[raw_cost]'?: 'asc' | 'desc';
  };
}
