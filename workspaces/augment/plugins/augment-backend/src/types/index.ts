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

// Re-export shared types from common for backward compatibility.
// Consumers that import from the backend package continue to see these types.
export { FileFormat } from '@red-hat-developer-hub/backstage-plugin-augment-common';
export type {
  ChatMessage,
  ToolCallInfo,
  RAGSource,
  EvaluationResult,
  DocumentInfo,
  ProviderStatus,
  VectorStoreStatus,
  MCPServerStatus,
  SecurityMode,
  AugmentStatus,
  VectorStoreInfo,
  WorkflowStep,
  Workflow,
  QuickAction,
  PromptCard,
  PromptGroup,
  ConversationSummary,
  ResponseUsage,
  InputTokensDetails,
  OutputTokensDetails,
} from '@red-hat-developer-hub/backstage-plugin-augment-common';

// Domain-specific type modules
export * from './config';
export * from './documents';
export * from './responsesApi';
export * from './security';
export * from './safety';
export * from './evaluation';
export * from './conversation';
export * from './chat';
