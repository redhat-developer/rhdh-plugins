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
  WorkflowEdge,
  WorkflowNode,
} from '@red-hat-developer-hub/backstage-plugin-augment-common';

export const DEFAULT_MODEL = 'gemini/models/gemini-2.5-flash';

export function toVarName(id: string): string {
  return id.replace(/[^a-zA-Z0-9_]/g, '_').replace(/^(\d)/, '_$1');
}

export function toCamelCase(s: string): string {
  return s
    .replace(/[^a-zA-Z0-9 ]/g, '')
    .split(' ')
    .map((w, i) =>
      i === 0
        ? w.toLowerCase()
        : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase(),
    )
    .join('');
}

export function escapeStr(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$');
}

export function getOutgoingEdges(
  nodeId: string,
  edges: WorkflowEdge[],
): WorkflowEdge[] {
  return edges.filter(e => e.source === nodeId);
}

export function getAgentNodes(nodes: WorkflowNode[]): WorkflowNode[] {
  return nodes.filter(n => n.type === 'agent');
}
