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

import { DiscoveryService, AuthService } from '@backstage/backend-plugin-api';

export interface ConnectionStrategy {
  getBaseUrl(apiVersion: number): Promise<string>;
  getAuthHeaders(): Promise<Record<string, string>>;
}

export class DirectConnectionStrategy implements ConnectionStrategy {
  private readonly baseUrl: string;
  private readonly token: string;

  constructor(baseUrl: string, token: string) {
    this.baseUrl = baseUrl;
    this.token = token;
  }

  async getBaseUrl(apiVersion: number): Promise<string> {
    return `${this.baseUrl}/rest/api/${apiVersion}`;
  }

  async getAuthHeaders(): Promise<Record<string, string>> {
    return {
      Authorization: this.token,
    };
  }
}

export class ProxyConnectionStrategy implements ConnectionStrategy {
  private readonly proxyPath: string;
  private readonly auth: AuthService;
  private readonly discovery: DiscoveryService;

  constructor(
    proxyPath: string,
    auth: AuthService,
    discovery: DiscoveryService,
  ) {
    this.proxyPath = proxyPath;
    this.auth = auth;
    this.discovery = discovery;
  }

  async getBaseUrl(apiVersion: number): Promise<string> {
    const backendUrl = await this.discovery.getBaseUrl('proxy');
    return `${backendUrl}${this.proxyPath}/rest/api/${apiVersion}`;
  }

  async getAuthHeaders(): Promise<Record<string, string>> {
    const serviceToken = await this.getServiceToken();
    return serviceToken
      ? {
          Authorization: `Bearer ${serviceToken}`,
        }
      : {};
  }

  private async getServiceToken(): Promise<string | null> {
    const ownCredentials = await this.auth.getOwnServiceCredentials();
    const { token } = await this.auth.getPluginRequestToken({
      onBehalfOf: ownCredentials,
      targetPluginId: 'proxy',
    });
    return token;
  }
}
