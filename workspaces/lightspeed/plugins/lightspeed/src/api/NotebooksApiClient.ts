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
  DocumentListResponse,
  DocumentStatus,
  NotebookSession,
  SessionResponse,
  UploadDocumentResponse,
} from '../types';
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

  private async handleResponseError(response: Response): Promise<string> {
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
    return errorMessage;
  }

  private async fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
    const response = await this.fetchApi.fetch(url, {
      headers: {
        'Content-Type': 'application/json',
      },
      ...init,
    });

    if (!response.ok) {
      throw new Error(await this.handleResponseError(response));
    }

    const text = await response.text();
    if (!text) {
      return {} as T;
    }
    return JSON.parse(text) as T;
  }

  private async fetchFormData<T>(
    url: string,
    formData: FormData,
    method: string = 'PUT',
  ): Promise<T> {
    const response = await this.fetchApi.fetch(url, {
      method,
      body: formData,
    });

    if (!response.ok && response.status !== 202) {
      throw new Error(await this.handleResponseError(response));
    }

    const text = await response.text();
    if (!text) {
      return {} as T;
    }
    return JSON.parse(text) as T;
  }

  async createSession(name: string, description?: string) {
    const baseUrl = await this.getBaseUrl();
    const response = await this.fetchJson<SessionResponse>(
      `${baseUrl}/v1/sessions`,
      {
        method: 'POST',
        body: JSON.stringify({ name, description }),
      },
    );
    if (!response.session) {
      throw new Error(response.error ?? 'Failed to create session');
    }
    return response.session;
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

  async uploadDocument(
    sessionId: string,
    file: File,
    fileType: string,
    title: string,
    newTitle?: string,
  ) {
    const baseUrl = await this.getBaseUrl();
    const formData = new FormData();
    formData.append('file', file);
    formData.append('fileType', fileType);
    formData.append('title', title);
    if (newTitle) {
      formData.append('newTitle', newTitle);
    }
    return this.fetchFormData<UploadDocumentResponse>(
      `${baseUrl}/v1/sessions/${encodeURIComponent(sessionId)}/documents`,
      formData,
    );
  }

  async listDocuments(sessionId: string) {
    const baseUrl = await this.getBaseUrl();
    const response = await this.fetchJson<DocumentListResponse>(
      `${baseUrl}/v1/sessions/${encodeURIComponent(sessionId)}/documents`,
    );
    const docs = response?.documents ?? [];
    return docs.map(doc => ({
      ...doc,
      title: (doc as any).title ?? doc.document_id,
    }));
  }

  async deleteDocument(sessionId: string, documentId: string) {
    const baseUrl = await this.getBaseUrl();
    await this.fetchJson(
      `${baseUrl}/v1/sessions/${encodeURIComponent(sessionId)}/documents/${encodeURIComponent(documentId)}`,
      {
        method: 'DELETE',
      },
    );
  }

  async getDocumentStatus(sessionId: string, documentId: string) {
    const baseUrl = await this.getBaseUrl();
    return this.fetchJson<DocumentStatus>(
      `${baseUrl}/v1/sessions/${encodeURIComponent(sessionId)}/documents/${encodeURIComponent(documentId)}/status`,
    );
  }
}
