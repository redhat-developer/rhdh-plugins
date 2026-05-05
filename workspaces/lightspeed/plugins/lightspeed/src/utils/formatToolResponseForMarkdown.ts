/*
 * Copyright Red Hat, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const prettyPrintToolJson = (value: unknown): string => {
  if (value === null) {
    return 'null';
  }
  if (typeof value === 'object') {
    return JSON.stringify(value, null, 2);
  }
  if (typeof value === 'string') {
    try {
      const inner = JSON.parse(value);
      if (inner !== null && typeof inner === 'object') {
        return JSON.stringify(inner, null, 2);
      }
    } catch {
      return value;
    }
    return value;
  }
  return JSON.stringify(value);
};

const tryParseJson = (value: string): unknown | undefined => {
  try {
    return JSON.parse(value);
  } catch {
    return undefined;
  }
};

const formatPayload = (payload: unknown): string => {
  if (typeof payload === 'string') {
    const nested = tryParseJson(payload);
    if (nested !== undefined && nested !== null && typeof nested === 'object') {
      return `\`\`\`json\n${JSON.stringify(nested, null, 2)}\n\`\`\``;
    }
    if (payload.length > 120 || payload.includes('\n')) {
      return `\`\`\`\n${payload}\n\`\`\``;
    }
    return payload;
  }

  const body = prettyPrintToolJson(payload);
  return `\`\`\`json\n${body}\n\`\`\``;
};

const extractToolResultPayload = (raw: string): unknown | undefined => {
  const trimmed = raw.trim();
  const statusPrefixedMatch = trimmed.match(/^\[[^\]]+\]\s+([\s\S]+)$/);
  if (statusPrefixedMatch?.[1]) {
    const statusPayload = tryParseJson(statusPrefixedMatch[1].trim());
    if (statusPayload !== undefined) {
      return statusPayload;
    }
  }

  const jsonSegment = trimmed.startsWith('data:')
    ? trimmed.slice('data:'.length).trim()
    : trimmed;

  const parsed = tryParseJson(jsonSegment);
  if (parsed === undefined || parsed === null || typeof parsed !== 'object') {
    return undefined;
  }

  const parsedRecord = parsed as Record<string, unknown>;
  const isToolResultEvent = parsedRecord.event === 'tool_result';
  const eventData =
    parsedRecord.data && typeof parsedRecord.data === 'object'
      ? (parsedRecord.data as Record<string, unknown>)
      : undefined;

  if (isToolResultEvent && eventData && 'content' in eventData) {
    const content = eventData.content;
    if (typeof content === 'string') {
      const nested = tryParseJson(content);
      return nested ?? content;
    }
    return content;
  }

  return parsed;
};

export const formatToolResponseForMarkdown = (raw: string): string => {
  if (raw === null) return '';
  const trimmed = raw.trim();
  if (!trimmed) return '';

  if (/^```/m.test(trimmed)) {
    return raw;
  }

  const extractedPayload = extractToolResultPayload(trimmed);
  if (extractedPayload !== undefined) {
    return formatPayload(extractedPayload);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    return formatPayload(trimmed);
  }
  return formatPayload(parsed);
};
