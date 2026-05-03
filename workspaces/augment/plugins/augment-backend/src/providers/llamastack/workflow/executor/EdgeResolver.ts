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

import type {
  WorkflowNode,
  WorkflowEdge,
} from '@red-hat-developer-hub/backstage-plugin-augment-common';
import type { ExecutionTraceRecord } from './types';

/**
 * Resolves the next node in the workflow graph based on the current
 * node type and execution result.
 *
 * Uses explicit edge labels for branching:
 * - Logic nodes: edges labeled "true" / "false"
 * - Classify nodes: edges with `condition` matching classification output
 * - All others: first non-binding sequence edge
 */
export function resolveNextNode(
  node: WorkflowNode,
  result: { output: unknown; trace: ExecutionTraceRecord },
  outEdges: WorkflowEdge[],
): string | null {
  if (node.type === 'classify') {
    return resolveClassifyBranch(result, outEdges);
  }

  if (node.type === 'logic') {
    return resolveLogicBranch(result, outEdges);
  }

  const sequenceEdges = outEdges.filter(
    e => e.type !== 'tool_binding' && e.type !== 'guardrail_binding',
  );
  return sequenceEdges[0]?.target ?? null;
}

function resolveClassifyBranch(
  result: { output: unknown },
  outEdges: WorkflowEdge[],
): string | null {
  const parsed = result.output as { classification?: string } | null;
  const classification = parsed?.classification?.toLowerCase().trim();

  if (classification) {
    const matchingEdge = outEdges.find(e => {
      const cond = (e.condition || e.label || '').toLowerCase().trim();
      return cond === classification;
    });
    if (matchingEdge) return matchingEdge.target;
  }

  const defaultEdge = outEdges.find(e => !e.condition && !e.label) || outEdges[0];
  return defaultEdge?.target ?? null;
}

function resolveLogicBranch(
  result: { output: unknown },
  outEdges: WorkflowEdge[],
): string | null {
  const conditionResult = Boolean(result.output);
  const trueEdge = outEdges.find(e => e.label === 'true');
  const falseEdge = outEdges.find(e => e.label === 'false');

  if (conditionResult) {
    return trueEdge?.target ?? outEdges[0]?.target ?? null;
  }
  return falseEdge?.target ?? outEdges[1]?.target ?? null;
}

export function getFirstSequenceTarget(
  outEdges: WorkflowEdge[],
): string | null {
  return outEdges[0]?.target ?? null;
}
