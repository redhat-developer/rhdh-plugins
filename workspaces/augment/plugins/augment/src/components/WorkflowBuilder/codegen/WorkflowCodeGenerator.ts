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

import type { WorkflowDefinition } from '@red-hat-developer-hub/backstage-plugin-augment-common';
import { DEFAULT_MODEL, getAgentNodes } from './utils';
import { generateAgentDeclaration } from './AgentDeclarations';
import { generateClassifyDeclaration } from './ClassifyDeclarations';
import { generateRunnerExecution } from './ExecutionEmitter';

export interface CodeGenOptions {
  llamaStackUrl?: string;
  defaultModel?: string;
}

export function generateWorkflowCode(
  workflow: WorkflowDefinition,
  options?: CodeGenOptions,
): string {
  const llamaStackUrl = options?.llamaStackUrl || 'http://localhost:8321/v1';
  const defaultModel = options?.defaultModel || DEFAULT_MODEL;

  const agentNodes = getAgentNodes(workflow.nodes);
  const classifyNodes = workflow.nodes.filter(n => n.type === 'classify');
  const hasOutputSchema = agentNodes.some(n => (n.data as Record<string, unknown>).outputSchema != null);
  const hasUserInteraction = workflow.nodes.some(n => n.type === 'user_interaction');
  const hasSetState = workflow.nodes.some(n => n.type === 'set_state');

  const imports: string[] = [];
  imports.push(`import { OpenAI } from "openai";`);
  if (hasOutputSchema) imports.push(`import { z } from "zod";`);
  imports.push(`import {`);
  imports.push(`  Agent,`);
  imports.push(`  Runner,`);
  imports.push(`  setDefaultOpenAIClient,`);
  imports.push(`  setOpenAIAPI,`);
  imports.push(`  withTrace,`);
  imports.push(`  type AgentInputItem,`);
  imports.push(`} from "@openai/agents";`);

  const agentDeclarations = agentNodes.map(n => generateAgentDeclaration(n, defaultModel)).join('\n\n');
  const classifyDeclarations = classifyNodes.map(n => generateClassifyDeclaration(n, defaultModel)).join('\n\n');
  const execution = generateRunnerExecution(workflow.nodes, workflow.edges);

  let approvalHelper = '';
  if (hasUserInteraction) {
    approvalHelper = `
/**
 * Request human approval. Replace this with your actual approval mechanism.
 */
async function requestApproval(message: string): Promise<boolean> {
  console.log("[APPROVAL REQUIRED]", message);
  return true; // Auto-approve in generated code; wire to your UI
}
`;
  }

  const stateDecl = hasSetState ? `\n    const state: Record<string, unknown> = {};\n` : '';

  return `${imports.join('\n')}

// ============================================================================
// Generated from workflow: ${workflow.name}
// ID: ${workflow.id} | Version: ${workflow.version}
//
// This code is runnable standalone against a LlamaStack-compatible endpoint.
// Install deps: npm install openai @openai/agents zod
// Run: npx ts-node ${workflow.id}.ts
// ============================================================================

// --- LlamaStack Connection Setup ---
const client = new OpenAI({
  baseURL: "${llamaStackUrl}",
  apiKey: process.env.LLAMA_STACK_API_KEY || "not-needed",
});
setDefaultOpenAIClient(client);
setOpenAIAPI("responses");

// --- Agent Definitions ---

${agentDeclarations}

${classifyDeclarations}
${approvalHelper}
// --- Workflow Execution ---

type WorkflowInput = { input_as_text: string };

export const runWorkflow = async (input: WorkflowInput) => {
  return await withTrace("${workflow.name}", async () => {${stateDecl}
    const conversationHistory: AgentInputItem[] = [
      { role: "user", content: [{ type: "input_text", text: input.input_as_text }] }
    ];

    const runner = new Runner({
      traceMetadata: { __trace_source__: "agent-builder" }
    });

${execution}
  });
};

// --- Entry Point ---
if (require.main === module) {
  const userInput = process.argv[2] || "Hello, I need help.";
  console.log("Running workflow: ${workflow.name}");
  console.log("Input:", userInput);
  runWorkflow({ input_as_text: userInput })
    .then(() => console.log("\\nWorkflow completed successfully."))
    .catch((err) => console.error("Workflow failed:", err));
}
`.trim();
}
