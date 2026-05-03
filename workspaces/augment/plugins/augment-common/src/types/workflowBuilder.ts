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

// =============================================================================
// Workflow Builder Types
//
// These types define the serializable workflow definition format used by the
// visual agent builder canvas. A WorkflowDefinition is a directed graph of
// nodes (agents, tools, guardrails, logic, etc.) connected by typed edges.
// At runtime the backend hydrates this definition into live @openai/agents-core
// Agent / Runner instances for execution against LlamaStack APIs.
// =============================================================================

/**
 * Status of a workflow in its lifecycle.
 * @public
 */
export type WorkflowStatus = 'draft' | 'published' | 'archived';

/**
 * Discriminated node types available in the workflow canvas.
 * @public
 */
export type WorkflowNodeType =
  | 'start'
  | 'agent'
  | 'tool'
  | 'guardrail'
  | 'logic'
  | 'user_interaction'
  | 'classify'
  | 'end'
  | 'note'
  | 'transform'
  | 'set_state'
  | 'file_search'
  | 'mcp';

/**
 * Position on the canvas for visual layout.
 * @public
 */
export interface NodePosition {
  x: number;
  y: number;
}

// ---------------------------------------------------------------------------
// Node Data Payloads
// ---------------------------------------------------------------------------

/**
 * Data for the Start node -- defines the workflow's input contract.
 * @public
 */
export interface StartNodeData {
  inputDescription?: string;
  inputSchema?: Record<string, unknown>;
}

/**
 * Data for an Agent node -- carries the full agent configuration.
 * @public
 */
export interface AgentNodeData {
  agentKey: string;
  name: string;
  instructions: string;
  handoffDescription?: string;
  model?: string;
  mcpServers?: string[];
  enableRAG?: boolean;
  vectorStoreIds?: string[];
  enableWebSearch?: boolean;
  enableCodeInterpreter?: boolean;
  functions?: AgentFunctionDef[];
  toolChoice?: string;
  temperature?: number;
  maxOutputTokens?: number;
  maxToolCalls?: number;
  reasoning?: { effort?: string };
  guardrails?: string[];
  outputSchema?: Record<string, unknown>;
  toolUseBehavior?: string;
  resetToolChoice?: boolean;
  handoffInputFilter?: string;
  handoffInputSchema?: Record<string, unknown>;
  nestHandoffHistory?: boolean;
  truncation?: string;
  promptRef?: { id: string; version?: number; variables?: Record<string, string> };
  enabled?: boolean;
}

/**
 * A custom function definition attached to an agent.
 * @public
 */
export interface AgentFunctionDef {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

/**
 * Tool type discriminator for ToolNodeData.
 * @public
 */
export type ToolNodeKind =
  | 'mcp_server'
  | 'file_search'
  | 'web_search'
  | 'code_interpreter'
  | 'custom_function';

/**
 * Data for a Tool node -- references an external capability.
 * @public
 */
export interface ToolNodeData {
  kind: ToolNodeKind;
  label: string;
  mcpServerId?: string;
  mcpToolFilter?: string[];
  vectorStoreIds?: string[];
  functionDef?: AgentFunctionDef;
  requireApproval?: boolean;
}

/**
 * Data for a Guardrail node -- safety checks on input/output.
 * @public
 */
export interface GuardrailNodeData {
  guardType: 'input' | 'output';
  shieldIds?: string[];
  customRules?: GuardrailRule[];
  onFailure: 'block' | 'warn' | 'fallback';
  fallbackMessage?: string;
}

/**
 * A custom guardrail rule (regex, keyword, or LLM-graded).
 * @public
 */
export interface GuardrailRule {
  id: string;
  name: string;
  type: 'regex' | 'keyword_block' | 'llm_grader';
  pattern?: string;
  keywords?: string[];
  graderPrompt?: string;
}

/**
 * Logic node sub-type.
 * @public
 */
export type LogicNodeKind = 'if_else' | 'while_loop' | 'switch';

/**
 * Data for a Logic node -- conditional routing and loops.
 * @public
 */
export interface LogicNodeData {
  kind: LogicNodeKind;
  condition: string;
  cases?: Array<{ label: string; condition: string }>;
  maxIterations?: number;
}

/**
 * Data for a User Interaction node -- HITL approval gates and forms.
 * @public
 */
export interface UserInteractionNodeData {
  interactionType: 'approval_gate' | 'form_input' | 'confirmation';
  prompt: string;
  formFields?: UserInteractionField[];
  timeoutSeconds?: number;
  defaultAction?: 'approve' | 'reject' | 'skip';
}

/**
 * A field in a user interaction form.
 * @public
 */
export interface UserInteractionField {
  id: string;
  label: string;
  type: 'text' | 'select' | 'boolean' | 'number';
  required?: boolean;
  options?: string[];
  defaultValue?: string;
}

/**
 * Data for a Classify node -- routes to different branches based on LLM classification.
 * @public
 */
export interface ClassifyNodeData {
  classifications: Array<{ label: string; description: string }>;
  instructions?: string;
  model?: string;
}

/**
 * Data for an End node -- terminates the workflow execution.
 * @public
 */
export interface EndNodeData {
  outputExpression?: string;
}

/**
 * Data for a Note node -- annotation-only, no execution semantics.
 * @public
 */
export interface NoteNodeData {
  text: string;
}

/**
 * Data for a Transform node -- transforms data between steps using expressions.
 * @public
 */
export interface TransformNodeData {
  expression: string;
  outputVariable?: string;
}

/**
 * Data for a Set State node -- assigns values to workflow state variables.
 * @public
 */
export interface SetStateNodeData {
  assignments: Record<string, string>;
}

/**
 * Data for a File Search node -- configures vector store search.
 * @public
 */
export interface FileSearchNodeData {
  vectorStoreIds?: string[];
  maxResults?: number;
  scoreThreshold?: number;
}

/**
 * Data for an MCP node -- configures a Model Context Protocol server.
 * @public
 */
export interface McpNodeData {
  serverUrl: string;
  serverLabel: string;
  requireApproval?: 'always' | 'never' | 'auto';
  allowedTools?: string[];
  headers?: Record<string, string>;
}

/**
 * Union of all node data payloads, discriminated by the parent node's `type`.
 * @public
 */
export type WorkflowNodeData =
  | StartNodeData
  | AgentNodeData
  | ToolNodeData
  | GuardrailNodeData
  | LogicNodeData
  | UserInteractionNodeData
  | ClassifyNodeData
  | EndNodeData
  | NoteNodeData
  | TransformNodeData
  | SetStateNodeData
  | FileSearchNodeData
  | McpNodeData;

// ---------------------------------------------------------------------------
// Workflow Graph Structure
// ---------------------------------------------------------------------------

/**
 * A single node in the workflow graph.
 * @public
 */
export interface WorkflowNode {
  id: string;
  type: WorkflowNodeType;
  position: NodePosition;
  data: WorkflowNodeData;
  label?: string;
}

/**
 * Edge type determines the connection semantics.
 * @public
 */
export type WorkflowEdgeType =
  | 'handoff'
  | 'tool_binding'
  | 'guardrail_binding'
  | 'sequence'
  | 'conditional';

/**
 * A connection between two nodes in the workflow graph.
 * @public
 */
export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  type?: WorkflowEdgeType;
  label?: string;
  condition?: string;
}

// ---------------------------------------------------------------------------
// Workflow Settings and Metadata
// ---------------------------------------------------------------------------

/**
 * Global settings that apply to the entire workflow.
 * @public
 */
export interface WorkflowSettings {
  maxTurns?: number;
  defaultModel?: string;
  globalGuardrails?: string[];
  conversationPersistence?: boolean;
  tracingEnabled?: boolean;
  timeoutSeconds?: number;
}

/**
 * A published, immutable version snapshot of a workflow.
 * @public
 */
export interface WorkflowVersion {
  version: number;
  publishedAt: string;
  publishedBy: string;
  changelog?: string;
  definition: WorkflowDefinition;
}

/**
 * The complete workflow definition -- the top-level serializable artifact.
 *
 * This is persisted in the admin config store and exchanged between the
 * frontend canvas editor and the backend hydration engine.
 * @public
 */
export interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  version: number;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
  status: WorkflowStatus;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  settings: WorkflowSettings;
  tags?: string[];
}

// ---------------------------------------------------------------------------
// Workflow Execution Types
// ---------------------------------------------------------------------------

/**
 * Status of a workflow execution run.
 * @public
 */
export type WorkflowRunStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'interrupted'
  | 'cancelled';

/**
 * A record of a single node's execution within a run.
 * @public
 */
export interface NodeExecutionRecord {
  nodeId: string;
  nodeType: WorkflowNodeType;
  nodeName: string;
  startedAt: string;
  completedAt?: string;
  status: 'running' | 'completed' | 'failed' | 'skipped';
  input?: unknown;
  output?: unknown;
  error?: string;
  tokenUsage?: { inputTokens: number; outputTokens: number };
  durationMs?: number;
}

/**
 * A complete execution trace for a workflow run.
 * @public
 */
export interface WorkflowRunTrace {
  runId: string;
  workflowId: string;
  workflowVersion: number;
  status: WorkflowRunStatus;
  startedAt: string;
  completedAt?: string;
  nodeExecutions: NodeExecutionRecord[];
  totalTokenUsage?: { inputTokens: number; outputTokens: number };
  totalDurationMs?: number;
  error?: string;
}

// ---------------------------------------------------------------------------
// Evaluation Types
// ---------------------------------------------------------------------------

/**
 * A single test case for evaluating a workflow.
 * @public
 */
export interface WorkflowTestCase {
  id: string;
  name: string;
  input: string;
  expectedOutput?: string;
  expectedAgent?: string;
  criteria?: EvaluationCriterion[];
  tags?: string[];
}

/**
 * A criterion for grading a workflow run.
 * @public
 */
export interface EvaluationCriterion {
  id: string;
  name: string;
  type: 'exact_match' | 'contains' | 'regex' | 'llm_graded' | 'custom';
  weight: number;
  pattern?: string;
  graderPrompt?: string;
  scoringFunction?: string;
  threshold?: number;
}

/**
 * Result of evaluating a single test case.
 * @public
 */
export interface TestCaseResult {
  testCaseId: string;
  passed: boolean;
  score: number;
  actualOutput: string;
  actualAgent?: string;
  criterionResults: Array<{
    criterionId: string;
    passed: boolean;
    score: number;
    details?: string;
  }>;
  trace: WorkflowRunTrace;
  durationMs: number;
}

/**
 * Result of an evaluation run across multiple test cases.
 * @public
 */
export interface WorkflowEvaluationResult {
  evaluationId: string;
  workflowId: string;
  workflowVersion: number;
  ranAt: string;
  ranBy?: string;
  testCaseResults: TestCaseResult[];
  overallScore: number;
  passRate: number;
  totalDurationMs: number;
}

/**
 * A stored set of test cases for repeatable evaluation.
 * @public
 */
export interface WorkflowTestSuite {
  id: string;
  name: string;
  workflowId: string;
  testCases: WorkflowTestCase[];
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Creates a default empty workflow definition.
 */
export function createDefaultWorkflow(
  id: string,
  name: string,
  createdBy?: string,
): WorkflowDefinition {
  const now = new Date().toISOString();
  return {
    id,
    name,
    description: '',
    version: 0,
    createdAt: now,
    updatedAt: now,
    createdBy,
    updatedBy: createdBy,
    status: 'draft',
    nodes: [
      {
        id: 'start-1',
        type: 'start',
        position: { x: 50, y: 150 },
        data: { inputDescription: 'User message' } as StartNodeData,
        label: 'Start',
      },
      {
        id: 'agent-1',
        type: 'agent',
        position: { x: 300, y: 140 },
        data: {
          agentKey: 'agent-1',
          name: 'Agent',
          instructions: '',
          handoffDescription: '',
        } as AgentNodeData,
        label: 'Agent',
      },
    ],
    edges: [
      {
        id: 'edge-start-agent-1',
        source: 'start-1',
        target: 'agent-1',
        type: 'sequence',
      },
    ],
    settings: {
      maxTurns: 10,
      conversationPersistence: true,
      tracingEnabled: true,
    },
  };
}

/**
 * Type guard for AgentNodeData.
 */
export function isAgentNodeData(data: WorkflowNodeData): data is AgentNodeData {
  return 'agentKey' in data && 'instructions' in data;
}

/**
 * Type guard for ToolNodeData.
 */
export function isToolNodeData(data: WorkflowNodeData): data is ToolNodeData {
  return 'kind' in data && 'label' in data && !('agentKey' in data);
}

/**
 * Type guard for GuardrailNodeData.
 */
export function isGuardrailNodeData(data: WorkflowNodeData): data is GuardrailNodeData {
  return 'guardType' in data && 'onFailure' in data;
}

/**
 * Type guard for LogicNodeData.
 */
export function isLogicNodeData(data: WorkflowNodeData): data is LogicNodeData {
  return 'kind' in data && 'condition' in data && !('label' in data);
}

/**
 * Type guard for UserInteractionNodeData.
 */
export function isUserInteractionNodeData(
  data: WorkflowNodeData,
): data is UserInteractionNodeData {
  return 'interactionType' in data && 'prompt' in data;
}
