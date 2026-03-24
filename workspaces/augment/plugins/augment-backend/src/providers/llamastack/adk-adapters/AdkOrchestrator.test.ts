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
import type { LoggerService } from '@backstage/backend-plugin-api';
import type {
  AgentGraphSnapshot,
  BuildDepsForAgent,
} from '../../responses-api/agents/agentGraph';
import type { ChatRequest, EffectiveConfig } from '../../../types';
import { AdkOrchestrator } from './AdkOrchestrator';

const MOCK_RESULT = {
  content: 'Namespaces: default, kube-system',
  agentName: 'k8s',
  usage: { input_tokens: 10, output_tokens: 20, total_tokens: 30 },
};

function makeMockStreamedResult() {
  const events = [
    { type: 'agent_start', agentKey: 'k8s', agentName: 'K8s Agent', turn: 1 },
    { type: 'raw_model_event', data: '{"type":"text.delta","delta":"Hello"}' },
  ];
  let idx = 0;
  return {
    [Symbol.asyncIterator]: () => ({
      async next() {
        if (idx < events.length) {
          return { value: events[idx++], done: false };
        }
        return { value: undefined, done: true };
      },
    }),
    get result() {
      return MOCK_RESULT;
    },
  };
}

jest.mock('@augment-adk/augment-adk', () => ({
  run: jest.fn().mockImplementation(() => Promise.resolve(MOCK_RESULT)),
  runStream: jest.fn().mockImplementation(() => makeMockStreamedResult()),
  normalizeLlamaStackEvent: (data: string) => {
    const parsed = JSON.parse(data);
    return [{ type: `stream.${parsed.type}`, ...parsed }];
  },
}));

function mockLogger(): LoggerService {
  return {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    child: jest.fn().mockReturnThis(),
  } as unknown as LoggerService;
}

function baseConfig(): EffectiveConfig {
  return {
    model: 'llama3',
    baseUrl: 'http://localhost:8321',
    systemPrompt: 'Be helpful.',
    enableWebSearch: false,
    enableCodeInterpreter: false,
    vectorStoreIds: [],
    vectorStoreName: 'test',
    embeddingModel: 'embed-v1',
    embeddingDimension: 384,
    chunkingStrategy: 'auto' as const,
    maxChunkSizeTokens: 512,
    chunkOverlapTokens: 64,
    skipTlsVerify: false,
    zdrMode: false,
    verboseStreamLogging: false,
  };
}

function makeSnapshot(): AgentGraphSnapshot {
  return {
    agents: new Map([
      [
        'k8s',
        {
          key: 'k8s',
          functionName: 'k8s',
          config: {
            name: 'K8s Agent',
            instructions: 'Help with Kubernetes.',
          },
          handoffTools: [],
          agentAsToolTools: [],
          handoffTargetKeys: new Set(),
          asToolTargetKeys: new Set(),
        },
      ],
    ]),
    defaultAgentKey: 'k8s',
    maxTurns: 10,
  };
}

function makeBuildDeps(): BuildDepsForAgent {
  return jest.fn().mockResolvedValue({
    config: baseConfig(),
    client: {
      requestWithRetry: jest.fn(),
    },
    mcpServers: [],
    backendToolExecutor: null,
  });
}

function makeChatService() {
  return {
    chatTurn: jest.fn(),
    chatTurnStream: jest.fn(),
  } as any;
}

function makeChatRequest(message = 'List namespaces'): ChatRequest {
  return {
    model: 'llama3',
    messages: [{ role: 'user', content: message }],
  } as ChatRequest;
}

describe('AdkOrchestrator', () => {
  let orchestrator: AdkOrchestrator;
  let logger: LoggerService;

  beforeEach(() => {
    jest.clearAllMocks();
    logger = mockLogger();
    orchestrator = new AdkOrchestrator({
      chatService: makeChatService(),
      logger,
    });
  });

  describe('chat()', () => {
    it('returns a ChatResponse with role=assistant', async () => {
      const response = await orchestrator.chat(
        makeChatRequest(),
        makeSnapshot(),
        makeBuildDeps(),
      );
      expect(response.role).toBe('assistant');
      expect(response.content).toBe(MOCK_RESULT.content);
    });

    it('throws when default agent not found', async () => {
      const snapshot = makeSnapshot();
      snapshot.defaultAgentKey = 'nonexistent';
      await expect(
        orchestrator.chat(makeChatRequest(), snapshot, makeBuildDeps()),
      ).rejects.toThrow('Default agent "nonexistent" not found');
    });

    it('logs error on failure', async () => {
      const { run } = require('@augment-adk/augment-adk');
      run.mockRejectedValueOnce(new Error('Model unavailable'));
      await expect(
        orchestrator.chat(makeChatRequest(), makeSnapshot(), makeBuildDeps()),
      ).rejects.toThrow('Model unavailable');
      expect(logger.error).toHaveBeenCalledWith(
        '[AdkOrchestrator] chat() failed',
        expect.objectContaining({ error: 'Model unavailable' }),
      );
    });
  });

  describe('chatStream()', () => {
    it('emits mapped events and stream.completed', async () => {
      const events: string[] = [];
      await orchestrator.chatStream(
        makeChatRequest(),
        makeSnapshot(),
        e => events.push(e),
        makeBuildDeps(),
      );

      const parsed = events.map(e => JSON.parse(e));
      const types = parsed.map(e => e.type);

      expect(types).toContain('stream.agent.start');
      expect(types).toContain('stream.completed');
    });

    it('emits stream.error on failure', async () => {
      const { runStream } = require('@augment-adk/augment-adk');
      runStream.mockImplementationOnce(() => {
        throw new Error('Connection lost');
      });

      const events: string[] = [];
      await orchestrator.chatStream(
        makeChatRequest(),
        makeSnapshot(),
        e => events.push(e),
        makeBuildDeps(),
      );

      const parsed = events.map(e => JSON.parse(e));
      expect(parsed.some(e => e.type === 'stream.error')).toBe(true);
      expect(parsed.find(e => e.type === 'stream.error')?.error).toBe(
        'Connection lost',
      );
    });

    it('does not emit stream.error when aborted by client', async () => {
      const controller = new AbortController();
      controller.abort();

      const { runStream } = require('@augment-adk/augment-adk');
      runStream.mockImplementationOnce(() => {
        throw new DOMException('The operation was aborted', 'AbortError');
      });

      const events: string[] = [];
      await orchestrator.chatStream(
        makeChatRequest(),
        makeSnapshot(),
        e => events.push(e),
        makeBuildDeps(),
        controller.signal,
      );

      const parsed = events.map(e => JSON.parse(e));
      expect(parsed.some(e => e.type === 'stream.error')).toBe(false);
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Stream aborted'),
      );
    });
  });

  describe('discoverBackendTools()', () => {
    it('wraps discovered tools as FunctionTool', async () => {
      const executor = {
        ensureToolsDiscovered: jest.fn().mockResolvedValue([
          {
            name: 'list_pods',
            description: 'List pods',
            parameters: { type: 'object' },
          },
        ]),
        executeTool: jest.fn().mockResolvedValue('["pod-1"]'),
      };

      const buildDeps = jest.fn().mockResolvedValue({
        config: baseConfig(),
        client: { requestWithRetry: jest.fn() },
        mcpServers: [],
        backendToolExecutor: executor,
      });

      const { run } = require('@augment-adk/augment-adk');
      run.mockResolvedValueOnce(MOCK_RESULT);

      await orchestrator.chat(makeChatRequest(), makeSnapshot(), buildDeps);

      expect(run).toHaveBeenCalled();
      const options = run.mock.calls[0][1];
      expect(options.functionTools).toHaveLength(1);
      expect(options.functionTools[0].name).toBe('list_pods');

      const toolResult = await options.functionTools[0].execute({
        ns: 'default',
      });
      expect(toolResult).toBe('["pod-1"]');
    });

    it('returns empty array when tool discovery times out', async () => {
      const executor = {
        ensureToolsDiscovered: jest
          .fn()
          .mockImplementation(
            () => new Promise(resolve => setTimeout(resolve, 60_000)),
          ),
      };

      const buildDeps = jest.fn().mockResolvedValue({
        config: baseConfig(),
        client: { requestWithRetry: jest.fn() },
        mcpServers: [],
        backendToolExecutor: executor,
      });

      const { run } = require('@augment-adk/augment-adk');
      run.mockResolvedValueOnce(MOCK_RESULT);

      await orchestrator.chat(makeChatRequest(), makeSnapshot(), buildDeps);
      const options = run.mock.calls[0][1];
      expect(options.functionTools).toEqual([]);
      expect(logger.warn).toHaveBeenCalledWith(
        '[AdkOrchestrator] Tool discovery failed',
        expect.objectContaining({ error: 'Tool discovery timed out' }),
      );
    }, 35_000);

    it('catches tool execution errors and returns JSON error', async () => {
      const executor = {
        ensureToolsDiscovered: jest
          .fn()
          .mockResolvedValue([{ name: 'fail_tool', description: 'Fails' }]),
        executeTool: jest.fn().mockRejectedValue(new Error('exec error')),
      };

      const buildDeps = jest.fn().mockResolvedValue({
        config: baseConfig(),
        client: { requestWithRetry: jest.fn() },
        mcpServers: [],
        backendToolExecutor: executor,
      });

      const { run } = require('@augment-adk/augment-adk');
      run.mockResolvedValueOnce(MOCK_RESULT);

      await orchestrator.chat(makeChatRequest(), makeSnapshot(), buildDeps);
      const options = run.mock.calls[0][1];

      const result = await options.functionTools[0].execute({});
      expect(JSON.parse(result)).toEqual({ error: 'exec error' });
    });
  });
});
