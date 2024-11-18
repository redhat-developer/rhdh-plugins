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
import { ConfigApi, FetchApi } from '@backstage/core-plugin-api';

import { LightspeedAPI } from './api';

export type Options = {
  configApi: ConfigApi;
  fetchApi: FetchApi;
};

export class LightspeedApiClient implements LightspeedAPI {
  private readonly configApi: ConfigApi;
  private readonly fetchApi: FetchApi;

  constructor(options: Options) {
    this.configApi = options.configApi;
    this.fetchApi = options.fetchApi;
  }

  async getBaseUrl() {
    return `${this.configApi.getString('backend.baseUrl')}/api/lightspeed`;
  }

  getServerUrl() {
    // Currently supports a single llm server
    return `${this.configApi
      .getConfigArray('lightspeed.servers')[0]
      .getOptionalString('url')}`;
  }

  async createMessage(
    prompt: string,
    selectedModel: string,
    conversation_id: string,
  ) {
    const baseUrl = await this.getBaseUrl();

    const response = await this.fetchApi.fetch(`${baseUrl}/v1/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        conversation_id,
        serverURL: this.getServerUrl(),
        model: selectedModel,
        query: prompt,
        historyLength: 10,
      }),
    });

    if (!response.body) {
      throw new Error('Readable stream is not supported or there is no body.');
    }

    if (!response.ok) {
      throw new Error(
        `failed to fetch data, status ${response.status}: ${response.statusText}`,
      );
    }
    return response.body.getReader();
  }

  private async fetcher(url: string) {
    const response = await this.fetchApi.fetch(url, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      throw new Error(
        `failed to fetch data, status ${response.status}: ${response.statusText}`,
      );
    }
    return response;
  }

  async getAllModels() {
    const baseUrl = await this.getBaseUrl();
    const result = await this.fetcher(`${baseUrl}/v1/models`);
    const response = await result.json();
    return response?.data ? response.data : [];
  }

  async getConversationMessages(conversation_id: string) {
    const baseUrl = await this.getBaseUrl();
    const result = await this.fetcher(
      `${baseUrl}/conversations/${encodeURIComponent(conversation_id)}`,
    );
    return await result.json();
  }

  async getConversations() {
    const baseUrl = await this.getBaseUrl();
    const result = await this.fetcher(`${baseUrl}/conversations`);
    return await result.json();
  }

  async createConversation() {
    const baseUrl = await this.getBaseUrl();

    const response = await this.fetchApi.fetch(`${baseUrl}/conversations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    if (!response.body) {
      throw new Error('Something went wrong.');
    }

    if (!response.ok) {
      throw new Error(
        `failed to create conversation, status ${response.status}: ${response.statusText}`,
      );
    }
    return await response.json();
  }

  async deleteConversation(conversation_id: string) {
    const baseUrl = await this.getBaseUrl();

    const response = await this.fetchApi.fetch(
      `${baseUrl}/conversations/${encodeURIComponent(conversation_id)}`,
      {
        method: 'DELETE',
        headers: {},
      },
    );

    if (!response.ok) {
      throw new Error(
        `failed to delete conversation, status ${response.status}: ${response.statusText}`,
      );
    }
    return { success: true };
  }
}
