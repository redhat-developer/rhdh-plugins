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

import type { ResponseUsage } from './shared';

// =============================================================================
// Normalized Streaming Events
// =============================================================================
//
// These events form the contract between the backend provider and the frontend.
// Each provider adapter maps its native streaming format to these events.
// The frontend reducer ONLY processes normalized events — never raw provider events.
//
// Design principles:
// - Discriminated union on `type` for exhaustive switch handling
// - Each event carries only the data needed for that event
// - Event names use dot notation: stream.<category>.<action>
// - Provider-specific data is normalized away before reaching the frontend

/** Response has been created, streaming is starting. @public */
export interface StreamStartedEvent {
  type: 'stream.started';
  responseId: string;
  model?: string;
  /** Server-side creation timestamp (Unix epoch seconds) */
  createdAt?: number;
}

/** A chunk of generated text. @public */
export interface StreamTextDeltaEvent {
  type: 'stream.text.delta';
  delta: string;
}

/** Text generation is complete for this response. @public */
export interface StreamTextDoneEvent {
  type: 'stream.text.done';
  text: string;
}

/** A chunk of reasoning/thinking text (models with chain-of-thought). @public */
export interface StreamReasoningDeltaEvent {
  type: 'stream.reasoning.delta';
  delta: string;
}

/** Reasoning text is complete. @public */
export interface StreamReasoningDoneEvent {
  type: 'stream.reasoning.done';
  text: string;
}

/** Provider is discovering available tools (e.g., listing MCP server tools). @public */
export interface StreamToolDiscoveryEvent {
  type: 'stream.tool.discovery';
  serverLabel?: string;
  status: 'in_progress' | 'completed';
  toolCount?: number;
}

/** A tool call has started. @public */
export interface StreamToolStartedEvent {
  type: 'stream.tool.started';
  callId: string;
  name: string;
  serverLabel?: string;
}

/** Tool call arguments are streaming in. @public */
export interface StreamToolDeltaEvent {
  type: 'stream.tool.delta';
  callId: string;
  delta: string;
}

/** Tool call completed with output. @public */
export interface StreamToolCompletedEvent {
  type: 'stream.tool.completed';
  callId: string;
  name: string;
  serverLabel?: string;
  output?: string;
  error?: string;
}

/** Tool call failed. @public */
export interface StreamToolFailedEvent {
  type: 'stream.tool.failed';
  callId: string;
  name: string;
  serverLabel?: string;
  error: string;
}

/** Tool call requires human approval (HITL). @public */
export interface StreamToolApprovalEvent {
  type: 'stream.tool.approval';
  callId: string;
  name: string;
  serverLabel?: string;
  arguments?: string;
  /** Response ID for this approval request, for reliable approval submission. */
  responseId?: string;
}

/** Backend is executing tool calls on behalf of the LLM. @public */
export interface StreamBackendToolExecutingEvent {
  type: 'stream.backend_tool.executing';
  toolCount: number;
  tools: string[];
}

/** RAG search results arrived. @public */
export interface StreamRagResultsEvent {
  type: 'stream.rag.results';
  sources: Array<{
    filename: string;
    fileId?: string;
    text?: string;
    score?: number;
    title?: string;
    sourceUrl?: string;
    contentType?: string;
    attributes?: Record<string, unknown>;
  }>;
  filesSearched?: string[];
}

/** The response is fully complete. @public */
export interface StreamCompletedEvent {
  type: 'stream.completed';
  responseId?: string;
  usage?: ResponseUsage;
  /** Display name of the agent that produced the final response (multi-agent only) */
  agentName?: string;
  /** Output validation error when structured output schema validation failed */
  outputValidationError?: string;
}

/** An agent handoff occurred during multi-agent streaming. @public */
export interface StreamAgentHandoffEvent {
  type: 'stream.agent.handoff';
  fromAgent: string;
  toAgent: string;
  /** Optional reason provided by the model for the handoff */
  reason?: string;
}

/** A form field descriptor for input-required forms. @public */
export interface StreamFormField {
  name: string;
  type?: string;
  label?: string;
  description?: string;
  required?: boolean;
  defaultValue?: unknown;
  options?: Array<{ label: string; value: string }>;
  [key: string]: unknown;
}

/** Shape of a form render request from an A2A agent. @public */
export interface StreamFormDescriptor {
  title?: string;
  description?: string;
  fields?: StreamFormField[];
  [key: string]: unknown;
}

/** Agent requests structured form input from the user (A2A INPUT_REQUIRED). @public */
export interface StreamFormRequestEvent {
  type: 'stream.form.request';
  taskId?: string;
  contextId?: string;
  form: StreamFormDescriptor;
}

/** Shape of a secret demand from an A2A agent. @public */
export interface StreamSecretDemand {
  name: string;
  description?: string;
  [key: string]: unknown;
}

/** Agent requires authentication (A2A AUTH_REQUIRED -- OAuth or secrets). @public */
export interface StreamAuthRequiredEvent {
  type: 'stream.auth.required';
  taskId?: string;
  authType: 'oauth' | 'secret';
  url?: string;
  demands?: { secrets?: StreamSecretDemand[]; [key: string]: unknown };
}

/** Agent is streaming an artifact (code, file, document). @public */
export interface StreamArtifactEvent {
  type: 'stream.artifact';
  artifactId: string;
  name?: string;
  description?: string;
  content: string;
  append?: boolean;
  lastChunk?: boolean;
}

/** A single citation reference. @public */
export interface StreamCitationReference {
  title?: string;
  url?: string;
  snippet?: string;
  [key: string]: unknown;
}

/** Agent provides source citations for its response. @public */
export interface StreamCitationEvent {
  type: 'stream.citation';
  citations: StreamCitationReference[];
}

/** An error occurred during streaming. @public */
export interface StreamErrorEvent {
  type: 'stream.error';
  error: string;
  code?: string;
  title?: string;
  context?: Record<string, unknown>;
}

/**
 * Union of all normalized streaming events.
 *
 * This is the single source of truth for the streaming contract
 * between the backend and frontend. Both the backend's EventNormalizer
 * and the frontend's StreamingMessage reducer use this type.
 * @public
 */
export type NormalizedStreamEvent =
  | StreamStartedEvent
  | StreamTextDeltaEvent
  | StreamTextDoneEvent
  | StreamReasoningDeltaEvent
  | StreamReasoningDoneEvent
  | StreamToolDiscoveryEvent
  | StreamToolStartedEvent
  | StreamToolDeltaEvent
  | StreamToolCompletedEvent
  | StreamToolFailedEvent
  | StreamToolApprovalEvent
  | StreamBackendToolExecutingEvent
  | StreamRagResultsEvent
  | StreamAgentHandoffEvent
  | StreamFormRequestEvent
  | StreamAuthRequiredEvent
  | StreamArtifactEvent
  | StreamCitationEvent
  | StreamCompletedEvent
  | StreamErrorEvent;
