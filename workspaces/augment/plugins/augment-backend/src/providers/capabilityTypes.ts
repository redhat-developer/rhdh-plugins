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

import type { SyncResult } from '@red-hat-developer-hub/backstage-plugin-augment-common';
import type {
  DocumentInfo,
  VectorStoreInfo,
  ProviderStatus,
  VectorStoreStatus,
  MCPServerStatus,
  SecurityMode,
  EvaluationResult,
} from '../types';

import type {
  ConversationListResult,
  ConversationDetails,
  InputItemsResult,
  ConversationItemsResult,
  ProcessedMessage,
  ToolApproval,
  ApprovalResult,
} from './llamastack/conversationTypes';

/**
 * @public
 */
export interface ConversationCapability {
  create(): Promise<{ conversationId: string }>;
  list(limit?: number, after?: string): Promise<ConversationListResult>;
  get(responseId: string): Promise<ConversationDetails>;
  getInputs(responseId: string): Promise<InputItemsResult>;
  getByResponseChain(responseId: string): Promise<ConversationItemsResult>;
  getProcessedMessages(conversationId: string): Promise<ProcessedMessage[]>;
  delete(responseId: string, conversationId?: string): Promise<void>;
  /** Best-effort deletion of a Llama Stack conversation container by ID. */
  deleteContainer?(conversationId: string): Promise<boolean>;
  submitApproval(approval: ToolApproval): Promise<ApprovalResult>;
}

/**
 * @public
 */
export interface RAGCapability {
  listDocuments(vectorStoreId?: string): Promise<DocumentInfo[]>;
  listVectorStores(): Promise<VectorStoreInfo[]>;
  getDefaultVectorStoreId(): string | undefined;
  getActiveVectorStoreIds(): string[] | Promise<string[]>;
  syncDocuments(): Promise<SyncResult>;
  uploadDocument?(
    fileName: string,
    content: Buffer,
    vectorStoreId?: string,
  ): Promise<{ fileId: string; fileName: string; status: string }>;
  deleteDocument?(
    fileId: string,
    vectorStoreId?: string,
  ): Promise<{ success: boolean }>;
  searchVectorStore?(
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
  }>;
  getVectorStoreConfig?(): Promise<{
    vectorStoreName: string;
    embeddingModel: string;
    embeddingDimension: number;
    searchMode?: 'semantic' | 'keyword' | 'hybrid';
    bm25Weight?: number;
    semanticWeight?: number;
    chunkingStrategy: 'auto' | 'static';
    maxChunkSizeTokens: number;
    chunkOverlapTokens: number;
    fileSearchMaxResults?: number;
    fileSearchScoreThreshold?: number;
  } | null>;
  createVectorStoreWithConfig?(overrides: Record<string, unknown>): Promise<{
    vectorStoreId: string;
    vectorStoreName: string;
    created: boolean;
    embeddingModel: string;
    embeddingDimension?: number;
  }>;
  getVectorStoreStatus?(): Promise<{
    exists: boolean;
    vectorStoreId?: string;
    vectorStoreName?: string;
    documentCount?: number;
    embeddingModel?: string;
    ready: boolean;
  }>;
  addVectorStoreId?(id: string): void;
  removeVectorStoreId?(id: string): void;
  deleteVectorStore?(
    vectorStoreId: string,
  ): Promise<{ success: boolean; filesDeleted: number }>;
  updateVectorStore?(
    vectorStoreId: string,
    updates: Record<string, unknown>,
  ): Promise<VectorStoreInfo>;
  generateAnswer?(
    query: string,
    maxResults?: number,
    vectorStoreId?: string,
    vectorStoreIds?: string[],
  ): Promise<{
    query: string;
    answer: string;
    chunks: Array<{
      text: string;
      score?: number;
      fileId?: string;
      fileName?: string;
      vectorStoreId?: string;
    }>;
    model: string;
    totalResults: number;
  }>;
}

/**
 * @public
 */
export interface SafetyCapability {
  isEnabled(): boolean;
  getStatus(): Promise<SafetyStatus>;
  checkInput(text: string): Promise<SafetyCheckResult>;
  checkOutput(text: string): Promise<SafetyCheckResult>;
}

/**
 * @public
 */
export interface EvaluationCapability {
  isEnabled(): boolean;
  getStatus(): Promise<EvalStatus>;
  evaluateResponse(
    userMessage: string,
    assistantResponse: string,
    context?: string[],
  ): Promise<EvaluationResult>;
}

/**
 * @public
 */
export interface AgenticProviderStatus {
  provider: ProviderStatus;
  vectorStore: VectorStoreStatus;
  mcpServers: MCPServerStatus[];
  securityMode: SecurityMode;
  timestamp: string;
  ready: boolean;
  configurationErrors: string[];
  capabilities?: {
    chat: boolean;
    rag: { available: boolean; reason?: string };
    mcpTools: { available: boolean; reason?: string };
    agentCatalog?: boolean;
    agentSelection?: boolean;
    agentCards?: boolean;
  };
}

/**
 * @public
 */
export interface SafetyStatus {
  enabled: boolean;
  shields: string[];
  error?: string;
}

/**
 * @public
 */
export interface SafetyCheckResult {
  safe: boolean;
  violation?: string;
  category?: string;
}

/**
 * @public
 */
export interface EvalStatus {
  enabled: boolean;
  scoringFunctions: string[];
  error?: string;
}
