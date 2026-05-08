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

const tryParseJson = (value: string) => {
  try {
    return JSON.parse(value);
  } catch {
    return undefined;
  }
};

const deepParseJson = (value: unknown): unknown => {
  let current = value;

  while (typeof current === 'string') {
    try {
      const parsed = JSON.parse(current);

      // stop if parsing doesn't change type
      if (parsed === current) break;

      current = parsed;
    } catch {
      break;
    }
  }

  return current;
};

const formatPayload = (payload: unknown): string => {
  if (typeof payload === 'string') {
    const nested = deepParseJson(payload);
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

const STATUS_PREFIX_REGEX = /^\[([^\]]+)\]\s+([\s\S]+)$/;

const extractToolResultPayload = (raw: string): unknown | undefined => {
  const trimmed = raw.trim();

  const match = STATUS_PREFIX_REGEX.exec(trimmed);
  if (match) {
    const [, , payload] = match;

    const parsed = tryParseJson(payload.trim());
    if (parsed !== undefined) {
      return parsed;
    }
  }

  const jsonSegment = trimmed.startsWith('data:')
    ? trimmed.slice('data:'.length).trim()
    : trimmed;

  const parsed = tryParseJson(jsonSegment);
  if (!parsed || typeof parsed !== 'object') {
    return undefined;
  }

  const parsedRecord = parsed as Record<string, unknown>;

  if (
    parsedRecord.event === 'tool_result' &&
    parsedRecord.data &&
    typeof parsedRecord.data === 'object' &&
    'content' in parsedRecord.data
  ) {
    const content = (parsedRecord.data as Record<string, unknown>).content;

    if (typeof content === 'string') {
      return deepParseJson(content);
    }

    return content;
  }

  return parsed;
};

export const formatToolResponseForMarkdown = (raw: string): string => {
  if (!raw?.trim()) return '';

  if (/^```/.test(raw)) return raw;

  const payload = extractToolResultPayload(raw);

  if (payload !== undefined) {
    return formatPayload(payload);
  }

  return formatPayload(raw);
};
