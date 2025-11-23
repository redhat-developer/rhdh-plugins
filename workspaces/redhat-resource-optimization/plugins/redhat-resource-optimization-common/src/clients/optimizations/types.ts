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

import { DefaultApiClient } from '../../generated/apis/DefaultApi.client';
import type { TypedResponse } from '../../generated/apis/DefaultApi.client';
import type {
  CostManagementReport,
  CurrencyCode,
} from '../types/cost-management';

/** @public */
export interface GetCostManagementRequest {
  query: {
    currency?: CurrencyCode;
    delta?: string;
    'filter[limit]'?: number;
    'filter[offset]'?: number;
    'filter[resolution]'?: 'daily' | 'monthly';
    'filter[time_scope_units]'?: 'day' | 'month';
    'filter[time_scope_value]'?: number;
    'group_by[project]'?: '*' | string;
    'group_by[cluster]'?: '*' | string;
    'group_by[node]'?: '*' | string;
    'group_by[tag]'?: '*' | string;
    'order_by[cost]'?: 'asc' | 'desc';
    'order_by[distributed_cost]'?: 'asc' | 'desc';
    'order_by[markup_cost]'?: 'asc' | 'desc';
    'order_by[raw_cost]'?: 'asc' | 'desc';
    [key: string]: string | number | undefined;
  };
}

/** @public */
export type OptimizationsApi = Omit<
  InstanceType<typeof DefaultApiClient>,
  'fetchApi' | 'discoveryApi'
> & {
  getCostManagementReport(
    request: GetCostManagementRequest,
  ): Promise<TypedResponse<CostManagementReport>>;
  searchOpenShiftProjects(
    search?: string,
  ): Promise<
    TypedResponse<{ data: Array<{ value: string }>; meta?: any; links?: any }>
  >;
  searchOpenShiftClusters(
    search?: string,
  ): Promise<
    TypedResponse<{ data: Array<{ value: string }>; meta?: any; links?: any }>
  >;
  searchOpenShiftNodes(
    search?: string,
  ): Promise<
    TypedResponse<{ data: Array<{ value: string }>; meta?: any; links?: any }>
  >;
};

/**
 * This is a copy of GetTokenResponse, to avoid importing redhat-resource-optimization-backend.
 *
 * @public
 */
export interface GetTokenResponse {
  accessToken: string;
  /** The Unix Epoch at which the token will expire  */
  expiresAt: number;
}

/**
 * @public
 */
export interface GetAccessResponse {
  decision: string;
  authorizeClusterIds: string[];
  authorizeProjects: string[];
}

/** @public */
export type GetRecommendationByIdRequest = Parameters<
  OptimizationsApi['getRecommendationById']
>[0];

/** @public */
export type GetRecommendationListRequest = Parameters<
  OptimizationsApi['getRecommendationList']
>[0];
