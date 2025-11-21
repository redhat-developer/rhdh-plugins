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

import type { DiscoveryApi, FetchApi } from '@backstage/core-plugin-api';
import { deepMapKeys } from '../../util/mod';
import crossFetch from 'cross-fetch';
import camelCase from 'lodash/camelCase';
import snakeCase from 'lodash/snakeCase';
import merge from 'lodash/merge';
import { pluginId } from '../../generated/pluginId';
import {
  DefaultApiClient,
  type RequestOptions,
  type TypedResponse,
} from '../../generated/apis';
import type {
  RecommendationBoxPlots,
  RecommendationList,
} from '../../generated/models';
import type {
  GetRecommendationByIdRequest,
  GetRecommendationListRequest,
  GetTokenResponse,
  OptimizationsApi,
  GetAccessResponse,
  GetCostManagementRequest,
} from './types';
import type { CostManagementReport } from '../types/cost-management';
import { UnauthorizedError } from '@backstage-community/plugin-rbac-common';
import { AuthorizeResult } from '@backstage/plugin-permission-common';

type DefaultApiClientOpFunc<
  TRequest =
    | GetRecommendationByIdRequest
    | GetRecommendationListRequest
    | GetCostManagementRequest,
  TResponse =
    | RecommendationBoxPlots
    | RecommendationList
    | CostManagementReport,
> = (
  this: DefaultApiClient,
  request: TRequest,
  options?: RequestOptions,
) => Promise<TypedResponse<TResponse>>;

/**
 * This class is a proxy for the original Optimizations client.
 * It provides the following additional functionality:
 *   1. Routes calls through the backend's proxy.
 *   2. Implements a token renewal mechanism.
 *   3. Handles case conversion
 *
 * @public
 */
export class OptimizationsClient implements OptimizationsApi {
  private static requestKeysToSkip = {
    getRecommendationById: [/path\.recommendationId$/],
  };
  private static responseKeysToSkip = {
    getRecommendationById: [
      /recommendations\.recommendation_terms\.(long|medium|short)_term\.plots\.plots_data\['\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z'\]$/,
    ],
  };

  private readonly discoveryApi: DiscoveryApi;
  private readonly fetchApi: FetchApi;
  private readonly defaultClient: DefaultApiClient;
  private token?: string;
  private clusterIds?: string[];
  private projectNames?: string[];

  constructor(options: { discoveryApi: DiscoveryApi; fetchApi?: FetchApi }) {
    this.defaultClient = new DefaultApiClient({
      fetchApi: options.fetchApi,
      discoveryApi: {
        async getBaseUrl() {
          const baseUrl = await options.discoveryApi.getBaseUrl('proxy');
          return `${baseUrl}/cost-management/v1`;
        },
      },
    });
    this.discoveryApi = options.discoveryApi;
    this.fetchApi = options.fetchApi ?? { fetch: crossFetch };
  }

  public async getRecommendationById(
    request: GetRecommendationByIdRequest,
  ): Promise<TypedResponse<RecommendationBoxPlots>> {
    const snakeCaseTransformedRequest = deepMapKeys(request, {
      onVisitJsonObjectKey: snakeCase as (value: string | number) => string,
      skipList: OptimizationsClient.requestKeysToSkip.getRecommendationById,
    }) as GetRecommendationByIdRequest;

    const response = await this.fetchWithToken(
      this.defaultClient.getRecommendationById,
      snakeCaseTransformedRequest,
    );

    return {
      ...response,
      json: async () => {
        const data = await response.json();
        const camelCaseTransformedResponse = deepMapKeys(data, {
          onVisitJsonObjectKey: camelCase as (value: string | number) => string,
          skipList:
            OptimizationsClient.responseKeysToSkip.getRecommendationById,
        }) as RecommendationBoxPlots;
        return camelCaseTransformedResponse;
      },
    };
  }

  public async getRecommendationList(
    request: GetRecommendationListRequest,
  ): Promise<TypedResponse<RecommendationList>> {
    const snakeCaseTransformedRequest = deepMapKeys(
      request,
      snakeCase as (value: string | number) => string,
    ) as GetRecommendationListRequest;

    const response = await this.fetchWithToken(
      this.defaultClient.getRecommendationList,
      snakeCaseTransformedRequest,
    );

    return {
      ...response,
      json: async () => {
        const data = await response.json();
        const camelCaseTransformedResponse = deepMapKeys(
          data,
          camelCase as (value: string | number) => string,
        ) as RecommendationList;
        return camelCaseTransformedResponse;
      },
    };
  }

  public async getCostManagementReport(
    request: GetCostManagementRequest,
  ): Promise<TypedResponse<CostManagementReport>> {
    // Get access permission
    const accessAPIResponse = await this.getAccess();

    if (accessAPIResponse.decision === AuthorizeResult.DENY) {
      throw new UnauthorizedError();
    }

    // Get or refresh token
    if (!this.token) {
      const { accessToken } = await this.getNewToken();
      this.token = accessToken;
    }

    // Call the cost-management API via backend proxy
    let response = await this.defaultClient.getCostManagementReport(request, {
      token: this.token,
    });

    // Handle 401 errors by refreshing token and retrying
    if (!response.ok && response.status === 401) {
      const { accessToken } = await this.getNewToken();
      this.token = accessToken;

      response = await this.defaultClient.getCostManagementReport(request, {
        token: this.token,
      });
    }

    if (!response.ok) {
      throw new Error(response.statusText);
    }

    return response;
  }

  /**
   * Search OpenShift projects
   * @param search - Search term to filter projects
   */
  public async searchOpenShiftProjects(
    search: string = '',
  ): Promise<
    TypedResponse<{ data: Array<{ value: string }>; meta?: any; links?: any }>
  > {
    const baseUrl = await this.discoveryApi.getBaseUrl('proxy');
    const searchParam = search ? `?search=${encodeURIComponent(search)}` : '';
    const url = `${baseUrl}/cost-management/v1/resource-types/openshift-projects/${searchParam}`;

    return await this.fetchResourceType(url);
  }

  /**
   * Search OpenShift clusters
   * @param search - Search term to filter clusters
   */
  public async searchOpenShiftClusters(
    search: string = '',
  ): Promise<
    TypedResponse<{ data: Array<{ value: string }>; meta?: any; links?: any }>
  > {
    const baseUrl = await this.discoveryApi.getBaseUrl('proxy');
    const searchParam = search ? `?search=${encodeURIComponent(search)}` : '';
    const url = `${baseUrl}/cost-management/v1/resource-types/openshift-clusters/${searchParam}`;

    return await this.fetchResourceType(url);
  }

  /**
   * Search OpenShift nodes
   * @param search - Search term to filter nodes
   */
  public async searchOpenShiftNodes(
    search: string = '',
  ): Promise<
    TypedResponse<{ data: Array<{ value: string }>; meta?: any; links?: any }>
  > {
    const baseUrl = await this.discoveryApi.getBaseUrl('proxy');
    const searchParam = search ? `?search=${encodeURIComponent(search)}` : '';
    const url = `${baseUrl}/cost-management/v1/resource-types/openshift-nodes/${searchParam}`;

    return await this.fetchResourceType(url);
  }

  private async fetchResourceType(
    url: string,
  ): Promise<
    TypedResponse<{ data: Array<{ value: string }>; meta?: any; links?: any }>
  > {
    // Get access permission
    const accessAPIResponse = await this.getAccess();

    if (accessAPIResponse.decision === AuthorizeResult.DENY) {
      throw new UnauthorizedError();
    }

    // Get or refresh token
    if (!this.token) {
      const { accessToken } = await this.getNewToken();
      this.token = accessToken;
    }

    // Call the API via backend proxy
    let response = await this.fetchApi.fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.token}`,
      },
      method: 'GET',
    });

    // Handle 401 errors by refreshing token and retrying
    if (!response.ok && response.status === 401) {
      const { accessToken } = await this.getNewToken();
      this.token = accessToken;

      response = await this.fetchApi.fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.token}`,
        },
        method: 'GET',
      });
    }

    if (!response.ok) {
      throw new Error(response.statusText);
    }

    return {
      ...response,
      json: async () => {
        const data = await response.json();
        return data as {
          data: Array<{ value: string }>;
          meta?: any;
          links?: any;
        };
      },
    };
  }

  private async getAccess(): Promise<GetAccessResponse> {
    const baseUrl = await this.discoveryApi.getBaseUrl(`${pluginId}`);
    const response = await this.fetchApi.fetch(`${baseUrl}/access`);
    const data = (await response.json()) as GetAccessResponse;
    return data;
  }

  private async getNewToken(): Promise<GetTokenResponse> {
    const baseUrl = await this.discoveryApi.getBaseUrl(`${pluginId}`);
    const response = await this.fetchApi.fetch(`${baseUrl}/token`);
    const data = (await response.json()) as GetTokenResponse;
    return data;
  }

  private async fetchWithToken<
    TRequest = GetRecommendationByIdRequest | GetRecommendationListRequest,
    TResponse = RecommendationBoxPlots | RecommendationList,
  >(
    asyncOp: DefaultApiClientOpFunc<TRequest, TResponse>,
    request: TRequest,
  ): Promise<TypedResponse<TResponse>> {
    const accessAPIResponse = await this.getAccess();

    if (accessAPIResponse.decision === AuthorizeResult.DENY) {
      const error = new UnauthorizedError();
      throw error;
    }

    const { authorizeClusterIds, authorizeProjects } = accessAPIResponse;
    this.clusterIds = authorizeClusterIds;
    this.projectNames = authorizeProjects;

    const clusterParams = {
      query: {
        cluster: this.clusterIds,
        project: this.projectNames,
      },
    };

    if (!this.token) {
      const { accessToken } = await this.getNewToken();
      this.token = accessToken;
    }

    let response = await asyncOp.call(
      this.defaultClient,
      merge({}, request, clusterParams),
      {
        token: this.token,
      },
    );

    if (!response.ok) {
      if (response.status === 401) {
        const { accessToken } = await this.getNewToken();
        this.token = accessToken;

        response = await asyncOp.call(this.defaultClient, request, {
          token: this.token,
        });
      } else {
        throw new Error(response.statusText);
      }
    }

    return {
      ...response,
      json: async () => {
        const data = (await response.json()) as TResponse;
        return data;
      },
    };
  }
}
