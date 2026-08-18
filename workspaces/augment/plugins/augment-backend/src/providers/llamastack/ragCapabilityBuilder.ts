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

import type { RAGCapability, DocumentInfo, VectorStoreInfo } from '../types';
import type { SyncResult } from '@red-hat-developer-hub/backstage-plugin-augment-common';
import type { VectorStoreFacade } from './VectorStoreFacade';

export interface RagInferenceAccessor {
  getClient: () => {
    request: <T>(path: string, opts: Record<string, unknown>) => Promise<T>;
  };
  getModel: () => string;
}

export function buildRagCapability(
  facade: VectorStoreFacade,
  inference?: RagInferenceAccessor,
): RAGCapability {
  return {
    listDocuments: async (vectorStoreId?: string): Promise<DocumentInfo[]> => {
      return facade.listDocuments(vectorStoreId);
    },

    listVectorStores: async (): Promise<VectorStoreInfo[]> => {
      return facade.listVectorStores();
    },

    getDefaultVectorStoreId: (): string | undefined => {
      return facade.getDefaultVectorStoreId();
    },

    getActiveVectorStoreIds: async (): Promise<string[]> => {
      return facade.getActiveVectorStoreIds();
    },

    syncDocuments: async (): Promise<SyncResult> => {
      return facade.syncDocuments();
    },

    uploadDocument: async (
      fileName: string,
      content: Buffer,
      vectorStoreId?: string,
    ): Promise<{ fileId: string; fileName: string; status: string }> => {
      return facade.uploadDocument(fileName, content, vectorStoreId);
    },

    deleteDocument: async (
      fileId: string,
      vectorStoreId?: string,
    ): Promise<{ success: boolean }> => {
      return facade.deleteDocument(fileId, vectorStoreId);
    },

    searchVectorStore: async (
      query: string,
      maxResults?: number,
      vectorStoreId?: string,
      vectorStoreIds?: string[],
    ): Promise<{
      query: string;
      chunks: Array<{
        text: string;
        score?: number;
        fileId?: string;
        fileName?: string;
        vectorStoreId?: string;
      }>;
      vectorStoreId: string;
      totalResults: number;
    }> => {
      return facade.searchVectorStore(
        query,
        maxResults,
        vectorStoreId,
        vectorStoreIds,
      );
    },

    getVectorStoreConfig: async () => {
      return facade.getVectorStoreConfig();
    },

    createVectorStoreWithConfig: async (overrides: Record<string, unknown>) => {
      return facade.createVectorStoreWithConfig(overrides);
    },

    getVectorStoreStatus: async () => {
      return facade.getVectorStoreStatus();
    },

    addVectorStoreId: (id: string) => {
      facade.addVectorStoreId(id);
    },

    removeVectorStoreId: (id: string) => {
      facade.removeVectorStoreId(id);
    },

    deleteVectorStore: (vectorStoreId: string) => {
      return facade.deleteVectorStore(vectorStoreId);
    },

    generateAnswer: inference
      ? async (
          query: string,
          maxResults?: number,
          vectorStoreId?: string,
          vectorStoreIds?: string[],
        ) => {
          const searchResult = await facade.searchVectorStore(
            query,
            maxResults,
            vectorStoreId,
            vectorStoreIds,
          );

          const chunksContext = searchResult.chunks
            .map((c, i) => {
              const fileNamePart = c.fileName ? ` — ${c.fileName}` : '';
              const scorePart =
                c.score !== undefined
                  ? ` (score: ${(c.score * 100).toFixed(1)}%)`
                  : '';
              return `[Chunk ${i + 1}${fileNamePart}${scorePart}]\n${c.text}`;
            })
            .join('\n\n');

          const instructions = [
            'You are a helpful assistant answering questions using ONLY the provided context chunks.',
            'If the context does not contain enough information to answer, say so clearly.',
            'Cite which chunk(s) you used when possible.',
            'Do not make up information beyond what the context provides.',
          ].join(' ');

          const input = `Context:\n${chunksContext}\n\nQuestion: ${query}`;
          const model = inference.getModel();
          const client = inference.getClient();

          const response = await client.request<{
            output: Array<{
              type: string;
              content?: Array<{ type: string; text?: string }>;
            }>;
          }>('/v1/responses', {
            method: 'POST',
            body: JSON.stringify({
              input,
              instructions,
              model,
              store: false,
            }),
          });

          let answer = '';
          for (const item of response.output) {
            if (item.type === 'message' && item.content) {
              for (const block of item.content) {
                if (block.type === 'output_text' && block.text) {
                  answer = block.text.trim();
                }
              }
            }
          }
          answer =
            answer || 'The model returned no answer. Try rephrasing the query.';

          return {
            query,
            answer,
            chunks: searchResult.chunks,
            model,
            totalResults: searchResult.totalResults,
          };
        }
      : undefined,
  };
}
