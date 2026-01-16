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

import {
  TEMP_CONVERSATION_ID,
  VALID_TOPIC_RESTRICTION_PROVIDER_IDS,
} from '../const';
import { Attachment, CaptureFeedback } from '../types';
import { LightspeedAPI } from './api';

/**
 * @public
 * Lightspeed API client options
 */

export type Options = {
  configApi: ConfigApi;
  fetchApi: FetchApi;
};

/**
 * @public
 * Lightspeed API client implementation
 */

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

  async createMessage(
    prompt: string,
    selectedModel: string,
    selectedProvider: string,
    conversation_id: string,
    attachments: Attachment[],
  ) {
    const baseUrl = await this.getBaseUrl();

    const response = await this.fetchApi.fetch(`${baseUrl}/v1/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        conversation_id:
          conversation_id === TEMP_CONVERSATION_ID
            ? undefined
            : conversation_id,
        model: selectedModel,
        provider: selectedProvider,
        query: prompt,
        attachments,
      }),
    });

    if (!response.body) {
      throw new Error('Readable stream is not supported or there is no body.');
    }

    if (!response.ok) {
      const body = await response.body.getReader();
      const reader = body.read();
      const decoder = new TextDecoder('utf-8');
      const text = await reader.then(({ done, value }) => {
        if (done) {
          return '';
        }
        return decoder.decode(value);
      });
      const errorMessage = JSON.parse(text);
      if (errorMessage?.error) {
        throw new Error(`failed to create message: ${errorMessage.error}`);
      }
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

  async isTopicRestrictionEnabled() {
    const baseUrl = await this.getBaseUrl();
    const result = await this.fetcher(`${baseUrl}/v1/shields`);

    if (!result.ok) {
      throw new Error(
        `failed to get shields, status ${result.status}: ${result.statusText}`,
      );
    }

    const response = await result.json();
    if (!response?.shields || !Array.isArray(response.shields)) {
      return false;
    }

    return response.shields.some((shield: any) => {
      const providerId = shield.provider_resource_id;

      return VALID_TOPIC_RESTRICTION_PROVIDER_IDS.some(
        validId => providerId.toLowerCase() === validId.toLowerCase(),
      );
    });
  }

  async getAllModels() {
    const baseUrl = await this.getBaseUrl();
    const result = await this.fetcher(`${baseUrl}/v1/models`);

    if (!result.ok) {
      throw new Error(
        `failed to get models, status ${result.status}: ${result.statusText}`,
      );
    }

    const response = await result.json();

    return response?.models ? response?.models : [];
  }

  async getConversationMessages(conversation_id: string) {
    if (conversation_id === TEMP_CONVERSATION_ID) {
      return [];
    }
    const baseUrl = await this.getBaseUrl();
    const result = await this.fetcher(
      `${baseUrl}/v2/conversations/${encodeURIComponent(conversation_id)}`,
    );
    if (!result.ok) {
      throw new Error(
        `failed to get conversation messages, status ${result.status}: ${result.statusText}`,
      );
    }
    const response = await result.json();
    return response.chat_history ?? [];
  }

  async getConversations() {
    const baseUrl = await this.getBaseUrl();
    const result = await this.fetcher(`${baseUrl}/v2/conversations`);

    if (!result.ok) {
      throw new Error(
        `failed to get conversation, status ${result.status}: ${result.statusText}`,
      );
    }

    const response = await result.json();
    return response.conversations ?? [];
  }

  async deleteConversation(conversation_id: string) {
    const baseUrl = await this.getBaseUrl();

    const response = await this.fetchApi.fetch(
      `${baseUrl}/v2/conversations/${encodeURIComponent(conversation_id)}`,
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

  async renameConversation(conversation_id: string, newName: string) {
    const baseUrl = await this.getBaseUrl();

    const response = await this.fetchApi.fetch(
      `${baseUrl}/v2/conversations/${encodeURIComponent(conversation_id)}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ topic_summary: newName }),
      },
    );

    if (!response.ok) {
      throw new Error(
        `failed to rename conversation, status ${response.status}: ${response.statusText}`,
      );
    }
    return { success: true };
  }

  getFeedbackStatus = async () => {
    const baseUrl = await this.getBaseUrl();

    const response = await this.fetchApi.fetch(
      `${baseUrl}/v1/feedback/status`,
      {
        method: 'GET',
        headers: {},
      },
    );

    if (!response.ok) {
      throw new Error(
        `failed to GET feedback status, status ${response.status}: ${response.statusText}`,
      );
    }
    const result = await response.json();
    return result?.status?.enabled ?? false;
  };

  captureFeedback = async (payload: CaptureFeedback) => {
    const baseUrl = await this.getBaseUrl();

    const response = await this.fetchApi.fetch(`${baseUrl}/v1/feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(
        `failed to capture feedback, status ${response.status}: ${response.statusText}`,
      );
    }
    return await response.json();
  };
}
