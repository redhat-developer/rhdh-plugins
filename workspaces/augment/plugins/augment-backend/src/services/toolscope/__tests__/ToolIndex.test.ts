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

import { ToolIndex, makeIndex } from '../ToolIndex';
import { MemoryBackend } from '../backends/memory';
import { TfIdfEmbedder } from '../TfIdfEmbedder';
import { McpToolNormalizer } from '../normalize';
import { EmbeddingCache } from '../cache';
import type { ToolScopeTrace, TraceSink } from '../observability';
import type { StickySessionConfig } from '../session';

function mcpTool(name: string, description: string, tags: string[] = []) {
  return {
    name,
    description,
    inputSchema: {},
    ...(tags.length > 0 ? { tags } : {}),
  };
}

function createTestIndex(opts?: { sessionCfg?: StickySessionConfig }) {
  const embedder = new TfIdfEmbedder();
  return new ToolIndex({
    backend: new MemoryBackend(),
    embedder,
    normalizer: new McpToolNormalizer(),
    cache: new EmbeddingCache(),
    sessionCfg: opts?.sessionCfg,
  });
}

describe('ToolIndex', () => {
  describe('upsertTools', () => {
    it('upserts MCP tools and makes them searchable', () => {
      const idx = createTestIndex();
      idx.upsertTools([
        mcpTool('list_pods', 'List all kubernetes pods'),
        mcpTool('create_issue', 'Create a GitHub issue'),
      ]);

      const result = idx.filter('list pods', { k: 1 });
      expect(result).toHaveLength(1);
      const tool = result[0] as Record<string, unknown>;
      expect(tool.name).toBe('list_pods');
    });

    it('caches embeddings for non-fit embedders', () => {
      const embedder: any = {
        embedTexts: jest.fn((texts: string[]) => texts.map(() => [1, 0, 0])),
      };

      const idx = new ToolIndex({
        backend: new MemoryBackend(),
        embedder,
        normalizer: new McpToolNormalizer(),
        cache: new EmbeddingCache(),
      });

      const tools = [mcpTool('test', 'description')];
      idx.upsertTools(tools);
      idx.upsertTools(tools);

      expect(embedder.embedTexts).toHaveBeenCalledTimes(1);
    });

    it('re-embeds all tools when fit() is present (TF-IDF)', () => {
      const embedder = new TfIdfEmbedder();
      const spy = jest.spyOn(embedder, 'embedTexts');
      const idx = new ToolIndex({
        backend: new MemoryBackend(),
        embedder,
        normalizer: new McpToolNormalizer(),
        cache: new EmbeddingCache(),
      });

      idx.upsertTools([mcpTool('test', 'description')]);
      idx.upsertTools([mcpTool('test', 'description')]);

      expect(spy).toHaveBeenCalledTimes(2);
    });
  });

  describe('filter', () => {
    it('returns original tool specs unchanged', () => {
      const idx = createTestIndex();
      const original = mcpTool('list_pods', 'List kubernetes pods');
      idx.upsertTools([original]);

      const [result] = idx.filter('list pods', { k: 1 }) as any[];
      expect(result).toBe(original);
    });

    it('accepts string messages', () => {
      const idx = createTestIndex();
      idx.upsertTools([mcpTool('test', 'test tool')]);
      const result = idx.filter('test', { k: 1 });
      expect(result).toHaveLength(1);
    });

    it('accepts OpenAI-style message arrays', () => {
      const idx = createTestIndex();
      idx.upsertTools([mcpTool('test', 'test tool')]);
      const result = idx.filter([{ role: 'user', content: 'test' }], { k: 1 });
      expect(result).toHaveLength(1);
    });
  });

  describe('filterWithTrace', () => {
    it('returns trace with timing information', () => {
      const idx = createTestIndex();
      idx.upsertTools([
        mcpTool('list_pods', 'List all kubernetes pods'),
        mcpTool('create_issue', 'Create a GitHub issue'),
      ]);

      const [tools, trace] = idx.filterWithTrace('list pods', { k: 1 });
      expect(tools).toHaveLength(1);
      expect(trace.msTotal).toBeGreaterThanOrEqual(0);
      expect(trace.msEmbedQuery).toBeGreaterThanOrEqual(0);
      expect(trace.msSearch).toBeGreaterThanOrEqual(0);
      expect(trace.returnedTools).toBe(1);
    });

    it('emits trace to TraceSink', () => {
      const traces: ToolScopeTrace[] = [];
      const sink: TraceSink = { emit: t => traces.push(t) };

      const idx = createTestIndex();
      idx.upsertTools([mcpTool('test', 'test')]);
      idx.filterWithTrace('test', { k: 1, traceSink: sink });

      expect(traces).toHaveLength(1);
      expect(traces[0].returnedTools).toBe(1);
    });

    it('records candidate scores', () => {
      const idx = createTestIndex();
      idx.upsertTools([
        mcpTool('list_pods', 'List pods'),
        mcpTool('create_issue', 'Create issue'),
      ]);

      const [, trace] = idx.filterWithTrace('list pods', { k: 2 });
      expect(trace.candidates.length).toBeGreaterThan(0);
      expect(trace.candidates[0].vectorScore).toBeDefined();
    });
  });

  describe('tag filtering', () => {
    it('filters by allow_tags', () => {
      const idx = createTestIndex();
      idx.upsertTools([
        mcpTool('jira_tool', 'Create Jira issue', ['jira']),
        mcpTool('k8s_tool', 'List pods', ['kubernetes']),
      ]);

      const result = idx.filter('tool', {
        k: 10,
        allowTags: ['jira'],
      });
      expect(result).toHaveLength(1);
      expect((result[0] as any).name).toBe('jira_tool');
    });

    it('filters by deny_tags', () => {
      const idx = createTestIndex();
      idx.upsertTools([
        mcpTool('safe_tool', 'Safe tool', ['safe']),
        mcpTool('dangerous_tool', 'Dangerous tool', ['dangerous']),
      ]);

      const result = idx.filter('tool', {
        k: 10,
        denyTags: ['dangerous'],
      });
      expect(result).toHaveLength(1);
      expect((result[0] as any).name).toBe('safe_tool');
    });
  });

  describe('sticky sessions', () => {
    const sessionCfg: StickySessionConfig = {
      enabled: true,
      similarityThresholdReuse: 0.92,
      similarityThresholdRefresh: 0.8,
      stickyKeep: 2,
      stickyBoost: 0.03,
      ttlSeconds: 3600,
      maxSessions: 100,
    };

    it('reuses previous tools for highly similar queries', () => {
      const idx = createTestIndex({ sessionCfg });
      idx.upsertTools([
        mcpTool('list_pods', 'List kubernetes pods'),
        mcpTool('create_issue', 'Create GitHub issue'),
        mcpTool('deploy_app', 'Deploy application'),
      ]);

      const [tools1, trace1] = idx.filterWithTrace('list kubernetes pods', {
        k: 1,
        sessionId: 'test-session',
      });
      expect(tools1).toHaveLength(1);
      expect(trace1.mode).toBe('fresh');

      const [tools2, trace2] = idx.filterWithTrace('list kubernetes pods', {
        k: 1,
        sessionId: 'test-session',
      });
      expect(trace2.mode).toBe('reuse');
      expect((tools2[0] as any).name).toBe((tools1[0] as any).name);
    });

    it('uses fresh mode for different queries', () => {
      const idx = createTestIndex({ sessionCfg });
      idx.upsertTools([
        mcpTool('list_pods', 'List kubernetes pods'),
        mcpTool('create_issue', 'Create GitHub issue'),
      ]);

      idx.filterWithTrace('list kubernetes pods', {
        k: 1,
        sessionId: 'test-session',
      });

      const [, trace2] = idx.filterWithTrace(
        'completely unrelated topic about cooking recipes',
        {
          k: 1,
          sessionId: 'test-session',
        },
      );
      expect(trace2.mode).not.toBe('reuse');
    });
  });

  describe('makeIndex factory', () => {
    it('creates an index with tools immediately upserted', () => {
      const idx = makeIndex({
        tools: [mcpTool('test', 'test tool')],
        embedder: new TfIdfEmbedder(),
      });

      const result = idx.filter('test', { k: 1 });
      expect(result).toHaveLength(1);
    });

    it('uses AutoToolNormalizer by default', () => {
      const idx = makeIndex({
        tools: [
          { name: 'mcp_tool', description: 'an mcp tool', inputSchema: {} },
        ],
        embedder: new TfIdfEmbedder(),
      });

      const result = idx.filter('mcp tool', { k: 1 });
      expect(result).toHaveLength(1);
    });
  });

  describe('deleteTools', () => {
    it('removes tools from the index', () => {
      const idx = createTestIndex();
      const tools = [mcpTool('test', 'test tool')];
      idx.upsertTools(tools);

      const [, trace] = idx.filterWithTrace('test', { k: 1 });
      expect(trace.returnedTools).toBe(1);

      const canonical = idx.normalizer.normalize(tools);
      idx.deleteTools(canonical.map(t => t.fingerprint));

      const [, trace2] = idx.filterWithTrace('test', { k: 1 });
      expect(trace2.returnedTools).toBe(0);
    });
  });
});
