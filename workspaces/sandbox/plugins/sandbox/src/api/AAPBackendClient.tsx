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

import { DiscoveryApi, FetchApi } from '@backstage/core-plugin-api';
import { errorMessage } from '../utils/common';
import { AAPObject } from '../utils/aap-utils';
import { AAPData } from '../types';

export type AAPBackendClientOptions = {
  discoveryApi: DiscoveryApi;
  fetchApi: FetchApi;
};

export interface AAPService {
  getAAP(namespace: string): Promise<AAPData | undefined>;
  createAAP(namespace: string): Promise<void>;
  unIdleAAP(namespace: string): Promise<void>;
  deleteAAPCR(namespace: string): Promise<void>;
}

export class AAPBackendClient implements AAPService {
  private readonly discoveryApi: DiscoveryApi;
  private readonly fetchApi: FetchApi;

  constructor(options: AAPBackendClientOptions) {
    this.discoveryApi = options.discoveryApi;
    this.fetchApi = options.fetchApi;
  }

  private readonly kubeAPI = async (): Promise<string> => {
    return `${await this.discoveryApi.getBaseUrl('proxy')}/kube-api`;
  };

  getAAP = async (namespace: string): Promise<AAPData | undefined> => {
    const kubeApi = await this.kubeAPI();
    const projectAAPUrl = `/apis/aap.ansible.com/v1alpha1/namespaces/${namespace}/ansibleautomationplatforms`;
    const response = await this.fetchApi.fetch(`${kubeApi}${projectAAPUrl}`, {
      method: 'GET',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(errorMessage(error));
    }
    return response.json();
  };

  createAAP = async (namespace: string): Promise<void> => {
    const kubeApi = await this.kubeAPI();
    const projectAAPUrl = `/apis/aap.ansible.com/v1alpha1/namespaces/${namespace}/ansibleautomationplatforms`;
    const response = await this.fetchApi.fetch(`${kubeApi}${projectAAPUrl}`, {
      method: 'POST',
      body: AAPObject,
      headers: {
        'Content-Type': 'application/yaml',
      },
    });

    if (!response.ok && response.status !== 409) {
      const error = await response.json();
      throw new Error(errorMessage(error));
    }
  };

  unIdleAAP = async (namespace: string): Promise<void> => {
    const kubeApi = await this.kubeAPI();
    const projectAAPUrl = `/apis/aap.ansible.com/v1alpha1/namespaces/${namespace}/ansibleautomationplatforms/sandbox-aap`;
    const response = await this.fetchApi.fetch(`${kubeApi}${projectAAPUrl}`, {
      method: 'PATCH',
      body: JSON.stringify({
        spec: {
          idle_aap: false,
        },
      }),
      headers: {
        'Content-Type': 'application/merge-patch+json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(errorMessage(error));
    }
  };

  deleteAAPCR = async (namespace: string): Promise<void> => {
    const kubeApi = await this.kubeAPI();
    const projectAAPUrl = `/apis/aap.ansible.com/v1alpha1/namespaces/${namespace}/ansibleautomationplatforms/sandbox-aap`;
    const response = await this.fetchApi.fetch(`${kubeApi}${projectAAPUrl}`, {
      method: 'DELETE',
    });

    if (!response.ok && response.status !== 404) {
      const error = await response.json();
      throw new Error(errorMessage(error));
    }
  };
}
