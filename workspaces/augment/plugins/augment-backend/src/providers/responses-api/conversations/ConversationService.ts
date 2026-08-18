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
import { LoggerService, DatabaseService } from '@backstage/backend-plugin-api';
import { toErrorMessage } from '../../../services/utils';
import { MAX_AUTO_REAPPROVALS } from '../../../constants';
import type { ResponsesApiClient } from '../client/ResponsesApiClient';
import { McpAuthService } from '../../llamastack/McpAuthService';
import { MCPServerConfig } from '../../../types';
import { ConversationRegistry } from './ConversationRegistry';
import {
  executeApprovalContinuation,
  type ApprovalSafetyContext,
} from '../tools/ApprovalContinuationExecutor';
import {
  walkResponseChain as walkResponseChainFn,
  fetchResponsesFromApi as fetchResponsesFromApiFn,
} from './ResponseChainWalker';
import type {
  ConversationClientAccessor,
  ConversationListResult,
  ConversationDetails,
  InputItemsResult,
  ConversationItemsResult,
  ProcessedMessage,
  ApprovalResult,
} from './conversationTypes';
import {
  fetchConversation,
  fetchConversationInputs,
  fetchConversationItems,
  fetchProcessedMessages,
  enrichResponsesWithConversations,
  deleteConversation as doDeleteConversation,
  createConversation as doCreateConversation,
} from './conversationFetcher';

/**
 * Conversation Service
 *
 * Manages conversation history using the Llama Stack Responses API:
 * - Listing conversations
 * - Getting conversation details
 * - Getting conversation input items
 * - Deleting conversations
 * - Human-in-the-Loop (HITL) approval handling
 */
export class ConversationService {
  private readonly clientAccessor: ConversationClientAccessor;
  private readonly mcpAuth: McpAuthService;
  private readonly mcpServers: MCPServerConfig[];
  private readonly logger: LoggerService;
  private readonly registry: ConversationRegistry;
  private safetyContextProvider?: () => ApprovalSafetyContext | undefined;

  constructor(
    clientAccessor: ConversationClientAccessor,
    mcpAuth: McpAuthService,
    mcpServers: MCPServerConfig[],
    logger: LoggerService,
    database?: DatabaseService,
  ) {
    this.clientAccessor = clientAccessor;
    this.mcpAuth = mcpAuth;
    this.mcpServers = mcpServers;
    this.logger = logger;
    this.registry = new ConversationRegistry(database, logger);
  }

  setSafetyContextProvider(
    provider: () => ApprovalSafetyContext | undefined,
  ): void {
    this.safetyContextProvider = provider;
  }

  /** Convenience — returns the current ResponsesApiClient. */
  private get client(): ResponsesApiClient {
    return this.clientAccessor.getClient();
  }

  /**
   * Set up the database table if DatabaseService is available.
   * Falls back to in-memory if no database is configured.
   */
  async initializeDatabase(): Promise<void> {
    await this.registry.initializeDatabase();
  }

  /**
   * Records a conversation's first stored turn. Returns true if this is
   * the first call for this conversationId (i.e. it was not yet tracked).
   */
  markFirstStoredTurn(conversationId: string): boolean {
    return this.registry.markFirstStoredTurn(conversationId);
  }

  /**
   * Register a mapping from a response ID to its conversation ID.
   */
  async registerResponse(
    conversationId: string,
    responseId: string,
  ): Promise<void> {
    await this.registry.registerResponse(conversationId, responseId);
  }

  /**
   * Look up the conversationId for a response (if known).
   */
  async getConversationForResponse(
    responseId: string,
  ): Promise<string | undefined> {
    return this.registry.getConversationForResponse(responseId);
  }

  /**
   * List stored conversations (responses) from Llama Stack
   * Uses GET /v1/responses API
   */
  async listConversations(
    limit: number = 10,
    order: 'asc' | 'desc' = 'desc',
    after?: string,
  ): Promise<ConversationListResult> {
    const result = await this.fetchConversationsWithLimit(limit, order, after);

    return {
      conversations: result.conversations,
      hasMore: result.hasMore,
      lastId: result.lastId,
    };
  }

  async getConversation(
    responseId: string,
  ): Promise<ConversationDetails | null> {
    return fetchConversation(this.client, responseId, this.logger);
  }

  async getConversationInputs(responseId: string): Promise<InputItemsResult> {
    return fetchConversationInputs(this.client, responseId, this.logger);
  }

  async deleteConversation(
    responseId: string,
    conversationId?: string,
  ): Promise<boolean> {
    return doDeleteConversation(
      this.client,
      responseId,
      conversationId,
      this.logger,
    );
  }

  async deleteConversationContainer(conversationId: string): Promise<boolean> {
    try {
      await this.client.request(`/v1/conversations/${conversationId}`, {
        method: 'DELETE',
      });
      await this.registry.removeByConversationId(conversationId);
      this.logger.info(`Deleted conversation container ${conversationId}`);
      return true;
    } catch (error) {
      this.logger.warn(
        `Failed to delete conversation container ${conversationId}: ${toErrorMessage(error)}`,
      );
      return false;
    }
  }

  async createConversation(): Promise<string> {
    return doCreateConversation(this.client, this.logger);
  }

  async getConversationItems(
    conversationId: string,
  ): Promise<ConversationItemsResult> {
    return fetchConversationItems(this.client, conversationId, this.logger);
  }

  async getProcessedMessages(
    conversationId: string,
  ): Promise<ProcessedMessage[]> {
    return fetchProcessedMessages(this.client, conversationId, this.logger);
  }

  async walkResponseChain(
    responseId: string,
  ): Promise<Array<{ role: 'user' | 'assistant'; text: string }>> {
    return walkResponseChainFn(
      responseId,
      id => this.getConversation(id),
      this.logger,
    );
  }

  async continueAfterApproval(
    responseId: string,
    approvalRequestId: string,
    approved: boolean,
    toolName?: string,
    toolArguments?: string,
    conversationId?: string,
  ): Promise<ApprovalResult> {
    return executeApprovalContinuation(
      {
        clientAccessor: this.clientAccessor,
        mcpAuth: this.mcpAuth,
        mcpServers: this.mcpServers,
        getConversationForResponse: id =>
          this.registry.getConversationForResponse(id),
        registerResponse: (convId, respId) =>
          this.registry.registerResponse(convId, respId),
        logger: this.logger,
        safetyContext: this.safetyContextProvider?.(),
      },
      {
        responseId,
        approvalRequestId,
        approved,
        toolName,
        toolArguments,
        conversationId,
        attempt: 0,
        maxAttempts: MAX_AUTO_REAPPROVALS,
      },
    );
  }

  private async fetchConversationsWithLimit(
    limit: number,
    order: 'asc' | 'desc',
    after?: string,
  ): Promise<ConversationListResult> {
    const apiResponse = await this.fetchResponsesFromApi(limit, order, after);
    const conversations = await this.enrichResponsesWithConversations(
      apiResponse.data || [],
    );
    this.logger.info(
      `Returning ${
        conversations.length
      } conversations (${this.registry.getRegistrySize()} in registry)`,
    );
    return {
      conversations,
      hasMore: apiResponse.has_more,
      lastId: apiResponse.last_id,
    };
  }

  /** HTTP call to list responses from Llama Stack GET /v1/responses */
  private async fetchResponsesFromApi(
    limit: number,
    order: 'asc' | 'desc',
    after?: string,
  ) {
    return fetchResponsesFromApiFn(
      this.clientAccessor,
      limit,
      order,
      after,
      this.logger,
    );
  }

  private async enrichResponsesWithConversations(
    items: Array<{
      id: string;
      model: string;
      status: string;
      created_at: number;
      input: Array<{
        type: string;
        content?: string | Array<{ type: string; text?: string }>;
        role?: string;
      }>;
      previous_response_id?: string;
      conversation?: string;
    }>,
  ): Promise<import('./conversationTypes').ConversationSummary[]> {
    return enrichResponsesWithConversations(items, this.registry);
  }
}
