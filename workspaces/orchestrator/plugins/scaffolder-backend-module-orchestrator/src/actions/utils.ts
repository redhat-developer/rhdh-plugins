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
import { AuthService } from '@backstage/backend-plugin-api';
import { DiscoveryApi } from '@backstage/plugin-permission-common';

import axios, { AxiosRequestConfig, isAxiosError } from 'axios';

import {
  Configuration,
  DefaultApi,
} from '@redhat/backstage-plugin-orchestrator-common';

export const getError = (err: unknown): Error => {
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

export const getOrchestratorApi = async (
  discoveryService: DiscoveryApi,
): Promise<DefaultApi> => {
  const baseUrl = await discoveryService.getBaseUrl('orchestrator');
  const config = new Configuration({});

  const axiosInstance = axios.create({
    baseURL: baseUrl,
  });
  const api = new DefaultApi(config, baseUrl, axiosInstance);

  return api;
};
export const getRequestConfigOption = async (
  authService: AuthService,
  ctx: any,
) => {
  const { token } = (await authService.getPluginRequestToken({
    onBehalfOf: await ctx.getInitiatorCredentials(),
    targetPluginId: 'orchestrator',
  })) ?? { token: ctx.secrets?.backstageToken };

  const reqConfigOption: AxiosRequestConfig = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  return reqConfigOption;
};
