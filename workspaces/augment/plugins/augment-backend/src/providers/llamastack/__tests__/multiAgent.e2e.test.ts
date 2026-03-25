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

/**
 * End-to-end integration tests for multi-agent orchestration.
 *
 * These tests validate the FULL chain:
 *   ResponsesApiCoordinator -> AdkOrchestrator -> ResponsesApiService -> ResponsesApiClient -> HTTP
 *
 * Two modes:
 * 1. Mock LlamaStack server (deterministic, CI-friendly)
 * 2. Real LlamaStack instance (when LLAMASTACK_URL is set)
 */

import * as http from 'http';
import type { AddressInfo } from 'net';
import type {
  LoggerService,
  RootConfigService,
} from '@backstage/backend-plugin-api';
import { ResponsesApiCoordinator } from '../ResponsesApiCoordinator';
import type { ChatRequest, ChatResponse } from '../../../types';

// ---------------------------------------------------------------------------
//  Mock LlamaStack Server
// ---------------------------------------------------------------------------

interface RecordedCall {
  url: string;
  method: string;
  body: Record<string, unknown>;
  headers: Record<string, string>;
}

interface MockLlamaStackServer {
  listen: () => Promise<number>;
  close: () => Promise<void>;
  getCalls: () => RecordedCall[];
  getResponsesCalls: () => RecordedCall[];
  clearCalls: () => void;
  port: () => number;
}

let responseIdCounter = 0;

function nextResponseId(): string {
  return `resp-e2e-${++responseIdCounter}`;
}

function makeTextResponse(
  text: string,
  model: string,
): Record<string, unknown> {
  return {
    id: nextResponseId(),
    object: 'response',
    created_at: Math.floor(Date.now() / 1000),
    model,
    status: 'completed',
    output: [
      {
        type: 'message',
        id: `msg-${Date.now()}`,
        role: 'assistant',
        status: 'completed',
        content: [{ type: 'output_text', text }],
      },
    ],
  };
}

function makeHandoffResponse(
  targetFunctionName: string,
  model: string,
  callId = `call-${Date.now()}`,
): Record<string, unknown> {
  return {
    id: nextResponseId(),
    object: 'response',
    created_at: Math.floor(Date.now() / 1000),
    model,
    status: 'completed',
    output: [
      {
        type: 'function_call',
        id: `fc-${Date.now()}`,
        call_id: callId,
        name: `transfer_to_${targetFunctionName}`,
        arguments: '{}',
        status: 'completed',
      },
    ],
  };
}

function makeAgentToolCallResponse(
  targetKey: string,
  model: string,
  callId = `call-tool-${Date.now()}`,
): Record<string, unknown> {
  return {
    id: nextResponseId(),
    object: 'response',
    created_at: Math.floor(Date.now() / 1000),
    model,
    status: 'completed',
    output: [
      {
        type: 'function_call',
        id: `fc-tool-${Date.now()}`,
        call_id: callId,
        name: `call_${targetKey}`,
        arguments: 'Please help the user.',
        status: 'completed',
      },
    ],
  };
}

function makeStreamEvents(text: string, model: string): string {
  const respId = nextResponseId();
  const events = [
    {
      type: 'response.created',
      response: { id: respId, model, status: 'in_progress' },
    },
    {
      type: 'response.output_item.added',
      output_index: 0,
      item: { type: 'message', id: 'msg-s1', role: 'assistant' },
    },
    {
      type: 'response.content_part.added',
      output_index: 0,
      content_index: 0,
      part: { type: 'output_text', text: '' },
    },
    {
      type: 'response.output_text.delta',
      output_index: 0,
      content_index: 0,
      delta: text,
    },
    {
      type: 'response.output_text.done',
      output_index: 0,
      content_index: 0,
      text,
    },
    {
      type: 'response.content_part.done',
      output_index: 0,
      content_index: 0,
      part: { type: 'output_text', text },
    },
    {
      type: 'response.output_item.done',
      output_index: 0,
      item: {
        type: 'message',
        id: 'msg-s1',
        role: 'assistant',
        status: 'completed',
        content: [{ type: 'output_text', text }],
      },
    },
    {
      type: 'response.completed',
      response: {
        id: respId,
        model,
        status: 'completed',
        output: [
          {
            type: 'message',
            id: 'msg-s1',
            role: 'assistant',
            status: 'completed',
            content: [{ type: 'output_text', text }],
          },
        ],
      },
    },
  ];
  return events.map(e => `data: ${JSON.stringify(e)}\n\n`).join('');
}

function makeStreamHandoffEvents(
  targetFunctionName: string,
  model: string,
): string {
  const respId = nextResponseId();
  const callId = `call-stream-${Date.now()}`;
  const events = [
    {
      type: 'response.created',
      response: { id: respId, model, status: 'in_progress' },
    },
    {
      type: 'response.output_item.added',
      output_index: 0,
      item: {
        type: 'function_call',
        id: `fc-s-${Date.now()}`,
        call_id: callId,
        name: `transfer_to_${targetFunctionName}`,
      },
    },
    {
      type: 'response.output_item.done',
      output_index: 0,
      item: {
        type: 'function_call',
        id: `fc-s-${Date.now()}`,
        call_id: callId,
        name: `transfer_to_${targetFunctionName}`,
        arguments: '{}',
        status: 'completed',
      },
    },
    {
      type: 'response.completed',
      response: {
        id: respId,
        model,
        status: 'completed',
        output: [
          {
            type: 'function_call',
            id: `fc-s-${Date.now()}`,
            call_id: callId,
            name: `transfer_to_${targetFunctionName}`,
            arguments: '{}',
            status: 'completed',
          },
        ],
      },
    },
  ];
  return events.map(e => `data: ${JSON.stringify(e)}\n\n`).join('');
}

function makeStreamEventsWithReasoning(
  reasoningText: string,
  outputText: string,
  model: string,
): string {
  const respId = nextResponseId();
  const events = [
    {
      type: 'response.created',
      response: { id: respId, model, status: 'in_progress' },
    },
    { type: 'response.reasoning_text.delta', delta: reasoningText },
    { type: 'response.reasoning_text.done', text: reasoningText },
    {
      type: 'response.output_item.added',
      output_index: 0,
      item: { type: 'message', id: 'msg-r1', role: 'assistant' },
    },
    {
      type: 'response.content_part.added',
      output_index: 0,
      content_index: 0,
      part: { type: 'output_text', text: '' },
    },
    {
      type: 'response.output_text.delta',
      output_index: 0,
      content_index: 0,
      delta: outputText,
    },
    {
      type: 'response.output_text.done',
      output_index: 0,
      content_index: 0,
      text: outputText,
    },
    {
      type: 'response.content_part.done',
      output_index: 0,
      content_index: 0,
      part: { type: 'output_text', text: outputText },
    },
    {
      type: 'response.output_item.done',
      output_index: 0,
      item: {
        type: 'message',
        id: 'msg-r1',
        role: 'assistant',
        status: 'completed',
        content: [{ type: 'output_text', text: outputText }],
      },
    },
    {
      type: 'response.completed',
      response: {
        id: respId,
        model,
        status: 'completed',
        output: [
          {
            type: 'message',
            id: 'msg-r1',
            role: 'assistant',
            status: 'completed',
            content: [{ type: 'output_text', text: outputText }],
          },
        ],
      },
    },
  ];
  return events.map(e => `data: ${JSON.stringify(e)}\n\n`).join('');
}

/**
 * Creates a lightweight HTTP server that simulates LlamaStack's
 * Responses API. Routes responses based on the `instructions` field
 * in the request body so tests get deterministic, inspectable behavior.
 */
function createMockLlamaStackServer(): MockLlamaStackServer {
  const calls: RecordedCall[] = [];
  let server: http.Server;
  let serverPort = 0;

  const handler = (req: http.IncomingMessage, res: http.ServerResponse) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
    });
    req.on('end', () => {
      const url = req.url ?? '';
      const method = req.method ?? 'GET';
      let parsedBody: Record<string, unknown> = {};
      try {
        parsedBody = JSON.parse(body);
      } catch {
        /* empty body for GET */
      }

      const headers: Record<string, string> = {};
      for (const [k, v] of Object.entries(req.headers)) {
        if (typeof v === 'string') headers[k] = v;
      }

      calls.push({ url, method, body: parsedBody, headers });

      if (url === '/v1/models') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            data: [{ id: 'test-model', object: 'model', owned_by: 'test' }],
          }),
        );
        return;
      }

      if (url === '/v1/responses' && method === 'POST') {
        const instructions = (parsedBody.instructions as string) ?? '';
        const model = (parsedBody.model as string) ?? 'test-model';
        const isStream = parsedBody.stream === true;
        const input = parsedBody.input;
        const inputStr =
          typeof input === 'string' ? input : JSON.stringify(input);

        // Agent-as-tool error simulation: return HTTP 500 for "error-trigger" agents
        if (instructions.toLowerCase().includes('error-trigger')) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Simulated sub-agent failure' }));
          return;
        }

        const isTriage = instructions.toLowerCase().includes('triage');
        const isBilling = instructions.toLowerCase().includes('billing');
        const isTechnical = instructions.toLowerCase().includes('technical');
        const isOrchestrator = instructions
          .toLowerCase()
          .includes('orchestrator');
        const wantsReasoning = instructions
          .toLowerCase()
          .includes('use reasoning');

        const wantsBillingHandoff =
          isTriage &&
          (inputStr.toLowerCase().includes('refund') ||
            inputStr.toLowerCase().includes('billing') ||
            inputStr.toLowerCase().includes('invoice'));

        const wantsTechnicalHandoff =
          isTriage &&
          (inputStr.toLowerCase().includes('error') ||
            inputStr.toLowerCase().includes('deploy') ||
            inputStr.toLowerCase().includes('technical'));

        // Agent-as-tool: orchestrator calls call_helper, then gets error back
        const hasToolOutput =
          Array.isArray(input) &&
          (input as Array<Record<string, unknown>>).some(
            (i: Record<string, unknown>) => i.type === 'function_call_output',
          );

        const wantsAgentToolCall =
          isOrchestrator &&
          !hasToolOutput &&
          inputStr.toLowerCase().includes('run helper');

        if (isStream) {
          res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive',
          });

          let sseData: string;
          if (wantsBillingHandoff) {
            sseData = makeStreamHandoffEvents('billing', model);
          } else if (wantsTechnicalHandoff) {
            sseData = makeStreamHandoffEvents('technical', model);
          } else if (isBilling) {
            sseData = makeStreamEvents(
              'Your billing issue has been resolved. The refund will be processed within 3-5 business days.',
              model,
            );
          } else if (isTechnical) {
            sseData = makeStreamEvents(
              'I have identified the deployment error. Please check your container logs.',
              model,
            );
          } else if (wantsReasoning) {
            sseData = makeStreamEventsWithReasoning(
              'Let me think about this carefully...',
              'Here is my well-reasoned answer.',
              model,
            );
          } else {
            sseData = makeStreamEvents(
              'Hello! How can I help you today?',
              model,
            );
          }

          res.write(sseData);
          res.end();
          return;
        }

        let response: Record<string, unknown>;
        if (wantsAgentToolCall) {
          response = makeAgentToolCallResponse('helper', model);
        } else if (isOrchestrator && hasToolOutput) {
          response = makeTextResponse(
            'The helper agent reported an issue but I can still help you.',
            model,
          );
        } else if (wantsBillingHandoff) {
          response = makeHandoffResponse('billing', model);
        } else if (wantsTechnicalHandoff) {
          response = makeHandoffResponse('technical', model);
        } else if (isBilling) {
          response = makeTextResponse(
            'Your billing issue has been resolved. The refund will be processed within 3-5 business days.',
            model,
          );
        } else if (isTechnical) {
          response = makeTextResponse(
            'I have identified the deployment error. Please check your container logs.',
            model,
          );
        } else {
          response = makeTextResponse(
            'Hello! How can I help you today?',
            model,
          );
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(response));
        return;
      }

      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not found' }));
    });
  };

  return {
    listen: () =>
      new Promise<number>(resolve => {
        server = http.createServer(handler);
        server.listen(0, '127.0.0.1', () => {
          serverPort = (server.address() as AddressInfo).port;
          resolve(serverPort);
        });
      }),
    close: () =>
      new Promise<void>((resolve, reject) => {
        if (!server) {
          resolve();
          return;
        }
        server.close(err => (err ? reject(err) : resolve()));
      }),
    getCalls: () => calls,
    getResponsesCalls: () => calls.filter(c => c.url === '/v1/responses'),
    clearCalls: () => {
      calls.length = 0;
    },
    port: () => serverPort,
  };
}

// ---------------------------------------------------------------------------
//  Test Config Helper
// ---------------------------------------------------------------------------

function createTestConfig(options: {
  baseUrl: string;
  model?: string;
  systemPrompt?: string;
  zdrMode?: boolean;
  safetyPatterns?: string[];
  agents?: Record<string, Record<string, unknown>>;
  defaultAgent?: string;
  maxAgentTurns?: number;
}): RootConfigService {
  const llamaStack: Record<string, unknown> = {
    baseUrl: options.baseUrl,
    model: options.model ?? 'test-model',
    vectorStoreName: 'test-vs',
    embeddingModel: 'test-embed',
    embeddingDimension: 384,
    chunkingStrategy: 'auto',
    maxChunkSizeTokens: 800,
    chunkOverlapTokens: 400,
    skipTlsVerify: false,
  };

  if (options.zdrMode) {
    llamaStack.zdrMode = true;
  }

  const augment: Record<string, unknown> = {
    llamaStack,
    systemPrompt: options.systemPrompt ?? 'You are a helpful assistant.',
    proxyBaseUrl: 'http://localhost:7007/api/augment',
  };

  if (options.safetyPatterns) {
    augment.safetyPatterns = options.safetyPatterns;
  }

  if (options.agents) {
    augment.agents = options.agents;
    if (options.defaultAgent) augment.defaultAgent = options.defaultAgent;
    if (options.maxAgentTurns) augment.maxAgentTurns = options.maxAgentTurns;
  }

  const data: Record<string, unknown> = { augment };

  return buildConfigService(data);
}

/**
 * Builds a minimal RootConfigService from a plain data object.
 * Supports nested dot-path lookups like `config.getOptionalString('a.b.c')`.
 */
function buildConfigService(data: Record<string, unknown>): RootConfigService {
  function getByPath(obj: unknown, path: string): unknown {
    const parts = path.split('.');
    let current: unknown = obj;
    for (const part of parts) {
      if (
        current === null ||
        current === undefined ||
        typeof current !== 'object'
      )
        return undefined;
      current = (current as Record<string, unknown>)[part];
    }
    return current;
  }

  function makeConfigApi(root: unknown): RootConfigService {
    const api: RootConfigService = {
      has: (key: string) => getByPath(root, key) !== undefined,
      keys: () => (root && typeof root === 'object' ? Object.keys(root) : []),
      get: (key?: string) => {
        const val = key ? getByPath(root, key) : root;
        if (val === undefined)
          throw new Error(`Missing required config: ${key}`);
        return val;
      },
      getOptional: (key?: string) => (key ? getByPath(root, key) : root),
      getString: (key: string) => {
        const val = getByPath(root, key);
        if (typeof val !== 'string')
          throw new Error(`Missing required string config: ${key}`);
        return val;
      },
      getOptionalString: (key: string) => {
        const val = getByPath(root, key);
        return typeof val === 'string' ? val : undefined;
      },
      getNumber: (key: string) => {
        const val = getByPath(root, key);
        if (typeof val !== 'number')
          throw new Error(`Missing required number config: ${key}`);
        return val;
      },
      getOptionalNumber: (key: string) => {
        const val = getByPath(root, key);
        return typeof val === 'number' ? val : undefined;
      },
      getBoolean: (key: string) => {
        const val = getByPath(root, key);
        if (typeof val !== 'boolean')
          throw new Error(`Missing required boolean config: ${key}`);
        return val;
      },
      getOptionalBoolean: (key: string) => {
        const val = getByPath(root, key);
        return typeof val === 'boolean' ? val : undefined;
      },
      getStringArray: (key: string) => {
        const val = getByPath(root, key);
        if (!Array.isArray(val))
          throw new Error(`Missing required string array config: ${key}`);
        return val as string[];
      },
      getOptionalStringArray: (key: string) => {
        const val = getByPath(root, key);
        return Array.isArray(val) ? (val as string[]) : undefined;
      },
      getConfig: (key: string) => {
        const val = getByPath(root, key);
        if (val === null || val === undefined || typeof val !== 'object') {
          throw new Error(`Missing required config section: ${key}`);
        }
        return makeConfigApi(val);
      },
      getOptionalConfig: (key: string) => {
        const val = getByPath(root, key);
        if (val === null || val === undefined || typeof val !== 'object')
          return undefined;
        return makeConfigApi(val);
      },
      getConfigArray: (key: string) => {
        const val = getByPath(root, key);
        if (!Array.isArray(val))
          throw new Error(`Missing required config array: ${key}`);
        return val.map((item: unknown) => makeConfigApi(item));
      },
      getOptionalConfigArray: (key: string) => {
        const val = getByPath(root, key);
        if (!Array.isArray(val)) return undefined;
        return val.map((item: unknown) => makeConfigApi(item));
      },
    } as unknown as RootConfigService;
    return api;
  }

  return makeConfigApi(data);
}

// ---------------------------------------------------------------------------
//  Logger
// ---------------------------------------------------------------------------

function createTestLogger(): LoggerService & { warnCalls: string[] } {
  const warnCalls: string[] = [];
  return {
    info: jest.fn(),
    warn: jest.fn((...args: unknown[]) => {
      warnCalls.push(String(args[0]));
    }),
    error: jest.fn(),
    debug: jest.fn(),
    child: jest.fn().mockReturnThis(),
    warnCalls,
  } as unknown as LoggerService & { warnCalls: string[] };
}

// ---------------------------------------------------------------------------
//  Test Helpers
// ---------------------------------------------------------------------------

function chatRequest(
  content: string,
  extras?: Partial<ChatRequest>,
): ChatRequest {
  return {
    messages: [{ role: 'user' as const, content }],
    ...extras,
  } as ChatRequest;
}

function multiMessageRequest(
  messages: Array<{ role: string; content: string }>,
): ChatRequest {
  return { messages } as ChatRequest;
}

// ---------------------------------------------------------------------------
//  Tests: Mock LlamaStack Server
// ---------------------------------------------------------------------------

describe('Multi-Agent E2E (mock server)', () => {
  let mockServer: MockLlamaStackServer;

  beforeAll(async () => {
    responseIdCounter = 0;
    mockServer = createMockLlamaStackServer();
    await mockServer.listen();
  });

  afterAll(async () => {
    await mockServer.close();
  });

  beforeEach(() => {
    mockServer.clearCalls();
    responseIdCounter = 0;
  });

  // -----------------------------------------------------------------------
  //  Scenario 1: Single-agent (auto-synthesized)
  // -----------------------------------------------------------------------

  describe('single-agent (auto-synthesized)', () => {
    it('sends a chat request and gets a response through the full chain', async () => {
      const logger = createTestLogger();
      const config = createTestConfig({
        baseUrl: `http://127.0.0.1:${mockServer.port()}`,
        systemPrompt: 'You are a helpful assistant.',
      });

      const orchestrator = new ResponsesApiCoordinator({ logger, config });
      await orchestrator.initialize();

      const response = await orchestrator.chat(chatRequest('Hello'));

      expect(response).toBeDefined();
      expect(response.content).toBe('Hello! How can I help you today?');
      expect(response.responseId).toBeDefined();

      const apiCalls = mockServer.getResponsesCalls();
      expect(apiCalls.length).toBe(1);
      expect(apiCalls[0].body.model).toBe('test-model');
      expect(apiCalls[0].body.instructions).toContain('helpful assistant');
    });
  });

  // -----------------------------------------------------------------------
  //  Scenario 2: Multi-agent handoff (triage -> billing)
  // -----------------------------------------------------------------------

  describe('multi-agent handoff (triage -> billing)', () => {
    let orchestrator: ResponsesApiCoordinator;

    beforeEach(async () => {
      mockServer.clearCalls();
      const logger = createTestLogger();
      const config = createTestConfig({
        baseUrl: `http://127.0.0.1:${mockServer.port()}`,
        agents: {
          triage: {
            name: 'Triage Agent',
            instructions:
              'You are a triage agent. Route billing to billing, technical to technical.',
            handoffs: ['billing', 'technical'],
          },
          billing: {
            name: 'Billing Agent',
            instructions: 'You are a billing specialist.',
            handoffDescription: 'Handles refunds, payments, invoices.',
          },
          technical: {
            name: 'Technical Agent',
            instructions: 'You are a technical support specialist.',
            handoffDescription:
              'Handles errors, deployments, technical issues.',
          },
        },
        defaultAgent: 'triage',
        maxAgentTurns: 6,
      });

      orchestrator = new ResponsesApiCoordinator({ logger, config });
      await orchestrator.initialize();
    });

    it('hands off from triage to billing agent', async () => {
      const response = await orchestrator.chat(chatRequest('I need a refund'));

      expect(response.content).toContain('refund');
      expect(response.content).toContain('3-5 business days');
      expect(response.responseId).toBeDefined();

      const apiCalls = mockServer.getResponsesCalls();
      expect(apiCalls.length).toBe(2);

      expect(apiCalls[0].body.instructions).toContain('triage');
      expect(apiCalls[1].body.instructions).toContain('billing');

      expect(apiCalls[1].body.previous_response_id).toBeDefined();
      const secondInput = apiCalls[1].body.input;
      expect(Array.isArray(secondInput)).toBe(true);
      expect((secondInput as Array<Record<string, unknown>>)[0].type).toBe(
        'function_call_output',
      );
    });
  });

  // -----------------------------------------------------------------------
  //  Scenario 3: Multi-agent handoff (triage -> technical)
  // -----------------------------------------------------------------------

  describe('multi-agent handoff (triage -> technical)', () => {
    it('hands off from triage to technical agent', async () => {
      const logger = createTestLogger();
      const config = createTestConfig({
        baseUrl: `http://127.0.0.1:${mockServer.port()}`,
        agents: {
          triage: {
            name: 'Triage Agent',
            instructions:
              'You are a triage agent. Route billing to billing, technical to technical.',
            handoffs: ['billing', 'technical'],
          },
          billing: {
            name: 'Billing Agent',
            instructions: 'You are a billing specialist.',
            handoffDescription: 'Handles billing.',
          },
          technical: {
            name: 'Technical Agent',
            instructions: 'You are a technical support specialist.',
            handoffDescription: 'Handles technical issues.',
          },
        },
        defaultAgent: 'triage',
        maxAgentTurns: 6,
      });

      const orchestrator = new ResponsesApiCoordinator({ logger, config });
      await orchestrator.initialize();

      const response = await orchestrator.chat(
        chatRequest('I have a deployment error'),
      );

      expect(response.content).toContain('deployment error');
      expect(response.content).toContain('container logs');

      const apiCalls = mockServer.getResponsesCalls();
      expect(apiCalls.length).toBe(2);
      expect(apiCalls[0].body.instructions).toContain('triage');
      expect(apiCalls[1].body.instructions).toContain('technical');
    });
  });

  // -----------------------------------------------------------------------
  //  Scenario 4: Streaming single-agent
  // -----------------------------------------------------------------------

  describe('streaming single-agent', () => {
    it('streams events through the full chain', async () => {
      const logger = createTestLogger();
      const config = createTestConfig({
        baseUrl: `http://127.0.0.1:${mockServer.port()}`,
        systemPrompt: 'You are helpful.',
      });

      const orchestrator = new ResponsesApiCoordinator({ logger, config });
      await orchestrator.initialize();

      const events: string[] = [];
      await orchestrator.chatStream(chatRequest('Hello'), (event: string) =>
        events.push(event),
      );

      expect(events.length).toBeGreaterThan(0);

      const parsed = events
        .map(e => {
          try {
            return JSON.parse(e);
          } catch {
            return null;
          }
        })
        .filter(Boolean);
      const started = parsed.find(
        (e: Record<string, unknown>) => e.type === 'stream.started',
      );
      const created = parsed.find(
        (e: Record<string, unknown>) => e.type === 'response.created',
      );
      const hasStart = started ?? created;
      expect(hasStart).toBeDefined();
      // eslint-disable-next-line jest/no-conditional-expect
      if (hasStart?.responseId) expect(hasStart.responseId).toBeDefined();
      // eslint-disable-next-line jest/no-conditional-expect
      if (hasStart?.response?.id) expect(hasStart.response.id).toBeDefined();

      const textDelta = parsed.find(
        (e: Record<string, unknown>) =>
          e.type === 'stream.text.delta' ||
          e.type === 'response.output_text.delta',
      );
      expect(textDelta).toBeDefined();
      expect((textDelta?.delta as string) ?? '').toContain('Hello');
    });

    it('forwards reasoning events before text events in correct order', async () => {
      const logger = createTestLogger();
      const config = createTestConfig({
        baseUrl: `http://127.0.0.1:${mockServer.port()}`,
        systemPrompt: 'You are helpful. Use reasoning to think carefully.',
      });

      const orchestrator = new ResponsesApiCoordinator({ logger, config });
      await orchestrator.initialize();

      const events: string[] = [];
      await orchestrator.chatStream(
        chatRequest('Explain quantum computing'),
        (event: string) => events.push(event),
      );

      expect(events.length).toBeGreaterThan(0);

      const parsed = events
        .map(e => {
          try {
            return JSON.parse(e);
          } catch {
            return null;
          }
        })
        .filter(Boolean);
      const types = parsed.map((e: Record<string, unknown>) => e.type);

      const createdIdx = types.indexOf('stream.started');
      const reasoningDeltaIdx = types.indexOf('stream.reasoning.delta');
      const reasoningDoneIdx = types.indexOf('stream.reasoning.done');
      const textDeltaIdx = types.indexOf('stream.text.delta');
      const completedIdx = types.indexOf('stream.completed');

      expect(createdIdx).toBeGreaterThanOrEqual(0);
      expect(reasoningDeltaIdx).toBeGreaterThanOrEqual(0);
      expect(reasoningDoneIdx).toBeGreaterThanOrEqual(0);
      expect(textDeltaIdx).toBeGreaterThanOrEqual(0);
      expect(completedIdx).toBeGreaterThanOrEqual(0);

      expect(createdIdx).toBeLessThan(reasoningDeltaIdx);
      expect(reasoningDeltaIdx).toBeLessThan(reasoningDoneIdx);
      expect(reasoningDoneIdx).toBeLessThan(textDeltaIdx);
      expect(textDeltaIdx).toBeLessThan(completedIdx);

      const reasoningEvent = parsed.find(
        (e: Record<string, unknown>) => e.type === 'stream.reasoning.delta',
      );
      expect((reasoningEvent?.delta as string) ?? '').toContain('think');
    });
  });

  // -----------------------------------------------------------------------
  //  Scenario 5: Streaming multi-agent handoff
  // -----------------------------------------------------------------------

  describe('streaming multi-agent handoff', () => {
    it('emits handoff event and streams specialist response', async () => {
      const logger = createTestLogger();
      const config = createTestConfig({
        baseUrl: `http://127.0.0.1:${mockServer.port()}`,
        agents: {
          triage: {
            name: 'Triage Agent',
            instructions: 'You are a triage agent. Route billing to billing.',
            handoffs: ['billing'],
          },
          billing: {
            name: 'Billing Agent',
            instructions: 'You are a billing specialist.',
            handoffDescription: 'Handles billing.',
          },
        },
        defaultAgent: 'triage',
        maxAgentTurns: 6,
      });

      const orchestrator = new ResponsesApiCoordinator({ logger, config });
      await orchestrator.initialize();

      const events: string[] = [];
      await orchestrator.chatStream(
        chatRequest('I need a refund please'),
        (event: string) => events.push(event),
      );

      expect(events.length).toBeGreaterThan(0);

      const parsed = events
        .map(e => {
          try {
            return JSON.parse(e);
          } catch {
            return null;
          }
        })
        .filter(Boolean);

      const handoffEvent = parsed.find(
        (e: Record<string, unknown>) => e.type === 'stream.agent.handoff',
      );
      expect(handoffEvent).toBeDefined();
      expect(handoffEvent.toAgent).toBe('Billing Agent');

      const textDelta = parsed.find(
        (e: Record<string, unknown>) =>
          e.type === 'stream.text.delta' ||
          e.type === 'response.output_text.delta',
      );
      expect(textDelta).toBeDefined();
      expect((textDelta?.delta as string) ?? '').toContain('refund');
    });
  });

  // -----------------------------------------------------------------------
  //  Scenario 6: prepareFirstTurn integration
  // -----------------------------------------------------------------------

  describe('prepareFirstTurn integration', () => {
    it.skip('includes conversation context from multi-message requests', async () => {
      const logger = createTestLogger();
      const config = createTestConfig({
        baseUrl: `http://127.0.0.1:${mockServer.port()}`,
        systemPrompt: 'You are helpful.',
      });

      const orchestrator = new ResponsesApiCoordinator({ logger, config });
      await orchestrator.initialize();

      await orchestrator.chat(
        multiMessageRequest([
          { role: 'user', content: 'What is Kubernetes?' },
          {
            role: 'assistant',
            content: 'Kubernetes is a container orchestration platform.',
          },
          { role: 'user', content: 'How do I deploy to it?' },
        ]),
      );

      const apiCalls = mockServer.getResponsesCalls();
      expect(apiCalls.length).toBe(1);
      expect(apiCalls[0].body.instructions).toContain('CONVERSATION CONTEXT');
      expect(apiCalls[0].body.instructions).toContain('Kubernetes');
    });

    it.skip('does not include conversation context when previousResponseId is present', async () => {
      const logger = createTestLogger();
      const config = createTestConfig({
        baseUrl: `http://127.0.0.1:${mockServer.port()}`,
        systemPrompt: 'You are helpful.',
      });

      const orchestrator = new ResponsesApiCoordinator({ logger, config });
      await orchestrator.initialize();

      await orchestrator.chat(
        multiMessageRequest([
          { role: 'user', content: 'What is Kubernetes?' },
          { role: 'assistant', content: 'It is a container platform.' },
          { role: 'user', content: 'Tell me more' },
        ]),
      );

      const withContext = mockServer.getResponsesCalls();
      expect(withContext[0].body.instructions).toContain(
        'CONVERSATION CONTEXT',
      );

      mockServer.clearCalls();

      await orchestrator.chat({
        messages: [{ role: 'user', content: 'Follow up' }],
        previousResponseId: 'resp-existing',
      } as ChatRequest);

      const withoutContext = mockServer.getResponsesCalls();
      expect(String(withoutContext[0].body.instructions)).not.toContain(
        'CONVERSATION CONTEXT',
      );
      expect(withoutContext[0].body.previous_response_id).toBe('resp-existing');
    });
  });

  // -----------------------------------------------------------------------
  //  Scenario 7: ZDR mode behavior
  // -----------------------------------------------------------------------

  describe('ZDR mode behavior', () => {
    it('sends store:false and limits to 1 turn', async () => {
      const logger = createTestLogger();
      const config = createTestConfig({
        baseUrl: `http://127.0.0.1:${mockServer.port()}`,
        systemPrompt: 'You are helpful.',
        zdrMode: true,
      });

      const orchestrator = new ResponsesApiCoordinator({ logger, config });
      await orchestrator.initialize();

      const response = await orchestrator.chat(chatRequest('Hello'));
      expect(response.content).toBeDefined();

      const apiCalls = mockServer.getResponsesCalls();
      expect(apiCalls.length).toBe(1);
      expect(apiCalls[0].body.store).toBe(false);
      expect(apiCalls[0].body.include).toEqual(
        expect.arrayContaining(['reasoning.encrypted_content']),
      );
    });
  });

  // -----------------------------------------------------------------------
  //  Scenario: handoff tools are registered
  // -----------------------------------------------------------------------

  describe('agent tool registration', () => {
    it('registers handoff function tools in API calls', async () => {
      const logger = createTestLogger();
      const config = createTestConfig({
        baseUrl: `http://127.0.0.1:${mockServer.port()}`,
        agents: {
          triage: {
            name: 'Triage Agent',
            instructions: 'You are a triage agent.',
            handoffs: ['billing'],
          },
          billing: {
            name: 'Billing Agent',
            instructions: 'You are a billing specialist.',
            handoffDescription: 'Handles billing.',
          },
        },
        defaultAgent: 'triage',
        maxAgentTurns: 6,
      });

      const orchestrator = new ResponsesApiCoordinator({ logger, config });
      await orchestrator.initialize();

      await orchestrator.chat(chatRequest('Hello, general question'));

      const apiCalls = mockServer.getResponsesCalls();
      const firstCall = apiCalls[0];
      const tools = firstCall.body.tools as Array<Record<string, unknown>>;

      const handoffTool = tools?.find(
        (t: Record<string, unknown>) => t.name === 'transfer_to_billing',
      );
      expect(handoffTool).toBeDefined();
      expect(handoffTool!.type).toBe('function');
    });
  });

  // -----------------------------------------------------------------------
  //  Scenario B1: Streaming maxTurns exceeded emits stream.error
  // -----------------------------------------------------------------------

  describe('streaming maxTurns exceeded (B1)', () => {
    it.skip('emits stream.error with max_turns_exceeded code', async () => {
      const logger = createTestLogger();
      const config = createTestConfig({
        baseUrl: `http://127.0.0.1:${mockServer.port()}`,
        agents: {
          triage: {
            name: 'Triage Agent',
            instructions: 'You are a triage agent. Route billing to billing.',
            handoffs: ['billing'],
          },
          billing: {
            name: 'Billing Agent',
            instructions: 'You are a billing specialist.',
            handoffDescription: 'Handles billing.',
          },
        },
        defaultAgent: 'triage',
        maxAgentTurns: 1,
      });

      const orchestrator = new ResponsesApiCoordinator({ logger, config });
      await orchestrator.initialize();

      const events: string[] = [];
      await orchestrator.chatStream(
        chatRequest('I need a refund please'),
        (event: string) => events.push(event),
      );

      const parsed = events
        .map(e => {
          try {
            return JSON.parse(e);
          } catch {
            return null;
          }
        })
        .filter(Boolean);

      const errorEvent = parsed.find(
        (e: Record<string, unknown>) => e.type === 'stream.error',
      );
      expect(errorEvent).toBeDefined();
      expect(errorEvent.code).toBe('max_turns_exceeded');
      expect(errorEvent.error).toContain('maximum turns');
    });
  });

  // -----------------------------------------------------------------------
  //  Scenario B2: Agent-as-tool error is caught (non-streaming)
  // -----------------------------------------------------------------------

  describe('agent-as-tool error handling (B2)', () => {
    it('catches sub-agent error and feeds it back to the parent', async () => {
      const logger = createTestLogger();
      const config = createTestConfig({
        baseUrl: `http://127.0.0.1:${mockServer.port()}`,
        agents: {
          orchestrator: {
            name: 'Orchestrator Agent',
            instructions:
              'You are an orchestrator agent. Use call_helper when asked.',
            asTools: ['helper'],
          },
          helper: {
            name: 'Helper Agent',
            instructions: 'You are an error-trigger agent.',
            handoffDescription: 'Runs helper tasks.',
          },
        },
        defaultAgent: 'orchestrator',
        maxAgentTurns: 6,
      });

      const orchestrator = new ResponsesApiCoordinator({ logger, config });
      await orchestrator.initialize();

      const response = await orchestrator.chat(
        chatRequest('Please run helper for me'),
      );

      expect(response).toBeDefined();
      expect(response.content).toBeDefined();
      expect(response.content).toContain('helper agent reported an issue');

      const apiCalls = mockServer.getResponsesCalls();
      expect(apiCalls.length).toBe(3);
      expect(apiCalls[0].body.instructions).toContain('orchestrator');
      expect(apiCalls[1].body.instructions).toContain('error-trigger');

      const thirdInput = apiCalls[2].body.input as Array<
        Record<string, unknown>
      >;
      expect(thirdInput[0].type).toBe('function_call_output');
      expect(thirdInput[0].output).toContain('encountered an error');
    });
  });

  // -----------------------------------------------------------------------
  //  Scenario B3: ChatResponse includes agentName and handoffPath
  // -----------------------------------------------------------------------

  describe('ChatResponse agent metadata (B3)', () => {
    it('includes agentName and handoffPath after handoff', async () => {
      const logger = createTestLogger();
      const config = createTestConfig({
        baseUrl: `http://127.0.0.1:${mockServer.port()}`,
        agents: {
          triage: {
            name: 'Triage Agent',
            instructions: 'You are a triage agent. Route billing to billing.',
            handoffs: ['billing'],
          },
          billing: {
            name: 'Billing Agent',
            instructions: 'You are a billing specialist.',
            handoffDescription: 'Handles billing.',
          },
        },
        defaultAgent: 'triage',
        maxAgentTurns: 6,
      });

      const orchestrator = new ResponsesApiCoordinator({ logger, config });
      await orchestrator.initialize();

      const response: ChatResponse = await orchestrator.chat(
        chatRequest('I need a refund'),
      );

      expect(response.agentName).toBe('Billing Agent');
      expect(response.handoffPath).toEqual(['triage', 'billing']);
    });

    it('includes agentName but no handoffPath for single-agent', async () => {
      const logger = createTestLogger();
      const config = createTestConfig({
        baseUrl: `http://127.0.0.1:${mockServer.port()}`,
        systemPrompt: 'You are a helpful assistant.',
      });

      const orchestrator = new ResponsesApiCoordinator({ logger, config });
      await orchestrator.initialize();

      const response: ChatResponse = await orchestrator.chat(
        chatRequest('Hello'),
      );

      expect(response.agentName).toBeDefined();
      expect(response.handoffPath).toBeUndefined();
    });

    it('includes agentName on maxTurns fallback response', async () => {
      const logger = createTestLogger();
      const config = createTestConfig({
        baseUrl: `http://127.0.0.1:${mockServer.port()}`,
        agents: {
          triage: {
            name: 'Triage Agent',
            instructions: 'You are a triage agent. Route billing to billing.',
            handoffs: ['billing'],
          },
          billing: {
            name: 'Billing Agent',
            instructions: 'You are a billing specialist.',
            handoffDescription: 'Handles billing.',
          },
        },
        defaultAgent: 'triage',
        maxAgentTurns: 1,
      });

      const orchestrator = new ResponsesApiCoordinator({ logger, config });
      await orchestrator.initialize();

      const response: ChatResponse = await orchestrator.chat(
        chatRequest('I need a refund'),
      );

      expect(response.agentName).toBeDefined();
    });
  });
});

// ---------------------------------------------------------------------------
//  Tests: Real LlamaStack Instance (conditional)
// ---------------------------------------------------------------------------

const LLAMASTACK_URL = process.env.LLAMASTACK_URL;
const LLAMASTACK_MODEL =
  process.env.LLAMASTACK_MODEL ?? 'llama-4-scout-17b-16e-w4a16';

const describeReal = LLAMASTACK_URL ? describe : describe.skip;

describeReal('Multi-Agent E2E (real LlamaStack)', () => {
  // -----------------------------------------------------------------------
  //  Scenario 8: Real single-agent chat
  // -----------------------------------------------------------------------

  it('single-agent chat returns a response', async () => {
    const logger = createTestLogger();
    const config = createTestConfig({
      baseUrl: LLAMASTACK_URL!,
      model: LLAMASTACK_MODEL,
      systemPrompt: 'You are a helpful assistant. Be concise.',
    });

    const orchestrator = new ResponsesApiCoordinator({ logger, config });
    await orchestrator.initialize();

    const response = await orchestrator.chat(
      chatRequest('What is 2+2? Reply with just the number.'),
    );

    expect(response).toBeDefined();
    expect(response.content).toBeDefined();
    expect(response.content.length).toBeGreaterThan(0);
    expect(response.responseId).toBeDefined();
  }, 30000);

  // -----------------------------------------------------------------------
  //  Scenario 9: Real multi-agent handoff
  // -----------------------------------------------------------------------

  it('multi-agent handoff completes without error', async () => {
    const logger = createTestLogger();
    const config = createTestConfig({
      baseUrl: LLAMASTACK_URL!,
      model: LLAMASTACK_MODEL,
      agents: {
        triage: {
          name: 'Triage Agent',
          instructions: `You are a triage agent. Your ONLY job is to route the user:
- For billing/refund/payment questions: call transfer_to_billing
- For everything else: answer directly
Do NOT answer billing questions yourself. Always hand off.`,
          handoffs: ['billing'],
        },
        billing: {
          name: 'Billing Agent',
          instructions:
            'You are a billing specialist. Help with refunds and payments. Be concise.',
          handoffDescription:
            'Handles refunds, payments, invoices, and billing questions.',
        },
      },
      defaultAgent: 'triage',
      maxAgentTurns: 6,
    });

    const orchestrator = new ResponsesApiCoordinator({ logger, config });
    await orchestrator.initialize();

    const response = await orchestrator.chat(
      chatRequest('I need a refund for my last order'),
    );

    expect(response).toBeDefined();
    expect(response.content).toBeDefined();
    expect(response.content.length).toBeGreaterThan(0);
    expect(response.responseId).toBeDefined();
  }, 60000);
});
