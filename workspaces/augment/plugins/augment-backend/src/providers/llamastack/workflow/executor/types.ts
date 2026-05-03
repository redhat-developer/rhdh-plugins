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

export interface ExecutionTraceRecord {
  nodeId: string;
  nodeType: string;
  nodeName: string;
  model?: string;
  input: string;
  output: string;
  parsedOutput?: unknown;
  responseId?: string;
  startedAt: string;
  completedAt: string;
  status: 'completed' | 'failed' | 'skipped';
  error?: string;
  durationMs: number;
}

export interface WorkflowExecutionResult {
  finalOutput: string;
  trace: ExecutionTraceRecord[];
  state: Record<string, unknown>;
  totalDurationMs: number;
}

export interface NodeExecutionResult {
  output: unknown;
  trace: ExecutionTraceRecord;
}

export interface ResponsesApiResponse {
  id: string;
  status: string;
  output: Array<{
    type: string;
    content?: Array<{ type: string; text: string }>;
    role?: string;
    call_id?: string;
    name?: string;
    arguments?: string;
  }>;
  usage?: { input_tokens: number; output_tokens: number; total_tokens: number };
}

export interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  serverUrl: string;
}

export interface StreamEventEmitter {
  (event: { type: string; data: unknown }): void;
}
