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

import { ConfigApi, FetchApi } from '@backstage/core-plugin-api';

import { NotebookSession } from '../types';
import { NotebooksAPI } from './notebooksApi';

/**
 * @public
 * AI Notebooks API client options
 */
export type NotebooksOptions = {
  configApi: ConfigApi;
  fetchApi: FetchApi;
};

/**
 * @public
 * AI Notebooks API client implementation
 */
export class NotebooksApiClient implements NotebooksAPI {
  private readonly configApi: ConfigApi;
  private readonly fetchApi: FetchApi;

  constructor(options: NotebooksOptions) {
    this.configApi = options.configApi;
    this.fetchApi = options.fetchApi;
  }

  async getBaseUrl() {
    return `${this.configApi.getString('backend.baseUrl')}/api/lightspeed/ai-notebooks`;
  }

  private async fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
    const response = await this.fetchApi.fetch(url, {
      headers: {
        'Content-Type': 'application/json',
      },
      ...init,
    });

    if (!response.ok) {
      let errorMessage = `failed to fetch data, status ${response.status}: ${response.statusText}`;
      try {
        const errorText = await response.text();
        if (errorText) {
          try {
            const errorBody = JSON.parse(errorText);
            if (errorBody?.error) {
              errorMessage = errorBody.error;
            }
          } catch {
            errorMessage = errorText;
          }
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn(e);
      }
      throw new Error(errorMessage);
    }

    const text = await response.text();
    if (!text) {
      return {} as T;
    }
    return JSON.parse(text) as T;
  }

  async listSessions() {
    const baseUrl = await this.getBaseUrl();
    const response = await this.fetchJson<{ sessions?: NotebookSession[] }>(
      `${baseUrl}/v1/sessions`,
    );
    return response?.sessions ?? [];
  }

  async renameSession(sessionId: string, name: string) {
    const baseUrl = await this.getBaseUrl();
    await this.fetchJson(
      `${baseUrl}/v1/sessions/${encodeURIComponent(sessionId)}`,
      {
        method: 'PUT',
        body: JSON.stringify({ name }),
      },
    );
  }

  async deleteSession(sessionId: string) {
    const baseUrl = await this.getBaseUrl();
    await this.fetchJson(
      `${baseUrl}/v1/sessions/${encodeURIComponent(sessionId)}`,
      {
        method: 'DELETE',
      },
    );
  }
}
