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
import { BackendApprovalHandler } from './BackendApprovalHandler';
import { createMockLogger } from '../../test-utils/mocks';
import type { PendingBackendToolApproval } from './BackendApprovalStore';

function createMockDeps() {
  const mockChatService = {
    continueFunctionCallOutput: jest.fn().mockResolvedValue({
      responseId: 'resp-new',
      text: 'Tool result processed',
      functionCalls: [],
    }),
  };

  const pending: PendingBackendToolApproval = {
    responseId: 'resp-1',
    callId: 'call-1',
    functionName: 'ocp-mcp__namespaces_list',
    argumentsJson: '{"all":true}',
    serverId: 'ocp-mcp',
    serverUrl: 'https://mcp.example.com',
    originalToolName: 'namespaces_list',
    conversationId: 'conv_abc123',
    createdAt: Date.now(),
  };

  const mockApprovalStore = {
    get: jest.fn().mockReturnValue(pending),
    store: jest.fn(),
    remove: jest.fn(),
    listPending: jest.fn().mockReturnValue([]),
  };

  const mockExecutor = {
    executeTool: jest.fn().mockResolvedValue('ns1\nns2\nns3'),
    ensureToolsDiscovered: jest.fn().mockResolvedValue([]),
    getToolServerInfo: jest.fn().mockReturnValue(undefined),
  };

  let handlerFn:
    | ((approval: {
        responseId: string;
        callId: string;
        approved: boolean;
        toolName?: string;
        toolArguments?: string;
      }) => Promise<unknown>)
    | null = null;

  const mockFacade = {
    setBackendApprovalHandler: jest
      .fn()
      .mockImplementation((_store: unknown, fn: typeof handlerFn) => {
        handlerFn = fn;
      }),
  };

  const mockClient = { request: jest.fn(), streamRequest: jest.fn() };
  const mockClientManager = {
    getExistingClient: jest.fn().mockReturnValue(mockClient),
  };

  const mockConfigResolution = {
    getLlamaStackConfig: jest.fn().mockReturnValue({ model: 'test-model' }),
    getResolver: jest.fn().mockReturnValue({
      getCachedConfig: jest.fn().mockReturnValue({
        model: 'test-model',
        guardrails: undefined,
        safetyIdentifier: undefined,
      }),
    }),
  };

  const mockConversations = {
    registerResponse: jest.fn(),
  };

  return {
    deps: {
      conversationFacade: mockFacade as any,
      backendApprovalStore: mockApprovalStore as any,
      backendToolExecutor: mockExecutor as any,
      chatService: mockChatService as any,
      clientManager: mockClientManager as any,
      configResolution: mockConfigResolution as any,
      getConversations: () => mockConversations as any,
      getAgentGraphManager: () => null,
      getMcpServers: () => [],
      logger: createMockLogger(),
    },
    mocks: {
      chatService: mockChatService,
      approvalStore: mockApprovalStore,
      executor: mockExecutor,
      facade: mockFacade,
      conversations: mockConversations,
      pending,
    },
    getHandler: () => handlerFn!,
  };
}

describe('BackendApprovalHandler', () => {
  it('passes functionCall and conversationId to continueFunctionCallOutput on approval', async () => {
    const { deps, mocks, getHandler } = createMockDeps();
    const handler = new BackendApprovalHandler(deps);
    handler.initialize();

    const handlerFn = getHandler();
    await handlerFn({
      responseId: 'resp-1',
      callId: 'call-1',
      approved: true,
      toolName: 'namespaces_list',
      toolArguments: '{"all":true}',
    });

    expect(mocks.chatService.continueFunctionCallOutput).toHaveBeenCalledWith(
      expect.objectContaining({
        callId: 'call-1',
        previousResponseId: 'resp-1',
        functionCall: {
          name: 'ocp-mcp__namespaces_list',
          arguments: '{"all":true}',
        },
        conversationId: 'conv_abc123',
      }),
    );
  });

  it('passes functionCall to continueFunctionCallOutput on rejection', async () => {
    const { deps, mocks, getHandler } = createMockDeps();
    const handler = new BackendApprovalHandler(deps);
    handler.initialize();

    const handlerFn = getHandler();
    await handlerFn({
      responseId: 'resp-1',
      callId: 'call-1',
      approved: false,
      toolName: 'namespaces_list',
    });

    const call = mocks.chatService.continueFunctionCallOutput.mock.calls[0][0];
    expect(call.functionCall).toEqual({
      name: 'ocp-mcp__namespaces_list',
      arguments: '{"all":true}',
    });
    expect(call.conversationId).toBe('conv_abc123');
    expect(JSON.parse(call.output)).toEqual(
      expect.objectContaining({ error: expect.stringContaining('rejected') }),
    );
  });

  it('registers response in conversation when conversationId is present', async () => {
    const { deps, mocks, getHandler } = createMockDeps();
    const handler = new BackendApprovalHandler(deps);
    handler.initialize();

    const handlerFn = getHandler();
    await handlerFn({
      responseId: 'resp-1',
      callId: 'call-1',
      approved: true,
      toolName: 'namespaces_list',
    });

    expect(mocks.conversations.registerResponse).toHaveBeenCalledWith(
      'conv_abc123',
      'resp-new',
    );
  });

  it('handles tool execution failure gracefully', async () => {
    const { deps, mocks, getHandler } = createMockDeps();
    mocks.executor.executeTool.mockRejectedValue(new Error('MCP server down'));
    const handler = new BackendApprovalHandler(deps);
    handler.initialize();

    const handlerFn = getHandler();
    const result = await handlerFn({
      responseId: 'resp-1',
      callId: 'call-1',
      approved: true,
      toolName: 'namespaces_list',
    });

    const call = mocks.chatService.continueFunctionCallOutput.mock.calls[0][0];
    expect(JSON.parse(call.output)).toEqual(
      expect.objectContaining({
        error: expect.stringContaining('MCP server down'),
      }),
    );
    expect(result).toEqual(expect.objectContaining({ toolExecuted: true }));
  });
});
