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
import type {
  NormalizedStreamEvent,
  StreamFormDescriptor,
  StreamCitationReference,
} from '@red-hat-developer-hub/backstage-plugin-augment-common';
import {
  handleTaskStatusUpdate,
  TaskStatusUpdateType,
} from '@kagenti/adk/core';
import {
  TRAJECTORY_EXTENSION_URI,
  ERROR_EXTENSION_URI,
  CITATION_EXTENSION_URI,
} from '@kagenti/adk/extensions';
import type { TaskStatusUpdateEvent } from '@kagenti/adk';

const JSONRPC_ERROR_MESSAGES: Record<number, string> = {
  [-32700]: 'Parse error',
  [-32600]: 'Invalid request',
  [-32601]: 'Method not found',
  [-32602]: 'Invalid parameters',
  [-32603]: 'Internal error',
  [-32001]: 'Task not found',
  [-32002]: 'Task not cancelable',
  [-32003]: 'Push notifications not supported',
  [-32004]: 'Unsupported operation',
  [-32005]: 'Content type not supported',
  [-32006]: 'Invalid agent response',
  [-32007]: 'Extended card not configured',
};

/**
 * Raw SSE payload from Kagenti. Supports both the A2A protocol format
 * (statusUpdate/artifactUpdate/message) and the legacy flat format
 * for backward compatibility.
 */
interface KagentiStreamPayload {
  // A2A protocol fields
  statusUpdate?: {
    taskId: string;
    contextId: string;
    status: {
      state: string;
      message?: {
        messageId?: string;
        parts?: Array<Record<string, unknown>>;
        metadata?: Record<string, unknown>;
        [key: string]: unknown;
      };
      timestamp?: string;
    };
    metadata?: Record<string, unknown>;
  };
  artifactUpdate?: {
    taskId: string;
    contextId: string;
    artifact: {
      artifactId: string;
      name?: string;
      description?: string;
      parts: Array<Record<string, unknown>>;
      metadata?: Record<string, unknown>;
    };
    append?: boolean;
    lastChunk?: boolean;
  };

  // JSONRPC error
  error?:
    | {
        code: number;
        message: string;
        data?: Record<string, unknown>;
      }
    | string;

  // Legacy flat fields (backward compat with older Kagenti API versions)
  content?: string;
  session_id?: string;
  context_id?: string;
  event?: {
    type?: string;
    state?: string;
    taskId?: string;
    final?: boolean;
    message?: string | Record<string, unknown>;
  };
  done?: boolean;
  is_complete?: boolean;
}

/**
 * Stateful normalizer that maps Kagenti SSE events to NormalizedStreamEvent[].
 *
 * Supports both the official A2A protocol format (TaskStatusUpdateEvent,
 * TaskArtifactUpdateEvent) and the legacy flat SSE format for backward
 * compatibility. Uses @kagenti/adk handlers for typed result processing
 * of INPUT_REQUIRED and AUTH_REQUIRED states.
 */
export class KagentiStreamNormalizer {
  private started = false;
  private completed = false;
  private accumulatedText = '';
  private readonly verboseLogger?: LoggerService;
  private _hasJsonRpcStreamingError = false;

  constructor(verboseLogger?: LoggerService) {
    this.verboseLogger = verboseLogger;
  }

  /** True if the stream received a JSONRPC -32603 "streaming not supported" error. */
  get hasJsonRpcStreamingError(): boolean {
    return this._hasJsonRpcStreamingError;
  }

  normalize(jsonLine: string): NormalizedStreamEvent[] {
    let payload: KagentiStreamPayload;
    try {
      payload = JSON.parse(jsonLine);
    } catch {
      this.verboseLogger?.warn(
        `Unparseable SSE line from Kagenti, skipping: ${jsonLine.substring(0, 200)}`,
      );
      return [
        {
          type: 'stream.error',
          error: 'Unparseable SSE data received from Kagenti',
        },
      ];
    }

    const events: NormalizedStreamEvent[] = [];

    if (payload.statusUpdate) {
      this.handleStatusUpdate(payload.statusUpdate, events);
    } else if (payload.artifactUpdate) {
      this.handleArtifactUpdate(payload.artifactUpdate, events);
    } else if (
      typeof payload.error === 'object' &&
      payload.error?.code !== undefined
    ) {
      this.handleJsonRpcError(payload.error, events);
    } else {
      this.handleLegacyPayload(payload, events);
    }

    if (this.verboseLogger && events.length > 0) {
      this.verboseLogger.debug(
        `KagentiStream: ${events.map(e => e.type).join(', ')}`,
        { raw: jsonLine.substring(0, 500) },
      );
    }

    return events;
  }

  private ensureStarted(
    events: NormalizedStreamEvent[],
    responseId?: string,
  ): void {
    if (!this.started) {
      this.started = true;
      events.push({
        type: 'stream.started',
        responseId: responseId ?? 'kagenti',
      });
    }
  }

  private emitCompleted(events: NormalizedStreamEvent[]): void {
    if (!this.completed) {
      this.completed = true;
      if (this.accumulatedText) {
        events.push({ type: 'stream.text.done', text: this.accumulatedText });
      }
      events.push({ type: 'stream.completed' });
    }
  }

  // ---------------------------------------------------------------------------
  // A2A Protocol: TaskStatusUpdateEvent
  // ---------------------------------------------------------------------------

  private handleStatusUpdate(
    update: NonNullable<KagentiStreamPayload['statusUpdate']>,
    events: NormalizedStreamEvent[],
  ): void {
    this.ensureStarted(events, update.contextId);

    const state = update.status.state;

    switch (state) {
      case 'TASK_STATE_SUBMITTED':
      case 'TASK_STATE_UNSPECIFIED':
        break;

      case 'TASK_STATE_WORKING':
        this.extractTextAsReasoning(update.status, events);
        this.extractUiExtensions(update.status.message?.metadata, events);
        break;

      case 'TASK_STATE_COMPLETED':
        this.extractTextFromStatus(update.status, events);
        this.extractUiExtensions(update.status.message?.metadata, events);
        this.emitCompleted(events);
        break;

      case 'TASK_STATE_FAILED':
        this.extractStructuredError(
          update.status.message?.metadata,
          events,
          update,
        );
        this.emitCompleted(events);
        break;

      case 'TASK_STATE_CANCELED':
        this.emitCompleted(events);
        break;

      case 'TASK_STATE_REJECTED':
        events.push({
          type: 'stream.error',
          error:
            this.extractStatusText(update.status) ||
            'Agent rejected the request',
          code: 'kagenti_rejected',
        });
        this.emitCompleted(events);
        break;

      case 'TASK_STATE_INPUT_REQUIRED':
      case 'TASK_STATE_AUTH_REQUIRED':
        this.handleInteractiveState(update, events);
        break;

      default:
        this.extractTextFromStatus(update.status, events);
        break;
    }
  }

  /**
   * Delegate to ADK's handleTaskStatusUpdate for INPUT_REQUIRED and AUTH_REQUIRED.
   */
  private handleInteractiveState(
    update: NonNullable<KagentiStreamPayload['statusUpdate']>,
    events: NormalizedStreamEvent[],
  ): void {
    try {
      const a2aEvent: TaskStatusUpdateEvent = {
        taskId: update.taskId,
        contextId: update.contextId,
        status: {
          state: update.status
            .state as TaskStatusUpdateEvent['status']['state'],
          message: update.status
            .message as TaskStatusUpdateEvent['status']['message'],
          timestamp: update.status.timestamp,
        },
        metadata: update.metadata,
      };

      const results = handleTaskStatusUpdate(a2aEvent);

      for (const result of results) {
        switch (result.type) {
          case TaskStatusUpdateType.FormRequired:
            events.push({
              type: 'stream.form.request',
              taskId: update.taskId,
              contextId: update.contextId,
              form: result.form as unknown as StreamFormDescriptor,
            });
            break;

          case TaskStatusUpdateType.ApprovalRequired: {
            const approvalId = (result as { id?: string }).id ?? update.taskId;
            events.push({
              type: 'stream.tool.approval',
              callId: approvalId,
              name: 'agent-approval',
              arguments: JSON.stringify(result.request),
              responseId: update.contextId,
            });
            break;
          }
          case TaskStatusUpdateType.OAuthRequired:
            events.push({
              type: 'stream.auth.required',
              taskId: update.taskId,
              authType: 'oauth',
              url: result.url,
            });
            break;

          case TaskStatusUpdateType.SecretRequired:
            events.push({
              type: 'stream.auth.required',
              taskId: update.taskId,
              authType: 'secret',
              demands: result.demands as {
                secrets?: Array<{ name: string; description?: string }>;
                [key: string]: unknown;
              },
            });
            break;

          case TaskStatusUpdateType.TextInputRequired:
            if (result.text) {
              this.accumulatedText += result.text;
              events.push({ type: 'stream.text.delta', delta: result.text });
            }
            break;

          default:
            break;
        }
      }

      if (results.length === 0) {
        const text = this.extractStatusText(update.status);
        if (text) {
          this.accumulatedText += text;
          events.push({ type: 'stream.text.delta', delta: text });
        }
      }
    } catch (err) {
      this.verboseLogger?.warn(
        `handleTaskStatusUpdate failed for state ${update.status.state}, falling back to text: ${err}`,
      );
      const text = this.extractStatusText(update.status);
      if (text) {
        this.accumulatedText += text;
        events.push({ type: 'stream.text.delta', delta: text });
      }
    }
  }

  // ---------------------------------------------------------------------------
  // A2A Protocol: TaskArtifactUpdateEvent
  // ---------------------------------------------------------------------------

  private handleArtifactUpdate(
    update: NonNullable<KagentiStreamPayload['artifactUpdate']>,
    events: NormalizedStreamEvent[],
  ): void {
    this.ensureStarted(events, update.contextId);

    const textParts = (update.artifact.parts ?? [])
      .filter(p => 'text' in p)
      .map(p => (p as { text: string }).text);

    const content = textParts.join('');

    if (content) {
      events.push({
        type: 'stream.artifact',
        artifactId: update.artifact.artifactId,
        name: update.artifact.name,
        description: update.artifact.description,
        content,
        append: update.append,
        lastChunk: update.lastChunk,
      });

      // Mirror the legacy behavior: artifact text also appears in the
      // main chat bubble so the user sees the response inline, not only
      // inside a collapsible artifact card.
      this.accumulatedText += content;
      events.push({ type: 'stream.text.delta', delta: content });
    }

    if (update.lastChunk) {
      this.emitCompleted(events);
    }
  }

  // ---------------------------------------------------------------------------
  // JSONRPC Error
  // ---------------------------------------------------------------------------

  private handleJsonRpcError(
    error: { code: number; message: string; data?: Record<string, unknown> },
    events: NormalizedStreamEvent[],
  ): void {
    this.ensureStarted(events);

    if (error.code === -32603) {
      this._hasJsonRpcStreamingError = true;
    }

    const humanMessage = JSONRPC_ERROR_MESSAGES[error.code];
    const errorText = humanMessage
      ? `${humanMessage}: ${error.message}`
      : error.message;
    events.push({
      type: 'stream.error',
      error: errorText,
      code: `jsonrpc_${Math.abs(error.code)}`,
    });
    this.emitCompleted(events);
  }

  // ---------------------------------------------------------------------------
  // UI Extension Metadata Extraction
  // ---------------------------------------------------------------------------

  private extractUiExtensions(
    metadata: Record<string, unknown> | undefined,
    events: NormalizedStreamEvent[],
  ): void {
    if (!metadata) return;

    const trajectory = metadata[TRAJECTORY_EXTENSION_URI];
    if (Array.isArray(trajectory)) {
      for (const step of trajectory) {
        const title = (step as Record<string, unknown>)?.title;
        const content = (step as Record<string, unknown>)?.content;
        const text = [title, content].filter(Boolean).join(': ');
        if (text) {
          events.push({ type: 'stream.reasoning.delta', delta: `${text}\n` });
        }
      }
    }

    const citation = metadata[CITATION_EXTENSION_URI];
    if (Array.isArray(citation) && citation.length > 0) {
      events.push({
        type: 'stream.citation',
        citations: citation as StreamCitationReference[],
      });
    }
  }

  private extractStructuredError(
    metadata: Record<string, unknown> | undefined,
    events: NormalizedStreamEvent[],
    update: NonNullable<KagentiStreamPayload['statusUpdate']>,
  ): void {
    const errorMeta = metadata?.[ERROR_EXTENSION_URI] as
      | {
          error?: { title?: string; message?: string };
          context?: Record<string, unknown>;
        }
      | undefined;

    if (errorMeta?.error) {
      events.push({
        type: 'stream.error',
        error: errorMeta.error.message ?? 'Agent task failed',
        code: 'kagenti_task_failed',
        title: errorMeta.error.title,
        context: errorMeta.context,
      });
    } else {
      const msg = this.extractStatusText(update.status) || 'Agent task failed';
      events.push({
        type: 'stream.error',
        error: msg,
        code: 'kagenti_task_failed',
      });
    }
  }

  // ---------------------------------------------------------------------------
  // Text extraction helpers
  // ---------------------------------------------------------------------------

  private extractTextFromStatus(
    status: NonNullable<KagentiStreamPayload['statusUpdate']>['status'],
    events: NormalizedStreamEvent[],
  ): void {
    const text = this.extractStatusText(status);
    if (text) {
      this.accumulatedText += text;
      events.push({ type: 'stream.text.delta', delta: text });
    }
  }

  /**
   * Forward all WORKING-state status text as reasoning events.
   * This keeps the SSE connection alive with real progress and shows
   * agent status (e.g. "Starting the story pipeline...") in the UI.
   */
  private extractTextAsReasoning(
    status: NonNullable<KagentiStreamPayload['statusUpdate']>['status'],
    events: NormalizedStreamEvent[],
  ): void {
    const text = this.extractStatusText(status);
    if (text) {
      events.push({ type: 'stream.reasoning.delta', delta: text });
    }
  }

  private extractStatusText(
    status: NonNullable<KagentiStreamPayload['statusUpdate']>['status'],
  ): string {
    if (!status.message) return '';

    const parts = status.message.parts;
    if (Array.isArray(parts)) {
      return parts
        .filter(p => 'text' in p)
        .map(p => (p as { text: string }).text)
        .join('');
    }

    return '';
  }

  // ---------------------------------------------------------------------------
  // Legacy flat format (backward compatibility)
  // ---------------------------------------------------------------------------

  private handleLegacyPayload(
    payload: KagentiStreamPayload,
    events: NormalizedStreamEvent[],
  ): void {
    this.ensureStarted(events, payload.session_id ?? payload.context_id);

    if (typeof payload.error === 'string') {
      events.push({
        type: 'stream.error',
        error: payload.error,
        code: 'kagenti_error',
      });
      this.emitCompleted(events);
      return;
    }

    const evt = payload.event;
    const normalizedState = evt?.state?.toUpperCase();

    if (normalizedState === 'FAILED') {
      const msg =
        typeof evt?.message === 'string' ? evt.message : 'Agent task failed';
      events.push({
        type: 'stream.error',
        error: msg,
        code: 'kagenti_task_failed',
      });
      this.emitCompleted(events);
      return;
    }

    if (evt?.type === 'status' && evt.message) {
      const text =
        typeof evt.message === 'string'
          ? evt.message
          : JSON.stringify(evt.message);
      if (text) {
        if (normalizedState === 'WORKING') {
          events.push({ type: 'stream.reasoning.delta', delta: text });
        } else {
          this.accumulatedText += text;
          events.push({ type: 'stream.text.delta', delta: text });
        }
      }
    }

    if (evt?.type === 'artifact' && payload.content) {
      const artifactName =
        typeof (evt as Record<string, unknown>).name === 'string'
          ? ((evt as Record<string, unknown>).name as string)
          : undefined;
      events.push({
        type: 'stream.artifact',
        artifactId: `legacy-${Date.now()}`,
        name: artifactName,
        content: payload.content,
        append: false,
        lastChunk: true,
      });
      // Legacy Kagenti API delivers response text as artifact events;
      // also emit as text delta so the content renders in chat.
      this.accumulatedText += payload.content;
      events.push({ type: 'stream.text.delta', delta: payload.content });
    }

    const handledContent =
      evt?.type === 'artifact' || (evt?.type === 'status' && evt.message);
    if (!handledContent && payload.content) {
      this.accumulatedText += payload.content;
      events.push({ type: 'stream.text.delta', delta: payload.content });
    }

    const isFinal = evt?.final === true || normalizedState === 'COMPLETED';
    const isDone = payload.done === true || payload.is_complete === true;

    if ((isFinal || isDone) && !this.completed) {
      this.emitCompleted(events);
    }
  }
}

/**
 * Test-only helper that normalizes a single isolated SSE line.
 *
 * WARNING: Creates a fresh normalizer per call, so `started`/`completed`
 * state is reset every time. Do NOT use for real multi-line streams --
 * use the stateful `KagentiStreamNormalizer` class instead.
 *
 * @internal
 */
export function normalizeKagentiEvent(
  jsonLine: string,
): NormalizedStreamEvent[] {
  const normalizer = new KagentiStreamNormalizer();
  return normalizer.normalize(jsonLine);
}
