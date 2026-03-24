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

import type { CanonicalTool, Json, ToolNormalizer } from './types';
import { fingerprintTool } from './fingerprint';

/** Shared denormalize implementation for all normalizers that store payload. */
function denormalizeFromPayload(canonical: CanonicalTool[]): unknown[] {
  return canonical.map(ct => {
    if (ct.payload === undefined) {
      throw new Error('CanonicalTool.payload missing; cannot round-trip.');
    }
    return ct.payload;
  });
}

// ---- Tag extraction helpers ----

function extractTagsFromMapping(m: Record<string, unknown>): readonly string[] {
  let tags: unknown = undefined;

  if (Array.isArray(m.toolscope_tags)) {
    tags = m.toolscope_tags;
  } else if (Array.isArray(m.tags)) {
    tags = m.tags;
  } else {
    const ann = m.annotations;
    if (
      ann !== null &&
      typeof ann === 'object' &&
      !Array.isArray(ann) &&
      Array.isArray((ann as Record<string, unknown>).tags)
    ) {
      tags = (ann as Record<string, unknown>).tags;
    }
  }

  if (!Array.isArray(tags)) return [];

  return tags
    .filter((t): t is string => typeof t === 'string' && t.trim().length > 0)
    .map(t => t.trim());
}

// ---- Detection helpers ----

function isOpenAIToolDict(t: unknown): t is Record<string, unknown> {
  if (typeof t !== 'object' || t === null || Array.isArray(t)) return false;
  const obj = t as Record<string, unknown>;
  if (obj.type !== 'function') return false;
  const fn = obj.function;
  if (typeof fn !== 'object' || fn === null || Array.isArray(fn)) return false;
  const fnObj = fn as Record<string, unknown>;
  return (
    (typeof fnObj.name === 'string' || fnObj.name === undefined) &&
    'parameters' in fnObj
  );
}

function isMcpToolDict(t: unknown): t is Record<string, unknown> {
  if (typeof t !== 'object' || t === null || Array.isArray(t)) return false;
  const obj = t as Record<string, unknown>;
  return (
    typeof obj.name === 'string' &&
    'inputSchema' in obj &&
    typeof obj.inputSchema === 'object'
  );
}

function getAttr(obj: unknown, name: string): unknown {
  if (typeof obj !== 'object' || obj === null) return undefined;
  return (obj as Record<string, unknown>)[name];
}

function isMcpToolObject(t: unknown): boolean {
  return (
    getAttr(t, 'name') !== undefined && getAttr(t, 'inputSchema') !== undefined
  );
}

// ---- Normalizers ----

/**
 * Normalizer for OpenAI function tool dicts:
 * {type:"function", function:{name, description, parameters}}
 */
export class OpenAIToolNormalizer implements ToolNormalizer {
  normalize(tools: unknown[]): CanonicalTool[] {
    return tools.map(t => {
      if (!isOpenAIToolDict(t)) {
        throw new TypeError(
          'OpenAIToolNormalizer expects OpenAI-like tool dicts.',
        );
      }

      const fn = t.function as Record<string, unknown>;
      const name = String(fn.name ?? '');
      const desc = String(fn.description ?? '');
      const params = (fn.parameters ?? {}) as Json;
      const tags = extractTagsFromMapping(t);
      const fp = fingerprintTool(name, desc, params);

      return {
        name,
        description: desc,
        inputSchema: params,
        tags,
        fingerprint: fp,
        payload: t,
      };
    });
  }

  denormalize(canonical: CanonicalTool[]): unknown[] {
    return denormalizeFromPayload(canonical);
  }
}

/**
 * Normalizer for MCP tool descriptors (dicts or objects).
 * Dict shape: {name, description, inputSchema, ...}
 * Object shape: tool.name, tool.description, tool.inputSchema
 */
export class McpToolNormalizer implements ToolNormalizer {
  normalize(tools: unknown[]): CanonicalTool[] {
    return tools.map(t => {
      if (isMcpToolDict(t)) {
        const name = String(t.name ?? '');
        const desc = String(t.description ?? '');
        const schema = (t.inputSchema ?? {}) as Json;
        const tags = extractTagsFromMapping(t);
        const fp = fingerprintTool(name, desc, schema);

        return {
          name,
          description: desc,
          inputSchema: schema,
          tags,
          fingerprint: fp,
          payload: t,
        };
      }

      if (isMcpToolObject(t)) {
        const name = String(getAttr(t, 'name') ?? '');
        const desc = String(getAttr(t, 'description') ?? '');
        const schema = (getAttr(t, 'inputSchema') ?? {}) as Json;

        const rawTags = getAttr(t, 'tags');
        const tags = Array.isArray(rawTags)
          ? rawTags
              .filter(
                (x): x is string =>
                  typeof x === 'string' && x.trim().length > 0,
              )
              .map(x => x.trim())
          : [];

        const fp = fingerprintTool(name, desc, schema);
        return {
          name,
          description: desc,
          inputSchema: schema,
          tags,
          fingerprint: fp,
          payload: t,
        };
      }

      throw new TypeError(
        'McpToolNormalizer expects MCP tool dicts or objects with .name/.inputSchema.',
      );
    });
  }

  denormalize(canonical: CanonicalTool[]): unknown[] {
    return denormalizeFromPayload(canonical);
  }
}

/**
 * Auto-detect tool schema per tool and normalize accordingly.
 * Supports OpenAI function tool dicts, MCP tool dicts, and MCP tool objects.
 */
export class AutoToolNormalizer implements ToolNormalizer {
  private readonly openai = new OpenAIToolNormalizer();
  private readonly mcp = new McpToolNormalizer();

  normalize(tools: unknown[]): CanonicalTool[] {
    return tools.map(t => {
      if (isOpenAIToolDict(t)) {
        return this.openai.normalize([t])[0];
      }
      if (isMcpToolDict(t) || isMcpToolObject(t)) {
        return this.mcp.normalize([t])[0];
      }
      throw new TypeError(
        'AutoToolNormalizer could not detect tool schema. ' +
          'Supported: OpenAI tool dicts, MCP tool dicts, MCP tool objects.',
      );
    });
  }

  denormalize(canonical: CanonicalTool[]): unknown[] {
    return denormalizeFromPayload(canonical);
  }
}
