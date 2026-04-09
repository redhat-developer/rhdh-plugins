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

import { LoggerService } from '@backstage/backend-plugin-api';
import {
  ConflictError,
  InputError,
  NotAllowedError,
  NotFoundError,
} from '@backstage/errors';

import FormData from 'form-data';

/**
 * Map HTTP status code to appropriate Backstage error type
 * @param status - HTTP status code
 * @param defaultMessage - Default error message
 * @param errorDetail - Error details from response
 * @returns Appropriate Backstage error instance
 */
function mapHttpStatusToError(
  status: number,
  defaultMessage: string,
  errorDetail?: any,
): Error {
  const message = errorDetail?.detail || defaultMessage;

  switch (status) {
    case 404:
      return new NotFoundError(message);
    case 409:
      return new ConflictError(message);
    case 400:
      return new InputError(message);
    case 403:
      return new NotAllowedError(message);
    default:
      return new Error(message);
  }
}

/**
 * VectorStoresOperator - HTTP client wrapper for lightspeed-core vector store endpoints
 *
 * This class provides the same interface as LlamaStackClient but proxies calls through
 * lightspeed-core REST API instead of calling llama stack directly.
 */
export class VectorStoresOperator {
  private baseURL: string;
  private logger: LoggerService;

  constructor(lightspeedCoreUrl: string, logger: LoggerService) {
    this.baseURL = lightspeedCoreUrl;
    this.logger = logger;
  }

  /**
   * Vector Stores API - mirrors LlamaStackClient.vectorStores structure
   */
  vectorStores = {
    /**
     * Create a new vector store
     * POST /v1/vector-stores
     */
    create: async (params: {
      name: string;
      provider_id?: string;
      embedding_model?: string;
      embedding_dimension?: number;
      metadata?: Record<string, any>;
    }): Promise<any> => {
      this.logger.debug('VectorStoresOperator: Creating vector store', params);

      const response = await fetch(`${this.baseURL}/v1/vector-stores`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const error = await response.json();
        this.logger.error('Failed to create vector store:', error);
        throw mapHttpStatusToError(
          response.status,
          `Failed to create vector store: ${error.detail.cause}`,
        );
      }

      return response.json();
    },

    /**
     * Retrieve a vector store by ID
     * GET /v1/vector-stores/{id}
     */
    retrieve: async (vectorStoreId: string): Promise<any> => {
      this.logger.debug(
        `VectorStoresOperator: Retrieving vector store ${vectorStoreId}`,
      );

      const response = await fetch(
        `${this.baseURL}/v1/vector-stores/${vectorStoreId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      if (!response.ok) {
        const error = await response.json();
        this.logger.error('Failed to retrieve vector store:', error);
        throw mapHttpStatusToError(
          response.status,
          `Failed to retrieve vector store: ${error.detail.cause}`,
        );
      }

      return response.json();
    },

    /**
     * Update a vector store
     * PUT /v1/vector-stores/{id}
     */
    update: async (
      vectorStoreId: string,
      params: {
        embedding_model?: string;
        embedding_dimension?: number;
        metadata?: Record<string, any>;
      },
    ): Promise<any> => {
      this.logger.debug(
        `VectorStoresOperator: Updating vector store ${vectorStoreId}`,
        params,
      );

      const response = await fetch(
        `${this.baseURL}/v1/vector-stores/${vectorStoreId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(params),
        },
      );

      if (!response.ok) {
        const error = await response.json();
        this.logger.error('Failed to update vector store:', error);
        throw mapHttpStatusToError(
          response.status,
          `Failed to update vector store: ${error.detail.cause}`,
        );
      }

      return response.json();
    },

    /**
     * Delete a vector store
     * DELETE /v1/vector-stores/{id}
     */
    delete: async (vectorStoreId: string): Promise<any> => {
      this.logger.debug(
        `VectorStoresOperator: Deleting vector store ${vectorStoreId}`,
      );

      const response = await fetch(
        `${this.baseURL}/v1/vector-stores/${vectorStoreId}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      if (!response.ok) {
        const error = await response.json();
        this.logger.error('Failed to delete vector store:', error);
        throw mapHttpStatusToError(
          response.status,
          `Failed to delete vector store: ${error.detail.cause}`,
        );
      }

      // DELETE may return 204 No Content or empty body
      if (
        response.status === 204 ||
        response.headers.get('content-length') === '0'
      ) {
        return { deleted: true };
      }

      return response.json();
    },

    /**
     * List all vector stores
     * GET /v1/vector-stores
     */
    list: async (): Promise<any> => {
      this.logger.debug('VectorStoresOperator: Listing vector stores');

      const response = await fetch(`${this.baseURL}/v1/vector-stores`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        this.logger.error('Failed to list vector stores:', error);
        throw mapHttpStatusToError(
          response.status,
          `Failed to list vector stores: ${error.detail.cause}`,
        );
      }

      return response.json();
    },

    /**
     * Vector Store Files API - nested structure matching LlamaStackClient
     */
    files: {
      /**
       * Add a file to a vector store
       * POST /v1/vector-stores/{id}/files
       */
      create: async (
        vectorStoreId: string,
        params: {
          file_id: string;
          attributes?: Record<string, any>;
          chunking_strategy?: any;
        },
      ): Promise<any> => {
        this.logger.debug(
          `VectorStoresOperator: Adding file to vector store ${vectorStoreId}`,
          params,
        );

        const response = await fetch(
          `${this.baseURL}/v1/vector-stores/${vectorStoreId}/files`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(params),
          },
        );

        if (!response.ok) {
          const error = await response.json();
          this.logger.error('Failed to add file to vector store:', error);
          throw mapHttpStatusToError(
            response.status,
            `Failed to add file to vector store: ${error.detail.cause}`,
          );
        }

        return response.json();
      },

      /**
       * List files in a vector store
       * GET /v1/vector-stores/{id}/files
       */
      list: async (vectorStoreId: string): Promise<any> => {
        this.logger.debug(
          `VectorStoresOperator: Listing files in vector store ${vectorStoreId}`,
        );

        const response = await fetch(
          `${this.baseURL}/v1/vector-stores/${vectorStoreId}/files`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          },
        );

        if (!response.ok) {
          const error = await response.json();
          this.logger.error('Failed to list files:', error);
          throw mapHttpStatusToError(
            response.status,
            `Failed to list files: ${error.detail.cause}`,
          );
        }

        return response.json();
      },

      /**
       * Retrieve a file from a vector store
       * GET /v1/vector-stores/{id}/files/{file_id}
       */
      retrieve: async (vectorStoreId: string, fileId: string): Promise<any> => {
        this.logger.debug(
          `VectorStoresOperator: Retrieving file ${fileId} from vector store ${vectorStoreId}`,
        );

        const response = await fetch(
          `${this.baseURL}/v1/vector-stores/${vectorStoreId}/files/${fileId}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          },
        );

        if (!response.ok) {
          const error = await response.json();
          this.logger.error('Failed to retrieve file:', error);
          throw mapHttpStatusToError(
            response.status,
            `Failed to retrieve file: ${error.detail.cause}`,
          );
        }

        return response.json();
      },

      /**
       * Delete a file from a vector store
       * DELETE /v1/vector-stores/{id}/files/{file_id}
       */
      delete: async (vectorStoreId: string, fileId: string): Promise<any> => {
        this.logger.debug(
          `VectorStoresOperator: Deleting file ${fileId} from vector store ${vectorStoreId}`,
        );

        const response = await fetch(
          `${this.baseURL}/v1/vector-stores/${vectorStoreId}/files/${fileId}`,
          {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
            },
          },
        );

        if (!response.ok) {
          const error = await response.json();
          this.logger.error('Failed to delete file:', error);
          throw mapHttpStatusToError(
            response.status,
            `Failed to delete file: ${error.detail.cause}`,
          );
        }

        // DELETE may return 204 No Content or empty body
        if (
          response.status === 204 ||
          response.headers.get('content-length') === '0'
        ) {
          return { deleted: true };
        }

        return response.json();
      },
    },
  };

  /**
   * Files API - mirrors LlamaStackClient.files structure
   */
  files = {
    /**
     * Upload a file
     * POST /v1/files
     */
    create: async (params: {
      file: any; // File-like object from toFile()
      purpose: string;
    }): Promise<any> => {
      this.logger.debug('VectorStoresOperator: Uploading file', {
        purpose: params.purpose,
        fileName: params.file.name,
      });

      // Create FormData for multipart upload using form-data package
      const formData = new FormData();

      // Append buffer directly with metadata
      formData.append('file', params.file.buffer, {
        filename: params.file.name,
        contentType: params.file.type || 'text/plain',
      });
      formData.append('purpose', params.purpose);

      // Convert FormData stream to Buffer
      const formBuffer = await new Promise<Buffer>((resolve, reject) => {
        const chunks: Buffer[] = [];
        formData.on('data', (chunk: string | Buffer) => {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        });
        formData.on('end', () => resolve(Buffer.concat(chunks)));
        formData.on('error', reject);
        formData.resume();
      });

      const response = await fetch(`${this.baseURL}/v1/files`, {
        method: 'POST',
        body: formBuffer as unknown as BodyInit,
        headers: formData.getHeaders(),
      });

      if (!response.ok) {
        const error = await response.json();
        this.logger.error('Failed to upload file:', error);
        throw mapHttpStatusToError(
          response.status,
          `Failed to upload file: ${error.detail.cause}`,
        );
      }

      return response.json();
    },
  };
}
