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
import camelCase from 'lodash/camelCase';
import snakeCase from 'lodash/snakeCase';
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
  OptimizationsApi,
} from './types';

/**
 * Client for the Optimizations (ROS) API.
 *
 * In the frontend, requests are routed through the backend plugin's secure
 * proxy (`/api/cost-management/proxy/...`), which keeps the SSO token
 * server-side and enforces RBAC before forwarding to the Cost Management API.
 *
 * When a `token` is provided via `RequestOptions` (backend use-case), the
 * request goes directly to the upstream API.
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

  /** Used for backend-to-RHCC calls (token provided by caller). */
  private readonly directClient: DefaultApiClient;
  /** Used for frontend calls routed through the backend secure proxy. */
  private readonly proxyClient: DefaultApiClient;

  constructor(options: { discoveryApi: DiscoveryApi; fetchApi?: FetchApi }) {
    const outerDiscovery = options.discoveryApi;

    this.directClient = new DefaultApiClient({
      fetchApi: options.fetchApi,
      discoveryApi: {
        async getBaseUrl() {
          const baseUrl = await outerDiscovery.getBaseUrl('proxy');
          return `${baseUrl}/cost-management/v1`;
        },
      },
    });

    this.proxyClient = new DefaultApiClient({
      fetchApi: options.fetchApi,
      discoveryApi: {
        async getBaseUrl() {
          const baseUrl = await outerDiscovery.getBaseUrl(pluginId);
          return `${baseUrl}/proxy`;
        },
      },
    });
  }

  public async getRecommendationById(
    request: GetRecommendationByIdRequest,
  ): Promise<TypedResponse<RecommendationBoxPlots>> {
    const snakeCaseTransformedRequest = deepMapKeys(request, {
      onVisitJsonObjectKey: snakeCase as (value: string | number) => string,
      skipList: OptimizationsClient.requestKeysToSkip.getRecommendationById,
    }) as GetRecommendationByIdRequest;

    const response = await this.proxyClient.getRecommendationById(
      snakeCaseTransformedRequest,
    );

    if (!response.ok) {
      throw new Error(response.statusText);
    }

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
    options?: RequestOptions,
  ): Promise<TypedResponse<RecommendationList>> {
    const snakeCaseTransformedRequest = deepMapKeys(
      request,
      snakeCase as (value: string | number) => string,
    ) as GetRecommendationListRequest;

    // Backend use-case: token provided, call RHCC directly
    const client = options?.token ? this.directClient : this.proxyClient;

    const response = await client.getRecommendationList(
      snakeCaseTransformedRequest,
      options,
    );

    if (!response.ok) {
      throw new Error(response.statusText);
    }

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
}
