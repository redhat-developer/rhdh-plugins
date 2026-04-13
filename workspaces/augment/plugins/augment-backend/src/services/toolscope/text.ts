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

import type { CanonicalTool } from './types';

/** String-to-string transform applied to tool text before embedding. */
export type ToolPreprocessor = (text: string) => string;

/** Supported field names for ToolTextConfig. */
export type ToolTextField = 'name' | 'description' | 'schema' | 'tags';

/**
 * Controls how a tool is converted to text for embedding.
 * 1:1 port of Python ToolScope's ToolTextConfig.
 */
export interface ToolTextConfig {
  /**
   * Which parts of CanonicalTool to include in the embedding text.
   * Default: ['name', 'description']
   */
  readonly fields: readonly ToolTextField[];

  /**
   * Max number of characters for the produced text (after assembling,
   * before preprocessors). null = no truncation.
   * Default: 256
   */
  readonly truncate: number | null;

  /**
   * Optional sequence of string->string transforms applied in order.
   * Default: [] (no preprocessing)
   */
  readonly preprocessors: readonly ToolPreprocessor[];
}

/** Default config matching Python ToolScope battle-tested defaults. */
export const DEFAULT_TOOL_TEXT_CONFIG: ToolTextConfig = {
  fields: ['name', 'description'],
  truncate: 256,
  preprocessors: [],
};

/**
 * Render a CanonicalTool into text for embedding, using the given config.
 */
export function renderToolText(
  tool: CanonicalTool,
  config: ToolTextConfig = DEFAULT_TOOL_TEXT_CONFIG,
): string {
  const parts: string[] = [];

  for (const field of config.fields) {
    switch (field) {
      case 'name':
        parts.push(tool.name || '');
        break;
      case 'description':
        parts.push(tool.description || '');
        break;
      case 'schema':
        parts.push(tool.inputSchema ? JSON.stringify(tool.inputSchema) : '');
        break;
      case 'tags':
        parts.push((tool.tags || []).join(' '));
        break;
      default:
        throw new Error(
          `Unsupported field in ToolTextConfig.fields: "${field}"`,
        );
    }
  }

  let text = parts.filter(p => p.length > 0).join('\n');

  if (config.truncate !== null && config.truncate >= 0) {
    text = text.slice(0, config.truncate);
  }

  for (const op of config.preprocessors) {
    text = op(text);
  }

  return text;
}

// ---- Built-in preprocessors (user opt-in) ----

export function lowercase(): ToolPreprocessor {
  return (s: string) => s.toLowerCase();
}

export function normalizeUnicode(
  form: 'NFC' | 'NFD' | 'NFKC' | 'NFKD' = 'NFKC',
): ToolPreprocessor {
  return (s: string) => s.normalize(form);
}

const WS_RE = /\s+/g;

export function collapseWhitespace(): ToolPreprocessor {
  return (s: string) => s.replace(WS_RE, ' ').trim();
}

// eslint-disable-next-line no-control-regex
const CONTROL_RE = /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f\x80-\x9f]/g;

export function stripControlChars(): ToolPreprocessor {
  return (s: string) => s.replace(CONTROL_RE, '');
}
