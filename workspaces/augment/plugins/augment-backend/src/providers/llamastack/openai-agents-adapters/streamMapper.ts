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
import type { RunStreamEvent } from '@openai/agents-core';
import type { NormalizedStreamEvent } from '@red-hat-developer-hub/backstage-plugin-augment-common';

/**
 * Maps `@openai/agents-core` RunStreamEvent instances to zero or more
 * JSON-encoded NormalizedStreamEvent strings that the existing frontend
 * reducer can consume without modification.
 *
 * This is the critical compatibility bridge: the agents-core Runner
 * emits its own event types (RunRawModelStreamEvent, RunItemStreamEvent,
 * RunAgentUpdatedStreamEvent) and we translate them to the `stream.*`
 * event taxonomy already understood by the frontend.
 */
export function mapRunStreamEventToFrontend(
  event: RunStreamEvent,
): string[] {
  switch (event.type) {
    case 'raw_model_stream_event':
      return mapRawModelEvent(event.data as unknown);

    case 'run_item_stream_event':
      return mapItemEvent(event as Extract<RunStreamEvent, { type: 'run_item_stream_event' }>);

    case 'agent_updated_stream_event':
      return [
        JSON.stringify({
          type: 'stream.agent.handoff',
          toAgent: event.agent.name,
        } satisfies NormalizedStreamEvent),
      ];

    default:
      return [];
  }
}

function mapRawModelEvent(
  data: unknown,
): string[] {
  if (!data || typeof data !== 'object') return [];

  const eventType = (data as { type?: string }).type;

  switch (eventType) {
    case 'output_text_delta':
      return [
        JSON.stringify({
          type: 'stream.text.delta',
          delta: (data as { delta?: string }).delta ?? '',
        } satisfies NormalizedStreamEvent),
      ];

    case 'response_started':
      return [
        JSON.stringify({
          type: 'stream.started',
          responseId: '',
        } satisfies NormalizedStreamEvent),
      ];

    case 'response_done': {
      const resp = (data as { response?: Record<string, unknown> }).response;
      return [
        JSON.stringify({
          type: 'stream.text.done',
          text: extractTextFromOutput(resp),
        } satisfies NormalizedStreamEvent),
      ];
    }

    case 'model': {
      const inner = (data as { event?: Record<string, unknown> }).event;
      if (inner) {
        return mapLlamaStackRawEvent(inner);
      }
      return [];
    }

    default:
      return [];
  }
}

/**
 * Handle raw LlamaStack SSE events that come through as `model`-type
 * StreamEvents. These are the native Responses API event shapes.
 */
function mapLlamaStackRawEvent(
  event: Record<string, unknown>,
): string[] {
  const eventType = event.type as string | undefined;

  switch (eventType) {
    case 'response.output_text.delta':
      return [
        JSON.stringify({
          type: 'stream.text.delta',
          delta: (event.delta as string) ?? '',
        } satisfies NormalizedStreamEvent),
      ];

    case 'response.reasoning.delta':
    case 'response.reasoning_summary_text.delta':
      return [
        JSON.stringify({
          type: 'stream.reasoning.delta',
          delta: (event.delta as string) ?? '',
        } satisfies NormalizedStreamEvent),
      ];

    case 'response.reasoning.done':
    case 'response.reasoning_summary_text.done':
      return [
        JSON.stringify({
          type: 'stream.reasoning.done',
          text: (event.text as string) ?? '',
        } satisfies NormalizedStreamEvent),
      ];

    case 'response.output_text.done':
      return [
        JSON.stringify({
          type: 'stream.text.done',
          text: (event.text as string) ?? '',
        } satisfies NormalizedStreamEvent),
      ];

    case 'response.function_call_arguments.delta':
      return [
        JSON.stringify({
          type: 'stream.tool.delta',
          callId: (event.call_id as string) ?? (event.item_id as string) ?? '',
          delta: (event.delta as string) ?? '',
        } satisfies NormalizedStreamEvent),
      ];

    case 'response.function_call_arguments.done': {
      const name =
        (event.name as string) ?? (event.function_name as string) ?? '';
      const callId =
        (event.call_id as string) ?? (event.item_id as string) ?? '';
      return [
        JSON.stringify({
          type: 'stream.tool.started',
          callId,
          name,
          serverLabel: 'function',
        } satisfies NormalizedStreamEvent),
      ];
    }

    case 'response.web_search_call.completed':
      return [
        JSON.stringify({
          type: 'stream.tool.completed',
          callId: (event.item_id as string) ?? '',
          name: 'web_search',
          serverLabel: 'web_search',
          output: '',
        } satisfies NormalizedStreamEvent),
      ];

    case 'response.file_search_call.completed':
      return [
        JSON.stringify({
          type: 'stream.tool.completed',
          callId: (event.item_id as string) ?? '',
          name: 'file_search',
          serverLabel: 'file_search',
          output: '',
        } satisfies NormalizedStreamEvent),
      ];

    case 'response.created':
      return [
        JSON.stringify({
          type: 'stream.started',
          responseId: (event.response as Record<string, unknown>)?.id as string ?? '',
          model: (event.response as Record<string, unknown>)?.model as string,
        } satisfies NormalizedStreamEvent),
      ];

    case 'response.completed':
    case 'response.done':
      return [];

    default:
      return [];
  }
}

function mapItemEvent(
  event: Extract<RunStreamEvent, { type: 'run_item_stream_event' }>,
): string[] {
  const item = event.item;

  switch (event.name) {
    case 'tool_called': {
      const rawItem = item.rawItem as Record<string, unknown> | undefined;
      return [
        JSON.stringify({
          type: 'stream.tool.started',
          callId: (rawItem?.id as string) ?? (rawItem?.callId as string) ?? '',
          name: (rawItem?.name as string) ?? '',
          serverLabel: 'function',
        } satisfies NormalizedStreamEvent),
      ];
    }

    case 'tool_output': {
      const rawItem2 = item.rawItem as Record<string, unknown> | undefined;
      const output = (item as { output?: string | unknown }).output;
      const outputStr =
        typeof output === 'string' ? output : JSON.stringify(output ?? '');
      const isError = isToolOutputError(outputStr);

      if (isError) {
        return [
          JSON.stringify({
            type: 'stream.tool.failed',
            callId: (rawItem2?.id as string) ?? (rawItem2?.callId as string) ?? '',
            name: (rawItem2?.name as string) ?? '',
            serverLabel: 'function',
            error: outputStr,
          } satisfies NormalizedStreamEvent),
        ];
      }
      return [
        JSON.stringify({
          type: 'stream.tool.completed',
          callId: (rawItem2?.id as string) ?? (rawItem2?.callId as string) ?? '',
          name: (rawItem2?.name as string) ?? '',
          serverLabel: 'function',
          output: outputStr,
        } satisfies NormalizedStreamEvent),
      ];
    }

    case 'tool_approval_requested': {
      const rawItem3 = item.rawItem as Record<string, unknown> | undefined;
      return [
        JSON.stringify({
          type: 'stream.tool.approval',
          callId: (rawItem3?.id as string) ?? '',
          name: (item as { name?: string }).name ?? '',
          serverLabel: 'function',
          arguments: (item as { arguments?: string }).arguments,
        } satisfies NormalizedStreamEvent),
      ];
    }

    case 'handoff_requested':
    case 'handoff_occurred': {
      const handoffItem = item as {
        targetAgent?: { name: string };
        sourceAgent?: { name: string };
      };
      return [
        JSON.stringify({
          type: 'stream.agent.handoff',
          fromAgent: handoffItem.sourceAgent?.name,
          toAgent: handoffItem.targetAgent?.name ?? '',
        } satisfies NormalizedStreamEvent),
      ];
    }

    case 'message_output_created':
    case 'reasoning_item_created':
    case 'tool_search_called':
    case 'tool_search_output_created':
      return [];

    default:
      return [];
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

function extractTextFromOutput(
  response: Record<string, unknown> | undefined,
): string {
  if (!response?.output) return '';
  const output = response.output as Array<Record<string, unknown>>;
  const texts: string[] = [];
  for (const item of output) {
    if (item.role === 'assistant' && Array.isArray(item.content)) {
      for (const part of item.content) {
        if (
          (part as Record<string, unknown>).type === 'output_text' &&
          typeof (part as Record<string, unknown>).text === 'string'
        ) {
          texts.push((part as Record<string, string>).text);
        }
      }
    }
  }
  return texts.join('');
}
