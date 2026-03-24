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
import type { LoggerService } from '@backstage/backend-plugin-api';
import type { ConversationService } from './ConversationService';
import type {
  ConversationListResult,
  ConversationDetails,
  InputItemsResult,
  ConversationItemsResult,
  ProcessedMessage,
  ApprovalResult,
  ToolApproval,
} from './conversationTypes';
import type { BackendApprovalStore } from '../tools/BackendApprovalStore';

/**
 * Context provided by the orchestrator for conversation operations.
 */
export interface ConversationFacadeContext {
  ensureInitialized: () => void;
}

/**
 * Dependencies for ConversationFacade.
 */
export interface ConversationFacadeDeps {
  conversations: ConversationService | null;
  context: ConversationFacadeContext;
  logger?: LoggerService;
}

/**
 * Facade for all conversation-related operations.
 * Extracted from ResponsesApiCoordinator to separate concerns.
 */
/** Callback that executes a backend tool approval and returns the result. */
export type BackendToolApprovalHandler = (
  approval: ToolApproval,
) => Promise<ApprovalResult>;

export class ConversationFacade {
  private conversations: ConversationService | null;
  private readonly ctx: ConversationFacadeContext;
  private readonly logger?: LoggerService;
  private backendApprovalStore?: BackendApprovalStore;
  private backendToolApprovalHandler?: BackendToolApprovalHandler;

  constructor(deps: ConversationFacadeDeps) {
    this.conversations = deps.conversations;
    this.ctx = deps.context;
    this.logger = deps.logger;
  }

  /**
   * Update the underlying conversation service reference.
   * Called by the orchestrator after initialization.
   */
  setConversations(conversations: ConversationService | null): void {
    this.conversations = conversations;
  }

  /**
   * Wire in backend tool approval support.
   * Called by the orchestrator when backend tool execution mode is available.
   */
  setBackendApprovalHandler(
    store: BackendApprovalStore,
    handler: BackendToolApprovalHandler,
  ): void {
    this.backendApprovalStore = store;
    this.backendToolApprovalHandler = handler;
  }

  /**
   * List stored conversations
   */
  async listConversations(
    limit?: number,
    order?: 'asc' | 'desc',
    after?: string,
  ): Promise<ConversationListResult> {
    this.ctx.ensureInitialized();
    if (!this.conversations) {
      return { conversations: [], hasMore: false };
    }
    return this.conversations.listConversations(limit, order, after);
  }

  /**
   * Get a specific conversation
   */
  async getConversation(
    responseId: string,
  ): Promise<ConversationDetails | null> {
    this.ctx.ensureInitialized();
    if (!this.conversations) {
      return null;
    }
    return this.conversations.getConversation(responseId);
  }

  /**
   * Get input items for a conversation
   */
  async getConversationInputs(responseId: string): Promise<InputItemsResult> {
    this.ctx.ensureInitialized();
    if (!this.conversations) {
      return { items: [], hasMore: false };
    }
    return this.conversations.getConversationInputs(responseId);
  }

  /**
   * Delete a conversation (response + optional conversation container)
   */
  async deleteConversation(
    responseId: string,
    conversationId?: string,
  ): Promise<boolean> {
    this.ctx.ensureInitialized();
    if (!this.conversations) {
      return false;
    }
    return this.conversations.deleteConversation(responseId, conversationId);
  }

  /**
   * Delete only the Llama Stack conversation container by ID.
   * Used during session cleanup when we have a conversationId but no responseId.
   */
  async deleteConversationContainer(conversationId: string): Promise<boolean> {
    this.ctx.ensureInitialized();
    if (!this.conversations) {
      return false;
    }
    return this.conversations.deleteConversationContainer(conversationId);
  }

  /**
   * Create a new Llama Stack conversation container
   */
  async createConversation(): Promise<string> {
    this.ctx.ensureInitialized();
    if (!this.conversations) {
      throw new Error('Conversation service not initialized');
    }
    return this.conversations.createConversation();
  }

  /**
   * Get all items for a Llama Stack conversation
   */
  async getConversationItems(
    conversationId: string,
  ): Promise<ConversationItemsResult> {
    this.ctx.ensureInitialized();
    if (!this.conversations) {
      return { items: [] };
    }
    return this.conversations.getConversationItems(conversationId);
  }

  /**
   * Get processed messages for a conversation, ready for frontend rendering.
   */
  async getProcessedMessages(
    conversationId: string,
  ): Promise<ProcessedMessage[]> {
    this.ctx.ensureInitialized();
    if (!this.conversations) {
      this.logger?.warn(
        `[ConversationFacade] getProcessedMessages called but ConversationService is null — returning empty for ${conversationId}`,
      );
      return [];
    }
    return this.conversations.getProcessedMessages(conversationId);
  }

  /**
   * Walk the response chain to reconstruct full conversation history (legacy fallback)
   */
  async walkResponseChain(
    responseId: string,
  ): Promise<Array<{ role: 'user' | 'assistant'; text: string }>> {
    this.ctx.ensureInitialized();
    if (!this.conversations) {
      return [];
    }
    return this.conversations.walkResponseChain(responseId);
  }

  /**
   * Continue conversation after HITL approval.
   * Checks for pending backend tool approvals first — if found, the
   * tool is executed by the backend and the result is fed to LlamaStack.
   * Otherwise falls through to the standard MCP approval flow.
   */
  async continueAfterApproval(
    responseId: string,
    approvalRequestId: string,
    approved: boolean,
    toolName?: string,
    toolArguments?: string,
    conversationId?: string,
  ): Promise<ApprovalResult> {
    this.ctx.ensureInitialized();

    if (this.backendApprovalStore && this.backendToolApprovalHandler) {
      const pending = this.backendApprovalStore.get(
        responseId,
        approvalRequestId,
      );
      if (pending) {
        const result = await this.backendToolApprovalHandler({
          responseId,
          callId: approvalRequestId,
          approved,
          toolName: toolName ?? pending.originalToolName,
          toolArguments: toolArguments ?? pending.argumentsJson,
        });
        this.backendApprovalStore.remove(responseId, approvalRequestId);
        return result;
      }
    }

    if (!this.conversations) {
      throw new Error('Conversation service not initialized');
    }
    return this.conversations.continueAfterApproval(
      responseId,
      approvalRequestId,
      approved,
      toolName,
      toolArguments,
      conversationId,
    );
  }
}
