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

import type {
  ResponseUsage,
  StreamFormDescriptor,
  StreamCitationReference,
} from '@red-hat-developer-hub/backstage-plugin-augment-common';

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
  /** Epoch ms when the tool call started */
  startedAt?: number;
  /** Epoch ms when the tool call completed or failed */
  endedAt?: number;
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
  | 'form_input'
  | 'auth_required'
  | 'generating'
  | 'completed';

/**
 * A single agent handoff recorded during streaming.
 */
export interface HandoffInfo {
  from: string;
  to: string;
  reason?: string;
  /** Epoch ms when the handoff was detected */
  timestamp?: number;
}

/**
 * A completed reasoning segment captured before it gets cleared
 * (e.g. on agent handoff or stream completion).
 */
export interface ReasoningSpanInfo {
  agentName?: string;
  text: string;
  startedAt: number;
  endedAt: number;
  durationMs: number;
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
  /** Epoch ms when the first text delta arrived */
  textStartedAt?: number;
  completed: boolean;
  /** Completed reasoning segments (preserved across handoffs) */
  reasoningSpans: ReasoningSpanInfo[];
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
  /** Pending form descriptor from an A2A form request event */
  pendingForm?: {
    taskId?: string;
    contextId?: string;
    form: StreamFormDescriptor;
  };
  /** Pending authentication demand from an A2A auth required event */
  pendingAuth?: {
    taskId?: string;
    authType: 'oauth' | 'secret';
    url?: string;
    demands?: {
      secrets?: Array<{ name: string; description?: string }>;
      [key: string]: unknown;
    };
  };
  /** Accumulated artifacts from streaming */
  artifacts?: Array<{
    artifactId: string;
    name?: string;
    description?: string;
    content: string;
    lastChunk?: boolean;
  }>;
  /** Citation references from the agent's response */
  citations?: StreamCitationReference[];
}

/**
 * Phase display information
 */
export interface PhaseInfo {
  label: string;
  color: string;
}
