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
  currentAgentKey: 'k8s',
  responseId: 'resp-mock-1',
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
  createContinuationState: jest
    .fn()
    .mockImplementation((result: any, conversationId?: string) => ({
      currentAgentKey: result.currentAgentKey ?? '',
      turn: 0,
      previousResponseId: result.responseId,
      conversationId,
      agentPath:
        result.handoffPath ??
        (result.currentAgentKey ? [result.currentAgentKey] : []),
      pendingToolCalls: [],
      isInterrupted: false,
    })),
  normalizeLlamaStackEvent: (data: string) => {
    const parsed = JSON.parse(data);
    return [{ type: `stream.${parsed.type}`, ...parsed }];
  },
  ApprovalStore: jest.fn().mockImplementation(() => ({
    get: jest.fn(),
    store: jest.fn(),
  })),
  ToolResolver: jest.fn().mockImplementation(() => ({
    register: jest.fn(),
  })),
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
        getToolServerInfo: jest.fn().mockReturnValue(undefined),
        getDiscoveryGeneration: jest.fn().mockReturnValue(0),
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
        getDiscoveryGeneration: jest.fn().mockReturnValue(0),
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
        getToolServerInfo: jest.fn().mockReturnValue({
          serverId: 's1',
          originalName: 'fail_tool',
        }),
        getDiscoveryGeneration: jest.fn().mockReturnValue(0),
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

  describe('function tool execution across agents', () => {
    it('all agents can execute all function tools regardless of mcpServers config', async () => {
      const executor = {
        ensureToolsDiscovered: jest.fn().mockResolvedValue([
          { name: 'ocp__list_ns', description: 'List namespaces' },
          { name: 'github__list_repos', description: 'List repos' },
        ]),
        executeTool: jest.fn().mockResolvedValue('result'),
        getToolServerInfo: jest.fn().mockImplementation((name: string) => {
          if (name === 'ocp__list_ns')
            return { serverId: 'ocp', originalName: 'list_ns' };
          if (name === 'github__list_repos')
            return { serverId: 'github', originalName: 'list_repos' };
          return undefined;
        }),
        getDiscoveryGeneration: jest.fn().mockReturnValue(0),
      };

      const snapshot = makeSnapshot();
      snapshot.agents.set('k8s', {
        key: 'k8s',
        functionName: 'k8s',
        config: {
          name: 'K8s Agent',
          instructions: 'Help with Kubernetes.',
          mcpServers: ['ocp'],
        } as any,
        handoffTools: [],
        agentAsToolTools: [],
        handoffTargetKeys: new Set(),
        asToolTargetKeys: new Set(),
      });

      const buildDeps = jest.fn().mockResolvedValue({
        config: baseConfig(),
        client: { requestWithRetry: jest.fn() },
        mcpServers: [
          {
            id: 'ocp',
            name: 'OCP',
            type: 'streamable-http',
            url: 'https://ocp/mcp',
          },
          {
            id: 'github',
            name: 'GitHub',
            type: 'streamable-http',
            url: 'https://gh/mcp',
          },
        ],
        backendToolExecutor: executor,
      });

      const { run } = require('@augment-adk/augment-adk');
      run.mockResolvedValueOnce(MOCK_RESULT);

      await orchestrator.chat(makeChatRequest(), snapshot, buildDeps);
      const options = run.mock.calls[0][1];
      expect(options.functionTools).toHaveLength(2);

      const ocpResult = await options.functionTools[0].execute({});
      expect(ocpResult).toBe('result');

      const ghResult = await options.functionTools[1].execute({});
      expect(ghResult).toBe('result');
    });
  });

  describe('tool metadata cache generation sync', () => {
    it('re-discovers tools when BackendToolExecutor generation changes', async () => {
      let generation = 0;
      const executor = {
        ensureToolsDiscovered: jest
          .fn()
          .mockResolvedValueOnce([
            {
              name: 'tool_a',
              description: 'A',
              parameters: { type: 'object' },
            },
          ])
          .mockResolvedValueOnce([
            {
              name: 'tool_a',
              description: 'A',
              parameters: { type: 'object' },
            },
            {
              name: 'tool_b',
              description: 'B',
              parameters: { type: 'object' },
            },
          ]),
        executeTool: jest.fn().mockResolvedValue('ok'),
        getToolServerInfo: jest.fn().mockReturnValue(undefined),
        getDiscoveryGeneration: jest.fn().mockImplementation(() => generation),
      };

      const buildDeps = jest.fn().mockResolvedValue({
        config: baseConfig(),
        client: { requestWithRetry: jest.fn() },
        mcpServers: [
          {
            id: 'srv',
            name: 'S',
            type: 'streamable-http',
            url: 'https://s/mcp',
          },
        ],
        backendToolExecutor: executor,
      });

      const { run } = require('@augment-adk/augment-adk');
      run.mockResolvedValue(MOCK_RESULT);

      // First call: discovers 1 tool at generation=0
      await orchestrator.chat(
        makeChatRequest('first'),
        makeSnapshot(),
        buildDeps,
      );
      const call1 = run.mock.calls[0][1];
      expect(call1.functionTools).toHaveLength(1);
      expect(executor.ensureToolsDiscovered).toHaveBeenCalledTimes(1);

      // Second call, same generation: should use cached metadata
      await orchestrator.chat(
        makeChatRequest('second'),
        makeSnapshot(),
        buildDeps,
      );
      expect(executor.ensureToolsDiscovered).toHaveBeenCalledTimes(1);

      // Third call, generation incremented: should re-discover
      generation = 1;
      await orchestrator.chat(
        makeChatRequest('third'),
        makeSnapshot(),
        buildDeps,
      );
      expect(executor.ensureToolsDiscovered).toHaveBeenCalledTimes(2);
      const call3 = run.mock.calls[2][1];
      expect(call3.functionTools).toHaveLength(2);
    });

    it('invalidateToolCache resets the cached generation', async () => {
      const executor = {
        ensureToolsDiscovered: jest.fn().mockResolvedValue([
          {
            name: 'tool_a',
            description: 'A',
            parameters: { type: 'object' },
          },
        ]),
        executeTool: jest.fn().mockResolvedValue('ok'),
        getToolServerInfo: jest.fn().mockReturnValue(undefined),
        getDiscoveryGeneration: jest.fn().mockReturnValue(0),
      };

      const buildDeps = jest.fn().mockResolvedValue({
        config: baseConfig(),
        client: { requestWithRetry: jest.fn() },
        mcpServers: [
          {
            id: 'srv',
            name: 'S',
            type: 'streamable-http',
            url: 'https://s/mcp',
          },
        ],
        backendToolExecutor: executor,
      });

      const { run } = require('@augment-adk/augment-adk');
      run.mockResolvedValue(MOCK_RESULT);

      await orchestrator.chat(
        makeChatRequest('first'),
        makeSnapshot(),
        buildDeps,
      );
      expect(executor.ensureToolsDiscovered).toHaveBeenCalledTimes(1);

      // Invalidate cache explicitly
      orchestrator.invalidateToolCache();

      // Same generation but cache is invalidated — should re-discover
      await orchestrator.chat(
        makeChatRequest('second'),
        makeSnapshot(),
        buildDeps,
      );
      expect(executor.ensureToolsDiscovered).toHaveBeenCalledTimes(2);
    });
  });

  describe('HITL approval mirroring in chat()', () => {
    it('mirrors pending approvals when adkApprovalStore has a matching entry', async () => {
      const storedEntry = {
        responseId: 'resp-1',
        approvalRequestId: 'call-1',
        toolName: 'delete_ns',
        args: {},
      };

      const { ApprovalStore } = require('@augment-adk/augment-adk');
      ApprovalStore.mockImplementationOnce(() => ({
        get: jest.fn().mockReturnValue(storedEntry),
        store: jest.fn(),
      }));

      const mockBackendStore = { store: jest.fn(), get: jest.fn() };
      const adkOrchestrator = new AdkOrchestrator({
        chatService: makeChatService(),
        logger: mockLogger(),
        backendApprovalStore: mockBackendStore as any,
      });

      const resultWithApprovals = {
        ...MOCK_RESULT,
        responseId: 'resp-1',
        pendingApprovals: [
          { approvalRequestId: 'call-1', toolName: 'delete_ns' },
        ],
      };

      const { run } = require('@augment-adk/augment-adk');
      run.mockResolvedValueOnce(resultWithApprovals);

      await adkOrchestrator.chat(
        makeChatRequest(),
        makeSnapshot(),
        makeBuildDeps(),
      );

      expect(mockBackendStore.store).toHaveBeenCalledWith(storedEntry);
    });

    it('skips mirroring when adkApprovalStore.get returns undefined', async () => {
      const mockBackendStore = { store: jest.fn(), get: jest.fn() };
      const adkOrchestrator = new AdkOrchestrator({
        chatService: makeChatService(),
        logger: mockLogger(),
        backendApprovalStore: mockBackendStore as any,
      });

      const resultWithApprovals = {
        ...MOCK_RESULT,
        responseId: 'resp-1',
        pendingApprovals: [
          { approvalRequestId: 'call-1', toolName: 'delete_ns' },
        ],
      };

      const { run } = require('@augment-adk/augment-adk');
      run.mockResolvedValueOnce(resultWithApprovals);

      await adkOrchestrator.chat(
        makeChatRequest(),
        makeSnapshot(),
        makeBuildDeps(),
      );

      expect(mockBackendStore.store).not.toHaveBeenCalled();
    });

    it('does not mirror when no pending approvals', async () => {
      const mockBackendStore = { store: jest.fn(), get: jest.fn() };
      const adkOrchestrator = new AdkOrchestrator({
        chatService: makeChatService(),
        logger: mockLogger(),
        backendApprovalStore: mockBackendStore as any,
      });

      const { run } = require('@augment-adk/augment-adk');
      run.mockResolvedValueOnce(MOCK_RESULT);

      await adkOrchestrator.chat(
        makeChatRequest(),
        makeSnapshot(),
        makeBuildDeps(),
      );

      expect(mockBackendStore.store).not.toHaveBeenCalled();
    });

    it('enriches mirrored entry with conversationId from request', async () => {
      const storedEntry = {
        responseId: 'resp-1',
        callId: 'call-1',
        functionName: 'delete_ns',
        argumentsJson: '{}',
        serverId: 'ocp',
        serverUrl: 'http://ocp',
        originalToolName: 'delete_ns',
        createdAt: Date.now(),
      };

      const { ApprovalStore } = require('@augment-adk/augment-adk');
      ApprovalStore.mockImplementationOnce(() => ({
        get: jest.fn().mockReturnValue(storedEntry),
        store: jest.fn(),
      }));

      const mockBackendStore = { store: jest.fn(), get: jest.fn() };
      const adkOrchestrator = new AdkOrchestrator({
        chatService: makeChatService(),
        logger: mockLogger(),
        backendApprovalStore: mockBackendStore as any,
      });

      const resultWithApprovals = {
        ...MOCK_RESULT,
        responseId: 'resp-1',
        pendingApprovals: [
          { approvalRequestId: 'call-1', toolName: 'delete_ns' },
        ],
      };

      const { run } = require('@augment-adk/augment-adk');
      run.mockResolvedValueOnce(resultWithApprovals);

      const request = makeChatRequest();
      (request as any).conversationId = 'conv-abc';

      await adkOrchestrator.chat(request, makeSnapshot(), makeBuildDeps());

      expect(mockBackendStore.store).toHaveBeenCalledWith(
        expect.objectContaining({ conversationId: 'conv-abc' }),
      );
    });
  });

  describe('HITL approval mirroring in chatStream()', () => {
    it('mirrors pending approvals after streaming completes', async () => {
      const storedEntry = {
        responseId: 'resp-2',
        approvalRequestId: 'call-2',
        toolName: 'restart_pod',
        args: {},
      };

      const {
        ApprovalStore,
        runStream: mockRunStream,
      } = require('@augment-adk/augment-adk');
      ApprovalStore.mockImplementationOnce(() => ({
        get: jest.fn().mockReturnValue(storedEntry),
        store: jest.fn(),
      }));

      const streamResult = {
        ...MOCK_RESULT,
        responseId: 'resp-2',
        pendingApprovals: [
          { approvalRequestId: 'call-2', toolName: 'restart_pod' },
        ],
      };
      mockRunStream.mockImplementationOnce(() => {
        const events = [
          { type: 'agent_start', agentKey: 'k8s', agentName: 'K8s', turn: 1 },
        ];
        let idx = 0;
        return {
          [Symbol.asyncIterator]: () => ({
            async next() {
              if (idx < events.length)
                return { value: events[idx++], done: false };
              return { value: undefined, done: true };
            },
          }),
          get result() {
            return streamResult;
          },
        };
      });

      const mockBackendStore = { store: jest.fn(), get: jest.fn() };
      const adkOrchestrator = new AdkOrchestrator({
        chatService: makeChatService(),
        logger: mockLogger(),
        backendApprovalStore: mockBackendStore as any,
      });

      const events: string[] = [];
      await adkOrchestrator.chatStream(
        makeChatRequest(),
        makeSnapshot(),
        e => events.push(e),
        makeBuildDeps(),
      );

      expect(mockBackendStore.store).toHaveBeenCalledWith(storedEntry);
    });

    it('enriches mirrored entry with conversationId from request', async () => {
      const storedEntry = {
        responseId: 'resp-3',
        callId: 'call-3',
        functionName: 'scale_deploy',
        argumentsJson: '{}',
        serverId: 'ocp',
        serverUrl: 'http://ocp',
        originalToolName: 'scale_deploy',
        createdAt: Date.now(),
      };

      const {
        ApprovalStore,
        runStream: mockRunStream,
      } = require('@augment-adk/augment-adk');
      ApprovalStore.mockImplementationOnce(() => ({
        get: jest.fn().mockReturnValue(storedEntry),
        store: jest.fn(),
      }));

      const streamResult = {
        ...MOCK_RESULT,
        responseId: 'resp-3',
        pendingApprovals: [
          { approvalRequestId: 'call-3', toolName: 'scale_deploy' },
        ],
      };
      mockRunStream.mockImplementationOnce(() => {
        const evts = [
          { type: 'agent_start', agentKey: 'k8s', agentName: 'K8s', turn: 1 },
        ];
        let idx = 0;
        return {
          [Symbol.asyncIterator]: () => ({
            async next() {
              if (idx < evts.length) return { value: evts[idx++], done: false };
              return { value: undefined, done: true };
            },
          }),
          get result() {
            return streamResult;
          },
        };
      });

      const mockBackendStore = { store: jest.fn(), get: jest.fn() };
      const adkOrchestrator = new AdkOrchestrator({
        chatService: makeChatService(),
        logger: mockLogger(),
        backendApprovalStore: mockBackendStore as any,
      });

      const request = makeChatRequest();
      (request as any).conversationId = 'conv-stream-xyz';

      const events: string[] = [];
      await adkOrchestrator.chatStream(
        request,
        makeSnapshot(),
        e => events.push(e),
        makeBuildDeps(),
      );

      expect(mockBackendStore.store).toHaveBeenCalledWith(
        expect.objectContaining({ conversationId: 'conv-stream-xyz' }),
      );
    });
  });

  describe('chatStream() tracks current agent', () => {
    it('updates agentRef from agent_start events', async () => {
      const events: string[] = [];
      await orchestrator.chatStream(
        makeChatRequest(),
        makeSnapshot(),
        e => events.push(e),
        makeBuildDeps(),
      );

      const parsed = events.map(e => JSON.parse(e));
      const agentStart = parsed.find(e => e.type === 'stream.agent.start');
      expect(agentStart).toBeDefined();
      expect(agentStart.agentKey).toBe('k8s');
    });
  });

  describe('per-request isolation (concurrency safety)', () => {
    it('uses separate agentRef per concurrent request', async () => {
      const executor = {
        ensureToolsDiscovered: jest
          .fn()
          .mockResolvedValue([{ name: 'tool_a', description: 'A tool' }]),
        executeTool: jest.fn().mockResolvedValue('result'),
        getToolServerInfo: jest.fn().mockReturnValue({
          serverId: 'server-a',
          originalName: 'tool_a',
        }),
        getDiscoveryGeneration: jest.fn().mockReturnValue(0),
      };

      const snapshotA = makeSnapshot();
      snapshotA.agents.set('agent-a', {
        key: 'agent-a',
        functionName: 'agent_a',
        config: {
          name: 'Agent A',
          instructions: 'A',
          mcpServers: ['server-a'],
        } as any,
        handoffTools: [],
        agentAsToolTools: [],
        handoffTargetKeys: new Set(),
        asToolTargetKeys: new Set(),
      });
      snapshotA.defaultAgentKey = 'agent-a';

      const snapshotB = makeSnapshot();
      snapshotB.agents.set('agent-b', {
        key: 'agent-b',
        functionName: 'agent_b',
        config: {
          name: 'Agent B',
          instructions: 'B',
        } as any,
        handoffTools: [],
        agentAsToolTools: [],
        handoffTargetKeys: new Set(),
        asToolTargetKeys: new Set(),
      });
      snapshotB.defaultAgentKey = 'agent-b';

      const buildDeps = jest.fn().mockResolvedValue({
        config: baseConfig(),
        client: { requestWithRetry: jest.fn() },
        mcpServers: [
          {
            id: 'server-a',
            name: 'SA',
            type: 'streamable-http',
            url: 'https://a/mcp',
          },
        ],
        backendToolExecutor: executor,
      });

      const { run } = require('@augment-adk/augment-adk');
      run.mockResolvedValue(MOCK_RESULT);

      await Promise.all([
        orchestrator.chat(makeChatRequest('req A'), snapshotA, buildDeps),
        orchestrator.chat(makeChatRequest('req B'), snapshotB, buildDeps),
      ]);

      expect(run).toHaveBeenCalledTimes(2);

      const callA = run.mock.calls[0][1];
      const callB = run.mock.calls[1][1];

      const resultA = await callA.functionTools[0].execute({});
      expect(resultA).toBe('result');

      const resultB = await callB.functionTools[0].execute({});
      expect(resultB).toBe('result');
    });
  });

  function makeMultiAgentSnapshot(): AgentGraphSnapshot {
    return {
      agents: new Map([
        [
          'router',
          {
            key: 'router',
            functionName: 'router',
            config: {
              name: 'Router',
              instructions: 'Route messages.',
              handoffs: ['worker'],
            },
            handoffTools: [],
            agentAsToolTools: [],
            handoffTargetKeys: new Set(['worker']),
            asToolTargetKeys: new Set(),
          },
        ],
        [
          'worker',
          {
            key: 'worker',
            functionName: 'worker',
            config: {
              name: 'Worker Agent',
              instructions: 'Do actual work.',
              handoffDescription: 'Handles work requests.',
            },
            handoffTools: [],
            agentAsToolTools: [],
            handoffTargetKeys: new Set(),
            asToolTargetKeys: new Set(),
          },
        ],
      ]),
      defaultAgentKey: 'router',
      maxTurns: 10,
    };
  }

  describe('multi-turn agent continuity', () => {
    it('passes resumeState on follow-up messages in the same conversation', async () => {
      const { run } = require('@augment-adk/augment-adk');
      const firstResult = {
        ...MOCK_RESULT,
        currentAgentKey: 'worker',
        agentName: 'Worker Agent',
        responseId: 'resp-turn-1',
      };
      run.mockResolvedValueOnce(firstResult).mockResolvedValueOnce(MOCK_RESULT);

      const snapshot = makeMultiAgentSnapshot();
      const buildDeps = makeBuildDeps();

      const request1 = makeChatRequest('Start my migration');
      (request1 as any).conversationId = 'conv-continuity';

      await orchestrator.chat(request1, snapshot, buildDeps);

      const call1Options = run.mock.calls[0][1];
      expect(call1Options.resumeState).toBeUndefined();

      const request2 = makeChatRequest('173971 is the CSI');
      (request2 as any).conversationId = 'conv-continuity';

      await orchestrator.chat(request2, snapshot, buildDeps);

      const call2Options = run.mock.calls[1][1];
      expect(call2Options.resumeState).toBeDefined();
      expect(call2Options.resumeState.currentAgentKey).toBe('worker');
    });

    it('does not pass resumeState for different conversations', async () => {
      const { run } = require('@augment-adk/augment-adk');
      run.mockResolvedValue({
        ...MOCK_RESULT,
        currentAgentKey: 'worker',
        responseId: 'resp-1',
      });

      const snapshot = makeMultiAgentSnapshot();
      const buildDeps = makeBuildDeps();

      const request1 = makeChatRequest('msg');
      (request1 as any).conversationId = 'conv-A';
      await orchestrator.chat(request1, snapshot, buildDeps);

      const request2 = makeChatRequest('msg');
      (request2 as any).conversationId = 'conv-B';
      await orchestrator.chat(request2, snapshot, buildDeps);

      const call2Options = run.mock.calls[1][1];
      expect(call2Options.resumeState).toBeUndefined();
    });

    it('does not pass resumeState when no conversationId', async () => {
      const { run } = require('@augment-adk/augment-adk');
      run.mockResolvedValue(MOCK_RESULT);

      await orchestrator.chat(
        makeChatRequest(),
        makeSnapshot(),
        makeBuildDeps(),
      );
      await orchestrator.chat(
        makeChatRequest(),
        makeSnapshot(),
        makeBuildDeps(),
      );

      const call2Options = run.mock.calls[1][1];
      expect(call2Options.resumeState).toBeUndefined();
    });

    it('chatStream also uses resumeState for continuity', async () => {
      const {
        run,
        runStream: mockRunStream,
      } = require('@augment-adk/augment-adk');

      const firstResult = {
        ...MOCK_RESULT,
        currentAgentKey: 'worker',
        agentName: 'Worker Agent',
        responseId: 'resp-stream-1',
      };
      run.mockResolvedValueOnce(firstResult);

      const snapshot = makeMultiAgentSnapshot();
      const buildDeps = makeBuildDeps();

      const request1 = makeChatRequest('Start');
      (request1 as any).conversationId = 'conv-stream-cont';
      await orchestrator.chat(request1, snapshot, buildDeps);

      const streamResult = {
        ...MOCK_RESULT,
        currentAgentKey: 'worker',
        responseId: 'resp-stream-2',
      };
      mockRunStream.mockImplementationOnce(() => {
        const events = [
          {
            type: 'agent_start',
            agentKey: 'worker',
            agentName: 'Worker Agent',
            turn: 1,
          },
        ];
        let idx = 0;
        return {
          [Symbol.asyncIterator]: () => ({
            async next() {
              if (idx < events.length)
                return { value: events[idx++], done: false };
              return { value: undefined, done: true };
            },
          }),
          get result() {
            return streamResult;
          },
        };
      });

      const request2 = makeChatRequest('Follow up');
      (request2 as any).conversationId = 'conv-stream-cont';

      const events: string[] = [];
      await orchestrator.chatStream(
        request2,
        snapshot,
        e => events.push(e),
        buildDeps,
      );

      const streamCall =
        mockRunStream.mock.calls[mockRunStream.mock.calls.length - 1];
      const streamOptions = streamCall[1];
      expect(streamOptions.resumeState).toBeDefined();
      expect(streamOptions.resumeState.currentAgentKey).toBe('worker');
    });

    it('falls back to default agent when stored agent no longer exists in graph', async () => {
      const { run } = require('@augment-adk/augment-adk');
      const firstResult = {
        ...MOCK_RESULT,
        currentAgentKey: 'worker',
        responseId: 'resp-stale-1',
      };
      run.mockResolvedValueOnce(firstResult).mockResolvedValueOnce(MOCK_RESULT);

      const snapshot = makeMultiAgentSnapshot();
      const buildDeps = makeBuildDeps();

      const request1 = makeChatRequest('Start');
      (request1 as any).conversationId = 'conv-stale';
      await orchestrator.chat(request1, snapshot, buildDeps);

      const snapshotWithoutWorker: AgentGraphSnapshot = {
        agents: new Map([
          [
            'router',
            {
              key: 'router',
              functionName: 'router',
              config: { name: 'Router', instructions: 'Route.' },
              handoffTools: [],
              agentAsToolTools: [],
              handoffTargetKeys: new Set(),
              asToolTargetKeys: new Set(),
            },
          ],
        ]),
        defaultAgentKey: 'router',
        maxTurns: 10,
      };

      const request2 = makeChatRequest('Follow up');
      (request2 as any).conversationId = 'conv-stale';
      await orchestrator.chat(request2, snapshotWithoutWorker, buildDeps);

      const call2Options = run.mock.calls[1][1];
      expect(call2Options.resumeState).toBeUndefined();
      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('no longer exists in graph'),
      );
    });

    it('evicts oldest conversation state when exceeding max capacity', async () => {
      const { run } = require('@augment-adk/augment-adk');
      run.mockResolvedValue({
        ...MOCK_RESULT,
        currentAgentKey: 'worker',
        responseId: 'resp-cap',
      });

      const snapshot = makeMultiAgentSnapshot();
      const buildDeps = makeBuildDeps();

      for (let i = 0; i < 502; i++) {
        const req = makeChatRequest(`msg ${i}`);
        (req as any).conversationId = `conv-${i}`;
        await orchestrator.chat(req, snapshot, buildDeps);
      }

      run.mockResolvedValue(MOCK_RESULT);
      const reqOldest = makeChatRequest('check oldest');
      (reqOldest as any).conversationId = 'conv-0';
      await orchestrator.chat(reqOldest, snapshot, buildDeps);
      const oldestCall = run.mock.calls[run.mock.calls.length - 1][1];
      expect(oldestCall.resumeState).toBeUndefined();

      const reqRecent = makeChatRequest('check recent');
      (reqRecent as any).conversationId = 'conv-501';
      await orchestrator.chat(reqRecent, snapshot, buildDeps);
      const recentCall = run.mock.calls[run.mock.calls.length - 1][1];
      expect(recentCall.resumeState).toBeDefined();
      expect(recentCall.resumeState.currentAgentKey).toBe('worker');
    });
  });
});
