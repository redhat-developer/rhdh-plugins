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

/**
 * StreamingMessage Type Definitions
 *
 * Types for the streaming message component and its state management.
 */

import type { ResponseUsage } from '@red-hat-developer-hub/backstage-plugin-augment-common';

/**
 * Tool call tracking - matches Responses API structure
 */
export interface ToolCallState {
  id: string;
  type: string;
  name?: string;
  status: string;
  arguments?: string;
  call_id?: string;
  output?: string;
  query?: string;
  resultCount?: number;
  serverLabel?: string;
  error?: string;
  requiresApproval?: boolean;
  confirmationMessage?: string;
}

/**
 * RAG source information
 */
export interface RAGSourceInfo {
  filename: string;
  text?: string;
  score?: number;
  fileId?: string;
  /** Document title from attributes (for display in citations) */
  title?: string;
  /** Source URL from attributes (for clickable citations) */
  sourceUrl?: string;
  /** Content type from attributes */
  contentType?: string;
  /** Raw attributes object from the provider */
  attributes?: Record<string, unknown>;
}

/**
 * Pending tool approval information
 */
export interface PendingApprovalInfo {
  toolCallId: string;
  toolName: string;
  serverLabel?: string;
  arguments: string;
  confirmationMessage?: string;
  responseId: string;
  requestedAt: string;
}

/**
 * All possible streaming phases
 */
export type StreamingPhase =
  | 'connecting'
  | 'thinking'
  | 'reasoning'
  | 'discovering_tools'
  | 'searching'
  | 'calling_tools'
  | 'executing_backend_tools'
  | 'pending_approval'
  | 'generating'
  | 'completed';

/**
 * A single agent handoff recorded during streaming.
 */
export interface HandoffInfo {
  from: string;
  to: string;
  reason?: string;
}

/**
 * Complete streaming state
 */
export interface StreamingState {
  phase: StreamingPhase;
  model?: string;
  responseId?: string;
  toolCalls: ToolCallState[];
  filesSearched: string[];
  ragSources?: RAGSourceInfo[];
  /** Model's internal reasoning/thinking process (if emitted) */
  reasoning?: string;
  /** Duration of reasoning phase in seconds */
  reasoningDuration?: number;
  /** When reasoning started (for calculating duration) */
  reasoningStartTime?: number;
  text: string;
  completed: boolean;
  pendingApproval?: PendingApprovalInfo;
  /** Error code from the backend (safety_violation, stream_error, etc.) */
  errorCode?: string;
  /** Token usage reported by the inference server (populated on response.completed) */
  usage?: ResponseUsage;
  /** Server-side creation timestamp (Unix epoch seconds) from response.created */
  serverTimestamp?: number;
  /** Display name of the currently active agent (multi-agent only) */
  currentAgent?: string;
  /** Accumulated handoff events during this stream */
  handoffs: HandoffInfo[];
  /** Output validation error when structured output schema validation failed */
  outputValidationError?: string;
}

/**
 * Phase display information
 */
export interface PhaseInfo {
  label: string;
  color: string;
}
