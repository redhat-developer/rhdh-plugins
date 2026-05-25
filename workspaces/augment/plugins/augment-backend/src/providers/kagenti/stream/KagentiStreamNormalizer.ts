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
import type { NormalizedStreamEvent } from '@red-hat-developer-hub/backstage-plugin-augment-common';
import { handleInteractiveState } from './streamInteractiveHandler';
import type { StatusUpdate } from './streamInteractiveHandler';
import {
  extractUiExtensions,
  extractStructuredError,
} from './streamUiExtensions';

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

interface KagentiStreamPayload {
  statusUpdate?: StatusUpdate;
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
  error?:
    | { code: number; message: string; data?: Record<string, unknown> }
    | string;
  content?: string;
  session_id?: string;
  context_id?: string;
  event?: {
    type?: string;
    state?: string;
    taskId?: string;
    final?: boolean;
    message?: string | Record<string, unknown>;
    [key: string]: unknown;
  };
  done?: boolean;
  is_complete?: boolean;
}

export class KagentiStreamNormalizer {
  private started = false;
  private completed = false;
  private accumulatedText = '';
  private readonly verboseLogger?: LoggerService;
  private _hasJsonRpcStreamingError = false;
  private currentGroupId: string | undefined;

  constructor(verboseLogger?: LoggerService) {
    this.verboseLogger = verboseLogger;
  }

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
      this.handleLegacyInline(payload, events);
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
      if (this.accumulatedText)
        events.push({ type: 'stream.text.done', text: this.accumulatedText });
      events.push({ type: 'stream.completed' });
    }
  }

  private handleStatusUpdate(
    update: StatusUpdate,
    events: NormalizedStreamEvent[],
  ): void {
    this.ensureStarted(events, update.contextId);
    this.detectAgentHandoff(update.metadata, events);
    const state = update.status.state;

    switch (state) {
      case 'TASK_STATE_SUBMITTED':
      case 'TASK_STATE_UNSPECIFIED':
        break;
      case 'TASK_STATE_WORKING': {
        this.extractTextAsReasoning(update.status, events);
        const gRef1 = { value: this.currentGroupId };
        extractUiExtensions(update.status.message?.metadata, events, gRef1);
        this.currentGroupId = gRef1.value;
        break;
      }
      case 'TASK_STATE_COMPLETED': {
        this.extractTextFromStatus(update.status, events);
        const gRef2 = { value: this.currentGroupId };
        extractUiExtensions(update.status.message?.metadata, events, gRef2);
        this.currentGroupId = gRef2.value;
        this.emitCompleted(events);
        break;
      }
      case 'TASK_STATE_FAILED':
        extractStructuredError(
          update.status.message?.metadata,
          events,
          this.extractStatusText(update.status) || 'Agent task failed',
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
      case 'TASK_STATE_AUTH_REQUIRED': {
        const ref = { value: this.accumulatedText };
        handleInteractiveState(
          update,
          events,
          ref,
          s => this.extractStatusText(s),
          this.verboseLogger,
        );
        this.accumulatedText = ref.value;
        break;
      }
      default:
        this.verboseLogger?.warn(
          `Unknown A2A task state "${state}", treating as terminal`,
        );
        this.extractTextFromStatus(update.status, events);
        this.emitCompleted(events);
        break;
    }
  }

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
      this.accumulatedText += content;
      events.push({ type: 'stream.text.delta', delta: content });
    }
    if (update.lastChunk) this.emitCompleted(events);
  }

  private handleJsonRpcError(
    error: { code: number; message: string },
    events: NormalizedStreamEvent[],
  ): void {
    this.ensureStarted(events);
    if (error.code === -32603) this._hasJsonRpcStreamingError = true;
    const humanMessage = JSONRPC_ERROR_MESSAGES[error.code];
    events.push({
      type: 'stream.error',
      error: humanMessage ? `${humanMessage}: ${error.message}` : error.message,
      code: `jsonrpc_${Math.abs(error.code)}`,
    });
    this.emitCompleted(events);
  }

  private detectAgentHandoff(
    metadata: Record<string, unknown> | undefined,
    events: NormalizedStreamEvent[],
  ): void {
    if (!metadata) return;
    const agentId =
      metadata.agent_name ?? metadata.group_id ?? metadata.agent_id;
    if (typeof agentId === 'string' && agentId !== this.currentGroupId) {
      const fromAgent = this.currentGroupId;
      this.currentGroupId = agentId;
      events.push({
        type: 'stream.agent.handoff',
        fromAgent,
        toAgent: agentId,
      } as NormalizedStreamEvent);
    }
  }

  private extractTextFromStatus(
    status: StatusUpdate['status'],
    events: NormalizedStreamEvent[],
  ): void {
    const text = this.extractStatusText(status);
    if (text) {
      this.accumulatedText += text;
      events.push({ type: 'stream.text.delta', delta: text });
    }
  }

  private extractTextAsReasoning(
    status: StatusUpdate['status'],
    events: NormalizedStreamEvent[],
  ): void {
    const text = this.extractStatusText(status);
    if (text) events.push({ type: 'stream.reasoning.delta', delta: text });
  }

  private extractStatusText(status: StatusUpdate['status']): string {
    if (!status.message) return '';
    const parts = status.message.parts;
    if (Array.isArray(parts))
      return parts
        .filter(p => 'text' in p)
        .map(p => (p as { text: string }).text)
        .join('');
    return '';
  }

  private handleLegacyInline(
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

export function normalizeKagentiEvent(
  jsonLine: string,
): NormalizedStreamEvent[] {
  return new KagentiStreamNormalizer().normalize(jsonLine);
}
