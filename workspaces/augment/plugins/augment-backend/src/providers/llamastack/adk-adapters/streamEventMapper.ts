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
import {
  type RunStreamEvent,
  normalizeLlamaStackEvent,
} from '@augment-adk/augment-adk';

/**
 * Maps an ADK `RunStreamEvent` to zero or more JSON strings
 * in the `stream.*` format the frontend reducer expects.
 *
 * - `raw_model_event`: normalized via the ADK's LlamaStack
 *   normalizer, which produces `stream.text.delta`,
 *   `stream.reasoning.delta`, `stream.started`, etc.
 * - Orchestration events (`tool_called`, `tool_output`,
 *   `handoff_occurred`, etc.) are mapped directly to the
 *   corresponding `stream.*` type.
 * - Events already covered by raw normalization
 *   (`text_delta`, `reasoning_delta`, `text_done`) are
 *   suppressed to avoid duplicate data.
 */
export function mapAdkEventToFrontend(event: RunStreamEvent): string[] {
  switch (event.type) {
    case 'raw_model_event':
      return normalizeLlamaStackEvent(event.data).map(e => JSON.stringify(e));

    case 'agent_start':
      return [
        JSON.stringify({
          type: 'stream.agent.start',
          agentKey: event.agentKey,
          agentName: event.agentName,
          turn: event.turn,
        }),
      ];

    case 'agent_end':
      return [
        JSON.stringify({
          type: 'stream.agent.end',
          agentKey: event.agentKey,
          agentName: event.agentName,
          turn: event.turn,
        }),
      ];

    case 'handoff_occurred':
      return [
        JSON.stringify({
          type: 'stream.agent.handoff',
          fromAgent: event.fromAgent,
          toAgent: event.toAgent,
          reason: event.reason,
        }),
      ];

    case 'tool_called':
      return [
        JSON.stringify({
          type: 'stream.tool.started',
          callId: event.callId,
          name: event.toolName,
          serverLabel: 'function',
          arguments: event.arguments,
        }),
      ];

    case 'tool_output': {
      const isError = isToolOutputError(event.output);
      if (isError) {
        return [
          JSON.stringify({
            type: 'stream.tool.failed',
            callId: event.callId,
            name: event.toolName,
            serverLabel: 'function',
            error: event.output,
          }),
        ];
      }
      return [
        JSON.stringify({
          type: 'stream.tool.completed',
          callId: event.callId,
          name: event.toolName,
          serverLabel: 'function',
          output: event.output,
        }),
      ];
    }

    case 'approval_requested':
      return [
        JSON.stringify({
          type: 'stream.tool.approval',
          callId: event.approvalRequestId,
          name: event.toolName,
          serverLabel: event.serverLabel,
          arguments: event.arguments,
        }),
      ];

    case 'error':
      return [
        JSON.stringify({
          type: 'stream.error',
          error: event.message,
          code: event.code,
        }),
      ];

    case 'text_delta':
    case 'reasoning_delta':
    case 'text_done':
      return [];

    default: {
      const _exhaustive: never = event;
      void _exhaustive;
      return [];
    }
  }
}

function isToolOutputError(output: string): boolean {
  try {
    const parsed = JSON.parse(output);
    return typeof parsed === 'object' && parsed !== null && 'error' in parsed;
  } catch {
    return false;
  }
}
