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

export const formatToolResponseForMarkdown = (raw: string): string => {
  if (raw === null) return '';
  const trimmed = raw.trim();
  if (!trimmed) return '';

  if (/^```/m.test(trimmed)) {
    return raw;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    if (trimmed.length > 120 || trimmed.includes('\n')) {
      return `\`\`\`\n${trimmed}\n\`\`\``;
    }
    return trimmed;
  }

  const body = prettyPrintToolJson(parsed);
  return `\`\`\`json\n${body}\n\`\`\``;
};
