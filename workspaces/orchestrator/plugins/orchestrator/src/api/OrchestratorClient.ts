/*
 * Copyright 2024 The Backstage Authors
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
  DiscoveryApi,
  IdentityApi,
  OAuthApi,
} from '@backstage/core-plugin-api';
import type { JsonObject } from '@backstage/types';

import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  isAxiosError,
  RawAxiosRequestHeaders,
} from 'axios';

import {
  AssessedProcessInstanceDTO,
  Configuration,
  DefaultApi,
  ExecuteWorkflowResponseDTO,
  Filter,
  InputSchemaResponseDTO,
  PaginationInfoDTO,
  ProcessInstanceListResultDTO,
  WorkflowOverviewDTO,
  WorkflowOverviewListResultDTO,
} from '@red-hat-developer-hub/backstage-plugin-orchestrator-common';

import { OrchestratorApi } from './api';

const getError = (err: unknown): Error => {
  if (
    isAxiosError<{ error: { message: string; name: string } }>(err) &&
    err.response?.data?.error?.message
  ) {
    const error = new Error(err.response?.data?.error?.message);
    error.name = err.response?.data?.error?.name || 'Error';
    return error;
  }
  return err as Error;
};

export interface OrchestratorClientOptions {
  discoveryApi: DiscoveryApi;
  identityApi: IdentityApi;
  githubAuthApi?: OAuthApi;
  gitlabAuthApi?: OAuthApi;
  axiosInstance?: AxiosInstance;
}
export class OrchestratorClient implements OrchestratorApi {
  private readonly discoveryApi: DiscoveryApi;
  private readonly identityApi: IdentityApi;
  private readonly githubAuthApi?: OAuthApi;
  private readonly gitlabAuthApi?: OAuthApi;
  private axiosInstance?: AxiosInstance;

  private baseUrl: string | null = null;
  constructor(options: OrchestratorClientOptions) {
    this.discoveryApi = options.discoveryApi;
    this.identityApi = options.identityApi;
    this.githubAuthApi = options.githubAuthApi;
    this.gitlabAuthApi = options.gitlabAuthApi;
    this.axiosInstance = options.axiosInstance;
  }

  async getDefaultAPI(): Promise<DefaultApi> {
    const baseUrl = await this.getBaseUrl();
    const { token: idToken } = await this.identityApi.getCredentials();

    // Fixme: Following makes mocking of global axios complicated in the tests, ideally there should be just one axios instance:
    this.axiosInstance =
      this.axiosInstance ||
      axios.create({
        baseURL: baseUrl,
        headers: {
          ...(idToken && { Authorization: `Bearer ${idToken}` }),
        },
        withCredentials: true,
      });
    const config = new Configuration({
      basePath: baseUrl,
    });

    return new DefaultApi(config, baseUrl, this.axiosInstance);
  }
  private async getBaseUrl(): Promise<string> {
    if (!this.baseUrl) {
      this.baseUrl = await this.discoveryApi.getBaseUrl('orchestrator');
    }

    return this.baseUrl;
  }

  async executeWorkflow(args: {
    workflowId: string;
    parameters: JsonObject;
    businessKey?: string;
  }): Promise<AxiosResponse<ExecuteWorkflowResponseDTO>> {
    const defaultApi = await this.getDefaultAPI();
    const reqConfigOption: AxiosRequestConfig =
      await this.getDefaultReqConfig();
    const authTokens: { provider: string; token: string }[] = [];

    /** Build one promise per provider (guard against missing APIs) */
    const tokenPromises = [
      this.githubAuthApi
        ? this.githubAuthApi
            .getAccessToken?.()
            .then(tok => ({ provider: 'github' as const, token: tok }))
        : undefined,

      this.gitlabAuthApi
        ? this.gitlabAuthApi
            .getAccessToken?.()
            .then(tok => ({ provider: 'gitlab' as const, token: tok }))
        : undefined,
    ].filter(Boolean) as Promise<{
      provider: string;
      token: string | undefined;
    }>[];

    const results = await Promise.allSettled(tokenPromises);

    /** keep only fulfilled + non-empty tokens */
    for (const r of results) {
      if (r.status === 'fulfilled') {
        const { provider, token } = r.value;
        if (token) {
          authTokens.push({ provider, token });
        }
      } else if (r.status === 'rejected') {
        console.warn('SCM token fetch failed:', r.reason);
      }
    }
    const requestBody = {
      inputData: args.parameters,
      authTokens,
    };

    try {
      return await defaultApi.executeWorkflow(
        args.workflowId,
        requestBody,
        args.businessKey,
        reqConfigOption,
      );
    } catch (err) {
      throw getError(err);
    }
  }

  async abortWorkflowInstance(
    instanceId: string,
  ): Promise<AxiosResponse<string>> {
    const defaultApi = await this.getDefaultAPI();
    const reqConfigOption: AxiosRequestConfig =
      await this.getDefaultReqConfig();
    try {
      return await defaultApi.abortWorkflow(instanceId, reqConfigOption);
    } catch (err) {
      throw getError(err);
    }
  }

  async retriggerInstance(
    workflowId: string,
    instanceId: string,
  ): Promise<AxiosResponse<object>> {
    const defaultApi = await this.getDefaultAPI();
    const reqConfigOption: AxiosRequestConfig =
      await this.getDefaultReqConfig();
    try {
      return await defaultApi.retriggerInstance(
        workflowId,
        instanceId,
        reqConfigOption,
      );
    } catch (err) {
      throw getError(err);
    }
  }

  async getWorkflowSource(workflowId: string): Promise<AxiosResponse<string>> {
    const defaultApi = await this.getDefaultAPI();
    const reqConfigOption: AxiosRequestConfig =
      await this.getDefaultReqConfig();
    reqConfigOption.responseType = 'text';
    try {
      return await defaultApi.getWorkflowSourceById(
        workflowId,
        reqConfigOption,
      );
    } catch (err) {
      throw getError(err);
    }
  }

  async listWorkflowOverviews(
    paginationInfo?: PaginationInfoDTO,
    filters?: Filter,
  ): Promise<AxiosResponse<WorkflowOverviewListResultDTO>> {
    const defaultApi = await this.getDefaultAPI();
    const reqConfigOption: AxiosRequestConfig =
      await this.getDefaultReqConfig();
    try {
      return await defaultApi.getWorkflowsOverview(
        { paginationInfo, filters },
        reqConfigOption,
      );
    } catch (err) {
      throw getError(err);
    }
  }

  async listInstances(
    paginationInfo?: PaginationInfoDTO,
    filters?: Filter,
  ): Promise<AxiosResponse<ProcessInstanceListResultDTO>> {
    const defaultApi = await this.getDefaultAPI();
    const reqConfigOption: AxiosRequestConfig =
      await this.getDefaultReqConfig();
    try {
      return await defaultApi.getInstances(
        { paginationInfo, filters: filters },
        reqConfigOption,
      );
    } catch (err) {
      throw getError(err);
    }
  }

  async getInstance(
    instanceId: string,
    includeAssessment = false,
  ): Promise<AxiosResponse<AssessedProcessInstanceDTO>> {
    const defaultApi = await this.getDefaultAPI();
    const reqConfigOption: AxiosRequestConfig =
      await this.getDefaultReqConfig();
    try {
      return await defaultApi.getInstanceById(
        instanceId,
        includeAssessment,
        reqConfigOption,
      );
    } catch (err) {
      throw getError(err);
    }
  }

  async getWorkflowDataInputSchema(
    workflowId: string,
    instanceId?: string,
  ): Promise<AxiosResponse<InputSchemaResponseDTO>> {
    const defaultApi = await this.getDefaultAPI();
    const reqConfigOption: AxiosRequestConfig =
      await this.getDefaultReqConfig();
    try {
      return await defaultApi.getWorkflowInputSchemaById(
        workflowId,
        instanceId,
        reqConfigOption,
      );
    } catch (err) {
      throw getError(err);
    }
  }

  async getWorkflowOverview(
    workflowId: string,
  ): Promise<AxiosResponse<WorkflowOverviewDTO>> {
    const defaultApi = await this.getDefaultAPI();
    const reqConfigOption: AxiosRequestConfig =
      await this.getDefaultReqConfig();
    try {
      return await defaultApi.getWorkflowOverviewById(
        workflowId,
        reqConfigOption,
      );
    } catch (err) {
      throw getError(err);
    }
  }

  // getDefaultReqConfig is a convenience wrapper that includes authentication and other necessary headers
  private async getDefaultReqConfig(
    additionalHeaders?: RawAxiosRequestHeaders,
  ): Promise<AxiosRequestConfig> {
    const idToken = await this.identityApi.getCredentials();
    const reqConfigOption: AxiosRequestConfig = {
      baseURL: await this.getBaseUrl(),
      headers: {
        Authorization: `Bearer ${idToken.token}`,
        ...additionalHeaders,
      },
    };
    return reqConfigOption;
  }
}
