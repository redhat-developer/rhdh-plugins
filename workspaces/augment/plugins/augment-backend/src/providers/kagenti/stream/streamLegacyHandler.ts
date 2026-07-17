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

import type { NormalizedStreamEvent } from '@red-hat-developer-hub/backstage-plugin-augment-common';

export interface LegacyPayload {
  content?: string;
  session_id?: string;
  context_id?: string;
  error?:
    | string
    | { code: number; message: string; data?: Record<string, unknown> };
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

export function handleLegacyPayload(
  payload: LegacyPayload,
  events: NormalizedStreamEvent[],
  accumulatedTextRef: { value: string },
  ensureStarted: (events: NormalizedStreamEvent[], responseId?: string) => void,
  emitCompleted: (events: NormalizedStreamEvent[]) => void,
  completed: boolean,
): void {
  ensureStarted(events, payload.session_id ?? payload.context_id);

  if (typeof payload.error === 'string') {
    events.push({
      type: 'stream.error',
      error: payload.error,
      code: 'kagenti_error',
    });
    emitCompleted(events);
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
    emitCompleted(events);
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
        accumulatedTextRef.value += text;
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
    accumulatedTextRef.value += payload.content;
    events.push({ type: 'stream.text.delta', delta: payload.content });
  }

  const handledContent =
    evt?.type === 'artifact' || (evt?.type === 'status' && evt.message);
  if (!handledContent && payload.content) {
    accumulatedTextRef.value += payload.content;
    events.push({ type: 'stream.text.delta', delta: payload.content });
  }

  const isFinal = evt?.final === true || normalizedState === 'COMPLETED';
  const isDone = payload.done === true || payload.is_complete === true;

  if ((isFinal || isDone) && !completed) {
    emitCompleted(events);
  }
}
