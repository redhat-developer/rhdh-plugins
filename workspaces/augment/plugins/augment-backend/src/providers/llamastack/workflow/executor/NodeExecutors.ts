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

import type { WorkflowNode } from '@red-hat-developer-hub/backstage-plugin-augment-common';
import type { NodeExecutionResult } from './types';
import { Parser } from 'expr-eval';

export { executeAgentNode, executeClassifyNode } from './llmNodeExecutors';

const exprParser = new Parser();

function normalizeJsExpression(expr: string): string {
  return expr
    .replace(/!==/g, '!=')
    .replace(/===/g, '==')
    .replace(/&&/g, ' and ')
    .replace(/\|\|/g, ' or ')
    .replace(/(?<!=)!(?!=)/g, ' not ')
    .trim();
}

export function executeLogicNode(
  node: WorkflowNode,
  state: Record<string, unknown>,
): NodeExecutionResult {
  const data = node.data as Record<string, unknown>;
  const condition = (data.condition as string) || 'true';
  const startMs = Date.now();

  let result: boolean;
  try {
    const parsed = exprParser.parse(normalizeJsExpression(condition));
    result = Boolean(parsed.evaluate(state as Record<string, number | string>));
  } catch {
    result = false;
  }

  return {
    output: result,
    trace: {
      nodeId: node.id,
      nodeType: 'logic',
      nodeName: node.label || 'If/Else',
      input: condition,
      output: String(result),
      parsedOutput: result,
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      status: 'completed',
      durationMs: Date.now() - startMs,
    },
  };
}

export function executeTransformNode(
  node: WorkflowNode,
  state: Record<string, unknown>,
): NodeExecutionResult {
  const data = node.data as Record<string, unknown>;
  const expression = (data.expression as string) || '';
  const outputVariable = (data.outputVariable as string) || '_transformed';
  const startMs = Date.now();

  let result: unknown;
  try {
    const parsed = exprParser.parse(normalizeJsExpression(expression));
    result = parsed.evaluate(state as Record<string, number | string>);
  } catch {
    result = expression;
  }

  state[outputVariable] = result;

  return {
    output: result,
    trace: {
      nodeId: node.id,
      nodeType: 'transform',
      nodeName: node.label || 'Transform',
      input: expression,
      output: String(result),
      parsedOutput: result,
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      status: 'completed',
      durationMs: Date.now() - startMs,
    },
  };
}

export function executeSetStateNode(
  node: WorkflowNode,
  state: Record<string, unknown>,
): NodeExecutionResult {
  const data = node.data as Record<string, unknown>;
  const assignments = (data.assignments as Record<string, string>) || {};
  const startMs = Date.now();

  for (const [key, expr] of Object.entries(assignments)) {
    try {
      const parsed = exprParser.parse(normalizeJsExpression(expr));
      state[key] = parsed.evaluate(state as Record<string, number | string>);
    } catch {
      state[key] = expr;
    }
  }

  return {
    output: assignments,
    trace: {
      nodeId: node.id,
      nodeType: 'set_state',
      nodeName: node.label || 'Set State',
      input: JSON.stringify(assignments),
      output: JSON.stringify(assignments),
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      status: 'completed',
      durationMs: Date.now() - startMs,
    },
  };
}

export function executeUserInteractionNode(
  node: WorkflowNode,
): NodeExecutionResult {
  const data = node.data as Record<string, unknown>;
  const prompt = (data.prompt as string) || 'Awaiting approval';

  return {
    output: { approved: true, prompt },
    trace: {
      nodeId: node.id,
      nodeType: 'user_interaction',
      nodeName: node.label || 'Approval',
      input: prompt,
      output: 'Auto-approved (preview mode)',
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      status: 'completed',
      durationMs: 0,
    },
  };
}

export function makeSkippedTrace(node: WorkflowNode): NodeExecutionResult {
  return {
    output: undefined,
    trace: {
      nodeId: node.id,
      nodeType: node.type,
      nodeName: node.label || node.id,
      input: '',
      output: '',
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      status: 'skipped',
      durationMs: 0,
    },
  };
}
