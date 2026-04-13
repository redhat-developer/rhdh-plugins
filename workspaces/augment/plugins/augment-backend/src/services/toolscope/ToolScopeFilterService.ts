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

import { createHash } from 'crypto';
import type { LoggerService } from '@backstage/backend-plugin-api';
import type {
  ToolDescriptor,
  EmbeddingProvider,
  ToolScopeService,
  ToolScopeResult,
  CanonicalTool,
  ToolNormalizer,
} from './types';
import { ToolIndex } from './ToolIndex';
import { MemoryBackend } from './backends/memory';
import { EmbeddingCache } from './cache';
import { TfIdfEmbedder } from './TfIdfEmbedder';
import { fingerprintTool } from './fingerprint';

/**
 * Normalizer that converts ToolDescriptor (augment format) to CanonicalTool.
 * Uses serverId in the fingerprint extra field so tools with the same name on
 * different servers remain distinct.
 */
class ToolDescriptorNormalizer implements ToolNormalizer {
  normalize(tools: unknown[]): CanonicalTool[] {
    return (tools as ToolDescriptor[]).map(t => ({
      name: t.name,
      description: t.description,
      inputSchema: {},
      tags: [],
      fingerprint: fingerprintTool(
        t.name,
        t.description,
        {},
        {
          serverId: t.serverId,
        },
      ),
      payload: t,
    }));
  }

  denormalize(canonical: CanonicalTool[]): unknown[] {
    return canonical.map(ct => ct.payload as ToolDescriptor);
  }
}

function descriptorFingerprint(tool: ToolDescriptor): string {
  return createHash('sha256')
    .update(`${tool.serverId}\0${tool.name}\0${tool.description}`)
    .digest('hex');
}

/**
 * Orchestrates tool embedding, indexing, and per-query filtering.
 *
 * Implements the ToolScopeService interface consumed by providers.
 * Internally delegates to ToolIndex (1:1 Python ToolScope port).
 * Completely provider-agnostic -- no imports from providers/, types/config,
 * or Llama Stack.
 */
export class ToolScopeFilterService implements ToolScopeService {
  private toolIndex: ToolIndex;
  private readonly embedder: EmbeddingProvider;
  private readonly logger: LoggerService;
  private fingerprints = new Map<string, string>();

  constructor(logger: LoggerService, embedder?: EmbeddingProvider) {
    this.logger = logger;
    this.embedder = embedder ?? new TfIdfEmbedder();
    this.toolIndex = this.createToolIndex();
  }

  private createToolIndex(): ToolIndex {
    return new ToolIndex({
      backend: new MemoryBackend(),
      embedder: this.embedder,
      normalizer: new ToolDescriptorNormalizer(),
      cache: new EmbeddingCache(),
    });
  }

  private toolKey(tool: ToolDescriptor): string {
    return `${tool.serverId}\0${tool.name}`;
  }

  /**
   * Update the index with the current set of tools.
   * Uses fingerprinting to detect changes; when any tool changes,
   * recreates the ToolIndex and upserts all tools to ensure vocabulary
   * and vector consistency.
   */
  updateIndex(tools: ToolDescriptor[]): void {
    const currentKeys = new Set<string>();
    const changedTools: ToolDescriptor[] = [];

    for (const tool of tools) {
      const key = this.toolKey(tool);
      currentKeys.add(key);
      const fp = descriptorFingerprint(tool);
      if (this.fingerprints.get(key) !== fp) {
        changedTools.push(tool);
        this.fingerprints.set(key, fp);
      }
    }

    let removed = 0;
    for (const key of this.fingerprints.keys()) {
      if (!currentKeys.has(key)) {
        this.fingerprints.delete(key);
        removed++;
      }
    }

    if (changedTools.length > 0 || removed > 0) {
      this.toolIndex = this.createToolIndex();
      this.toolIndex.upsertTools(tools);
    }

    const serverIds = new Set(tools.map(t => t.serverId));
    this.logger.info(
      `[ToolScope] Index updated: ${tools.length} tools across ${serverIds.size} servers (${changedTools.length} changed, ${removed} removed)`,
    );
  }

  /**
   * Filter tools by semantic relevance to the user query.
   * Returns per-server allowed tool lists, intersected with admin constraints.
   */
  filterTools(
    query: string,
    k: number,
    adminAllowedTools?: Map<string, string[]>,
    minScore = 0,
  ): ToolScopeResult {
    const [filtered, trace] = this.toolIndex.filterWithTrace(query, { k });

    const scoreByName = new Map<string, number>();
    for (const c of trace.candidates) {
      if (c.vectorScore !== undefined) {
        scoreByName.set(c.toolName, c.vectorScore);
      }
    }

    const scopedTools = new Map<string, string[]>();
    const scores: Array<{ serverId: string; name: string; score: number }> = [];

    for (const raw of filtered) {
      const t = raw as ToolDescriptor;
      const score = scoreByName.get(t.name) ?? 0;

      if (minScore > 0 && score < minScore) continue;

      const existing = scopedTools.get(t.serverId) ?? [];
      existing.push(t.name);
      scopedTools.set(t.serverId, existing);
      scores.push({ serverId: t.serverId, name: t.name, score });
    }

    scores.sort((a, b) => b.score - a.score);

    if (adminAllowedTools) {
      for (const [serverId, toolNames] of scopedTools) {
        const adminList = adminAllowedTools.get(serverId);
        if (adminList) {
          const adminSet = new Set(adminList);
          scopedTools.set(
            serverId,
            toolNames.filter(name => adminSet.has(name)),
          );
        }
      }
    }

    return { scopedTools, scores, durationMs: trace.msTotal };
  }
}

/**
 * Create a ToolScopeService with the default stack:
 * TF-IDF embedder + ToolIndex with MemoryBackend.
 */
export function createToolScopeService(
  logger: LoggerService,
  options?: { embedder?: EmbeddingProvider },
): ToolScopeService {
  return new ToolScopeFilterService(logger, options?.embedder);
}
