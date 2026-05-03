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
  WorkflowDefinition,
  AgentNodeData,
  StartNodeData,
  ClassifyNodeData,
  LogicNodeData,
  McpNodeData,
  TransformNodeData,
  SetStateNodeData,
  EndNodeData,
} from '../types/workflowBuilder';

function template(
  id: string,
  name: string,
  description: string,
  nodes: WorkflowDefinition['nodes'],
  edges: WorkflowDefinition['edges'],
): WorkflowDefinition {
  const now = new Date().toISOString();
  return {
    id,
    name,
    description,
    version: 0,
    createdAt: now,
    updatedAt: now,
    status: 'draft',
    nodes,
    edges,
    settings: { maxTurns: 10, conversationPersistence: true, tracingEnabled: true },
  };
}

export const WORKFLOW_TEMPLATES: WorkflowDefinition[] = [
  // 1. Simple Q&A Agent — the simplest working workflow
  template(
    'tpl-simple-qa',
    'Simple Q&A Agent',
    'A basic single-agent workflow that answers questions. The simplest starting point for any new agent.',
    [
      { id: 'start_1', type: 'start', position: { x: 50, y: 200 }, data: { inputDescription: 'User question' } as StartNodeData, label: 'Start' },
      { id: 'agent_1', type: 'agent', position: { x: 300, y: 200 }, data: { name: 'Assistant', instructions: 'You are a helpful, knowledgeable assistant. Answer the user\'s question clearly and concisely. Use markdown formatting when it helps readability (bullet points, bold, code blocks).' } as AgentNodeData, label: 'Assistant' },
      { id: 'end_1', type: 'end', position: { x: 560, y: 200 }, data: {} as EndNodeData, label: 'End' },
    ],
    [
      { id: 'e1', source: 'start_1', target: 'agent_1', type: 'sequence' },
      { id: 'e2', source: 'agent_1', target: 'end_1', type: 'sequence' },
    ],
  ),

  // 2. Smart Router — classification + if/else branching
  template(
    'tpl-smart-router',
    'Smart Router',
    'Classifies user input as technical or general, then routes to the appropriate specialist agent using if/else logic.',
    [
      { id: 'start_1', type: 'start', position: { x: 50, y: 250 }, data: { inputDescription: 'User message' } as StartNodeData, label: 'Start' },
      { id: 'classify_1', type: 'classify', position: { x: 270, y: 250 }, data: { classifications: [{ label: 'technical', description: 'Programming, code, APIs, servers, debugging, or technology questions' }, { label: 'general', description: 'General conversation, greetings, or non-technical questions' }], instructions: 'Classify the user input. Choose "technical" if it asks about programming, code, APIs, servers, debugging, or technology. Choose "general" for everything else.' } as ClassifyNodeData, label: 'Topic Classifier' },
      { id: 'logic_1', type: 'logic', position: { x: 520, y: 250 }, data: { kind: 'if_else', condition: "classify_1_output && classify_1_output.classification === 'technical'" } as LogicNodeData, label: 'Is Technical?' },
      { id: 'agent_tech', type: 'agent', position: { x: 780, y: 130 }, data: { name: 'Tech Expert', instructions: 'You are a senior software engineer. Give concise, technically accurate answers about programming, APIs, DevOps, and technology. Use code examples when helpful. Keep responses brief but precise.' } as AgentNodeData, label: 'Tech Expert' },
      { id: 'agent_general', type: 'agent', position: { x: 780, y: 370 }, data: { name: 'Friendly Assistant', instructions: 'You are a warm, friendly assistant. Answer general questions in a conversational, approachable tone. Be helpful and brief.' } as AgentNodeData, label: 'Friendly Assistant' },
      { id: 'end_1', type: 'end', position: { x: 1040, y: 250 }, data: {} as EndNodeData, label: 'End' },
    ],
    [
      { id: 'e1', source: 'start_1', target: 'classify_1', type: 'sequence' },
      { id: 'e2', source: 'classify_1', target: 'logic_1', type: 'sequence' },
      { id: 'e3', source: 'logic_1', target: 'agent_tech', type: 'sequence', label: 'true' },
      { id: 'e4', source: 'logic_1', target: 'agent_general', type: 'sequence', label: 'false' },
      { id: 'e5', source: 'agent_tech', target: 'end_1', type: 'sequence' },
      { id: 'e6', source: 'agent_general', target: 'end_1', type: 'sequence' },
    ],
  ),

  // 3. Research & Summarize — multi-agent chaining
  template(
    'tpl-research-summarize',
    'Research & Summarize',
    'A two-agent pipeline: the first agent researches a topic in depth, then a second agent distills the findings into a concise summary.',
    [
      { id: 'start_1', type: 'start', position: { x: 50, y: 200 }, data: { inputDescription: 'Research topic or question' } as StartNodeData, label: 'Start' },
      { id: 'agent_research', type: 'agent', position: { x: 300, y: 200 }, data: { name: 'Researcher', instructions: 'You are a thorough research analyst. Given a topic, provide a comprehensive analysis covering key facts, different perspectives, recent developments, and supporting details. Be detailed and well-organized. Use headers and bullet points.' } as AgentNodeData, label: 'Researcher' },
      { id: 'agent_summarize', type: 'agent', position: { x: 580, y: 200 }, data: { name: 'Summarizer', instructions: 'You are an expert editor and summarizer. Take the detailed research provided and distill it into a clear, concise executive summary (3-5 key bullet points). Highlight only the most important takeaways. End with a one-sentence conclusion.' } as AgentNodeData, label: 'Summarizer' },
      { id: 'end_1', type: 'end', position: { x: 840, y: 200 }, data: {} as EndNodeData, label: 'End' },
    ],
    [
      { id: 'e1', source: 'start_1', target: 'agent_research', type: 'sequence' },
      { id: 'e2', source: 'agent_research', target: 'agent_summarize', type: 'sequence' },
      { id: 'e3', source: 'agent_summarize', target: 'end_1', type: 'sequence' },
    ],
  ),

  // 4. Kubernetes Assistant — MCP tool integration
  template(
    'tpl-k8s-assistant',
    'Kubernetes Assistant',
    'Connects to a Kubernetes MCP server for live cluster operations — list pods, namespaces, deployments, and more.',
    [
      { id: 'start_1', type: 'start', position: { x: 50, y: 200 }, data: { inputDescription: 'Kubernetes question or command' } as StartNodeData, label: 'Start' },
      { id: 'mcp_1', type: 'mcp', position: { x: 300, y: 200 }, data: { serverUrl: 'https://kubernetes-mcp-server-ocp-mcp-server.apps.ocp.v7hjl.sandbox2288.opentlc.com', serverLabel: 'k8s', requireApproval: 'never' } as McpNodeData, label: 'K8s MCP Server' },
      { id: 'agent_1', type: 'agent', position: { x: 580, y: 200 }, data: { name: 'K8s Assistant', instructions: 'You are a Kubernetes expert assistant with access to a live cluster. Use the available MCP tools to query the cluster and answer the user\'s question. Format output clearly using markdown tables or lists. Always show the namespace and resource name.' } as AgentNodeData, label: 'K8s Assistant' },
      { id: 'end_1', type: 'end', position: { x: 840, y: 200 }, data: {} as EndNodeData, label: 'End' },
    ],
    [
      { id: 'e1', source: 'start_1', target: 'mcp_1', type: 'sequence' },
      { id: 'e2', source: 'mcp_1', target: 'agent_1', type: 'sequence' },
      { id: 'e3', source: 'agent_1', target: 'end_1', type: 'sequence' },
    ],
  ),

  // 5. Content Moderator — set_state + transform + agent pipeline
  template(
    'tpl-content-moderator',
    'Content Moderator',
    'Demonstrates data flow: sets metadata via state, transforms it into context, then an agent uses that context to moderate content.',
    [
      { id: 'start_1', type: 'start', position: { x: 50, y: 200 }, data: { inputDescription: 'Content to moderate' } as StartNodeData, label: 'Start' },
      { id: 'set_state_1', type: 'set_state', position: { x: 280, y: 200 }, data: { assignments: { content_type: "'user_generated'", platform: "'public_forum'", policy_version: "'v2.1'" } } as SetStateNodeData, label: 'Set Metadata' },
      { id: 'transform_1', type: 'transform', position: { x: 520, y: 200 }, data: { expression: "`Content type: ${content_type}, Platform: ${platform}, Policy: ${policy_version}`", outputVariable: 'moderation_context' } as TransformNodeData, label: 'Build Context' },
      { id: 'agent_1', type: 'agent', position: { x: 780, y: 200 }, data: { name: 'Moderator', instructions: 'You are a content moderation specialist. Review the user-submitted content for policy violations. Consider the moderation context (content type, platform, policy version). Respond with:\n1. **Verdict**: APPROVE or FLAG\n2. **Reason**: Brief explanation\n3. **Category**: If flagged, specify (spam, hate speech, harassment, misinformation, other)\n4. **Confidence**: High / Medium / Low' } as AgentNodeData, label: 'Moderator' },
      { id: 'end_1', type: 'end', position: { x: 1040, y: 200 }, data: {} as EndNodeData, label: 'End' },
    ],
    [
      { id: 'e1', source: 'start_1', target: 'set_state_1', type: 'sequence' },
      { id: 'e2', source: 'set_state_1', target: 'transform_1', type: 'sequence' },
      { id: 'e3', source: 'transform_1', target: 'agent_1', type: 'sequence' },
      { id: 'e4', source: 'agent_1', target: 'end_1', type: 'sequence' },
    ],
  ),
];
