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

import { ToolCall } from '../types';

export const toolCallIdKey = (id: string | number): string => String(id);

export const normalizeToolCalls = (
  calls: (ToolCall | undefined)[] | undefined,
): ToolCall[] => (calls ?? []).filter((tc): tc is ToolCall => tc !== null);

export const isMcpStyleToolCallPayload = (
  data: Record<string, any> | undefined,
): boolean =>
  !!data &&
  typeof data.name === 'string' &&
  data.name.trim().length > 0 &&
  data.id !== null;

/** Legacy tool_result uses data.token with at least tool_name and response. */
export const isLegacyToolResultToken = (
  token: unknown,
): token is { tool_name: string; response?: unknown } =>
  !!token &&
  typeof token === 'object' &&
  !Array.isArray(token) &&
  typeof (token as { tool_name?: string }).tool_name === 'string' &&
  (token as { tool_name: string }).tool_name.length > 0;

export const legacyToolResultToString = (response: unknown): string => {
  if (!response) return '';
  if (typeof response === 'string') return response;
  try {
    return JSON.stringify(response);
  } catch {
    return String(response);
  }
};

let tempToolCallsCachePrefixFallbackSeq = 0;

/** Unique prefix per temp send so late streams cannot migrate another session's tool cache. */
export function createTempToolCallsCacheSessionPrefix(): string {
  const suffix =
    globalThis.crypto?.randomUUID?.() ??
    `${Date.now()}-${++tempToolCallsCachePrefixFallbackSeq}`;
  return `lightspeed-temp:${suffix}`;
}

/**
 * Parse an SSE buffer into discrete JSON events, returning the unparsed
 * remainder (incomplete trailing chunk).
 */
export function parseSSEBuffer(buffer: string): {
  events: Array<{ event: string; data: any }>;
  parseErrors: unknown[];
  remainder: string;
} {
  const parts = buffer.split('\n\n');
  const remainder = parts.pop()!;
  const events: Array<{ event: string; data: any }> = [];
  const parseErrors: unknown[] = [];

  for (const part of parts) {
    const lines = part.split('\n').filter(line => line.startsWith('data:'));
    const jsonString = lines.map(line => line.trim().slice(5).trim()).join('');
    try {
      events.push(JSON.parse(jsonString));
    } catch (error) {
      parseErrors.push(error);
    }
  }

  return { events, parseErrors, remainder };
}

/**
 * Parse a `tool_call` SSE event payload into a ToolCall object.
 * Returns undefined if the payload doesn't match any known format.
 */
export function parseToolCallFromEvent(
  data: Record<string, any>,
): ToolCall | undefined {
  const toolCallData = data?.token;
  const legacyObjectCall =
    typeof toolCallData === 'object' &&
    toolCallData !== null &&
    !Array.isArray(toolCallData) &&
    (toolCallData as { tool_name?: string }).tool_name;

  const mcpStyle = isMcpStyleToolCallPayload(data);
  const rawArgs = data?.args ?? data?.arguments;
  const mcpArgs: Record<string, any> =
    rawArgs && typeof rawArgs === 'object' && !Array.isArray(rawArgs)
      ? rawArgs
      : {};

  if (legacyObjectCall && data.id !== null) {
    return {
      id: data.id,
      toolName: (toolCallData as { tool_name: string }).tool_name,
      arguments:
        (toolCallData as { arguments?: Record<string, any> }).arguments || {},
      startTime: Date.now(),
      isLoading: true,
    };
  }

  if (mcpStyle) {
    return {
      id: data.id,
      toolName: data.name.trim(),
      description:
        typeof data.type === 'string' && data.type !== data.name
          ? data.type
          : undefined,
      arguments: mcpArgs,
      startTime: Date.now(),
      isLoading: true,
    };
  }

  return undefined;
}

export interface ToolResultParsed {
  responsePayload: string;
  matchToolName: string | undefined;
  toolIdKey: string;
  endTime: number;
  executionTime: number;
}

/**
 * Parse a `tool_result` SSE event payload and compute execution time.
 * Returns undefined if the payload doesn't match any known format.
 */
export function parseToolResultFromEvent(
  data: Record<string, any>,
  pendingToolCalls: Record<string, ToolCall>,
): ToolResultParsed | undefined {
  const tokenResult = data?.token;
  const legacyResult = isLegacyToolResultToken(tokenResult);
  const mcpHasContent =
    data?.id !== null && data.content !== undefined && !legacyResult;

  let responsePayload: string | undefined;
  let matchToolName: string | undefined;
  let toolIdKey: string | undefined;

  if (legacyResult) {
    responsePayload = legacyToolResultToString(tokenResult.response);
    matchToolName = tokenResult.tool_name;
    toolIdKey = data?.id !== null ? toolCallIdKey(data.id) : undefined;
  } else if (mcpHasContent) {
    toolIdKey = toolCallIdKey(data.id);
    responsePayload =
      typeof data.content === 'string'
        ? data.content
        : JSON.stringify(data.content);
    if (typeof data.status === 'string' && data.status !== 'success') {
      responsePayload = `[${data.status}] ${responsePayload}`;
    }
  }

  if (responsePayload === undefined || toolIdKey === undefined) {
    return undefined;
  }

  const pendingCall = pendingToolCalls[toolIdKey];
  const endTime = Date.now();
  const executionTime = pendingCall
    ? (endTime - pendingCall.startTime) / 1000
    : 0;

  return { responsePayload, matchToolName, toolIdKey, endTime, executionTime };
}

/**
 * Apply a tool result to a list of tool calls, returning the updated array.
 */
export function applyToolResultToToolCalls(
  toolCalls: ToolCall[],
  result: ToolResultParsed,
): ToolCall[] {
  return toolCalls.map(tc => {
    const idMatches =
      toolCallIdKey(tc.id) === result.toolIdKey ||
      (result.matchToolName !== undefined &&
        tc.toolName === result.matchToolName);
    if (idMatches) {
      return {
        ...tc,
        response: result.responsePayload,
        endTime: result.endTime,
        executionTime: result.executionTime,
        isLoading: false,
      };
    }
    return tc;
  });
}
