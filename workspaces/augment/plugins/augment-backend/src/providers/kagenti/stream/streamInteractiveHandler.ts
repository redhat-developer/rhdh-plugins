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
} from '@red-hat-developer-hub/backstage-plugin-augment-common';
import {
  handleTaskStatusUpdate,
  TaskStatusUpdateType,
} from '@kagenti/adk/core';
import type { TaskStatusUpdateEvent } from '@kagenti/adk';

export interface StatusUpdate {
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
}

export function handleInteractiveState(
  update: StatusUpdate,
  events: NormalizedStreamEvent[],
  accumulatedTextRef: { value: string },
  extractStatusText: (status: StatusUpdate['status']) => string,
  verboseLogger?: LoggerService,
): void {
  try {
    const a2aEvent: TaskStatusUpdateEvent = {
      taskId: update.taskId,
      contextId: update.contextId,
      status: {
        state: update.status.state as TaskStatusUpdateEvent['status']['state'],
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
            accumulatedTextRef.value += result.text;
            events.push({ type: 'stream.text.delta', delta: result.text });
          }
          break;
        default:
          break;
      }
    }

    if (results.length === 0) {
      const text = extractStatusText(update.status);
      if (text) {
        accumulatedTextRef.value += text;
        events.push({ type: 'stream.text.delta', delta: text });
      }
    }
  } catch (err) {
    verboseLogger?.warn(
      `handleTaskStatusUpdate failed for state ${update.status.state}, falling back to text: ${err}`,
    );
    const text = extractStatusText(update.status);
    if (text) {
      accumulatedTextRef.value += text;
      events.push({ type: 'stream.text.delta', delta: text });
    }
  }
}
