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
  WorkflowDefinition,
  WorkflowNode,
  WorkflowEdge,
} from '@red-hat-developer-hub/backstage-plugin-augment-common';
import type { ResponsesApiClient } from '../../../responses-api/client/ResponsesApiClient';
import type {
  ExecutionTraceRecord,
  WorkflowExecutionResult,
  NodeExecutionResult,
  StreamEventEmitter,
} from './types';
import {
  executeAgentNode,
  executeClassifyNode,
  executeLogicNode,
  executeTransformNode,
  executeSetStateNode,
  executeUserInteractionNode,
  makeSkippedTrace,
} from './NodeExecutors';
import { executeMcpNode } from './McpExecutor';
import { resolveNextNode, getFirstSequenceTarget } from './EdgeResolver';
import { executeAgentNodeStreaming } from './StreamingExecutor';

const MAX_STEPS = 50;

/**
 * Graph-traversal engine that executes workflow definitions against
 * the LlamaStack /v1/responses endpoint, node by node.
 */
export class WorkflowExecutor {
  private readonly nodeMap = new Map<string, WorkflowNode>();
  private readonly edgesBySource = new Map<string, WorkflowEdge[]>();

  constructor(
    private readonly logger: LoggerService,
    private readonly client: ResponsesApiClient,
    private readonly defaultModel: string,
  ) {}

  async execute(
    definition: WorkflowDefinition,
    userInput: string,
  ): Promise<WorkflowExecutionResult> {
    const startTime = Date.now();
    this.buildGraph(definition);

    const startNode = definition.nodes.find(n => n.type === 'start');
    if (!startNode) throw new Error('Workflow has no start node');

    const trace: ExecutionTraceRecord[] = [];
    const state: Record<string, unknown> = { input: userInput };
    let previousResponseId: string | undefined;
    let finalOutput = '';
    let currentNodeId = getFirstSequenceTarget(this.edgesBySource.get(startNode.id) || []);
    let steps = 0;

    while (currentNodeId && steps < MAX_STEPS) {
      steps++;
      const node = this.nodeMap.get(currentNodeId);
      if (!node) { this.logger.warn(`Node ${currentNodeId} not found, stopping`); break; }

      if (node.type === 'end') {
        trace.push(makeEndTrace(node, finalOutput));
        break;
      }

      const result = await this.runNode(node, userInput, state, previousResponseId);
      trace.push(result.trace);

      if (result.trace.status === 'failed') {
        finalOutput = result.trace.error || 'Execution failed';
        break;
      }

      if (result.trace.responseId) previousResponseId = result.trace.responseId;
      if (result.output !== undefined) {
        state[`${node.id}_output`] = result.output;
        finalOutput = typeof result.output === 'string' ? result.output : JSON.stringify(result.output);
      }

      currentNodeId = resolveNextNode(node, result, this.edgesBySource.get(node.id) || []);
    }

    return { finalOutput, trace, state, totalDurationMs: Date.now() - startTime };
  }

  async executeStream(
    definition: WorkflowDefinition,
    userInput: string,
    onEvent: StreamEventEmitter,
    signal?: AbortSignal,
  ): Promise<WorkflowExecutionResult> {
    const startTime = Date.now();
    this.buildGraph(definition);

    const startNode = definition.nodes.find(n => n.type === 'start');
    if (!startNode) throw new Error('Workflow has no start node');

    onEvent({ type: 'workflow.started', data: { workflowId: definition.id, input: userInput } });

    const trace: ExecutionTraceRecord[] = [];
    const state: Record<string, unknown> = { input: userInput };
    let previousResponseId: string | undefined;
    let finalOutput = '';
    let currentNodeId = getFirstSequenceTarget(this.edgesBySource.get(startNode.id) || []);
    let steps = 0;

    while (currentNodeId && steps < MAX_STEPS) {
      if (signal?.aborted) break;
      steps++;

      const node = this.nodeMap.get(currentNodeId);
      if (!node) break;

      if (node.type === 'end') {
        const endTrace = makeEndTrace(node, finalOutput);
        trace.push(endTrace);
        onEvent({ type: 'node.completed', data: { nodeId: node.id, trace: endTrace } });
        break;
      }

      onEvent({ type: 'node.started', data: { nodeId: node.id, nodeType: node.type, nodeName: node.label || node.id } });

      let result: NodeExecutionResult;
      if (node.type === 'agent') {
        result = await executeAgentNodeStreaming(
          node, userInput, state, previousResponseId,
          this.defaultModel, this.client, this.logger, onEvent, signal,
        );
      } else {
        result = await this.runNode(node, userInput, state, previousResponseId);
      }

      trace.push(result.trace);

      if (result.trace.status === 'failed') {
        onEvent({ type: 'node.failed', data: { nodeId: node.id, error: result.trace.error } });
        finalOutput = result.trace.error || 'Execution failed';
        break;
      }

      onEvent({ type: 'node.completed', data: { nodeId: node.id, trace: result.trace } });

      if (result.trace.responseId) previousResponseId = result.trace.responseId;
      if (result.output !== undefined) {
        state[`${node.id}_output`] = result.output;
        finalOutput = typeof result.output === 'string' ? result.output : JSON.stringify(result.output);
      }

      currentNodeId = resolveNextNode(node, result, this.edgesBySource.get(node.id) || []);
    }

    const totalDurationMs = Date.now() - startTime;
    onEvent({ type: 'workflow.completed', data: { finalOutput, totalDurationMs } });
    return { finalOutput, trace, state, totalDurationMs };
  }

  private async runNode(
    node: WorkflowNode,
    userInput: string,
    state: Record<string, unknown>,
    previousResponseId?: string,
  ): Promise<NodeExecutionResult> {
    switch (node.type) {
      case 'agent':
        return executeAgentNode(node, userInput, state, previousResponseId, this.defaultModel, this.client, this.logger);
      case 'classify':
        return executeClassifyNode(node, userInput, state, previousResponseId, this.defaultModel, this.client, this.logger);
      case 'logic':
        return executeLogicNode(node, state);
      case 'transform':
        return executeTransformNode(node, state);
      case 'set_state':
        return executeSetStateNode(node, state);
      case 'user_interaction':
        return executeUserInteractionNode(node);
      case 'mcp':
        return executeMcpNode(node, state, this.logger);
      case 'tool':
      case 'guardrail':
      case 'file_search':
      case 'note':
        return makeSkippedTrace(node);
      default:
        return makeSkippedTrace(node);
    }
  }

  private buildGraph(definition: WorkflowDefinition): void {
    this.nodeMap.clear();
    this.edgesBySource.clear();
    for (const node of definition.nodes) {
      this.nodeMap.set(node.id, node);
    }
    for (const edge of definition.edges) {
      const existing = this.edgesBySource.get(edge.source) || [];
      existing.push(edge);
      this.edgesBySource.set(edge.source, existing);
    }
  }
}

function makeEndTrace(node: WorkflowNode, finalOutput: string): ExecutionTraceRecord {
  const now = new Date().toISOString();
  return {
    nodeId: node.id, nodeType: 'end', nodeName: node.label || 'End',
    input: '', output: finalOutput,
    startedAt: now, completedAt: now,
    status: 'completed', durationMs: 0,
  };
}
