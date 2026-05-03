import type { WorkflowDefinition, WorkflowNode } from '@red-hat-developer-hub/backstage-plugin-augment-common';
import { DEFAULT_MODEL, toCamelCase, getAgentNodes, getOutgoingEdges } from './utils';

interface PythonCodeGenOptions {
  llamaStackUrl?: string;
  defaultModel?: string;
}

function pyVarName(s: string): string {
  return toCamelCase(s).replace(/[^a-zA-Z0-9_]/g, '_');
}

function pyStr(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function generateAgentPy(node: WorkflowNode, defaultModel: string): string {
  const d = node.data as Record<string, unknown>;
  const name = (d.name as string) || (d.agentKey as string) || node.id;
  const varName = pyVarName(name);
  const model = (d.model as string) || defaultModel;
  const instructions = (d.instructions as string) || 'You are a helpful assistant.';

  let code = `${varName} = Agent(\n`;
  code += `    name="${pyStr(name)}",\n`;
  code += `    instructions="${pyStr(instructions)}",\n`;
  code += `    model="${model}",\n`;

  const temp = d.temperature as number | undefined;
  const maxTokens = d.maxOutputTokens as number | undefined;
  const reasoning = d.reasoningEffort as string | undefined;
  if (temp !== undefined || maxTokens !== undefined || reasoning) {
    code += `    model_settings=ModelSettings(\n`;
    if (reasoning) code += `        reasoning=ReasoningEffort(effort="${reasoning}"),\n`;
    if (temp !== undefined) code += `        temperature=${temp},\n`;
    if (maxTokens !== undefined) code += `        max_tokens=${maxTokens},\n`;
    code += `    ),\n`;
  }
  code += `)\n`;
  return code;
}

export function generatePythonCode(
  workflow: WorkflowDefinition,
  options?: PythonCodeGenOptions,
): string {
  const model = options?.defaultModel || DEFAULT_MODEL;
  const baseUrl = options?.llamaStackUrl || 'http://localhost:8321/v1';
  const agents = getAgentNodes(workflow.nodes);

  const lines: string[] = [];
  lines.push(`import os`);
  lines.push(`from openai import AsyncOpenAI`);
  lines.push(`from agents import Agent, Runner, ModelSettings, trace`);
  lines.push(``);
  lines.push(`# Configure LlamaStack endpoint`);
  lines.push(`client = AsyncOpenAI(`);
  lines.push(`    base_url="${baseUrl}",`);
  lines.push(`    api_key=os.environ.get("OPENAI_API_KEY", "no-key"),`);
  lines.push(`)`);
  lines.push(``);

  for (const agent of agents) {
    lines.push(generateAgentPy(agent, model));
    lines.push(``);
  }

  const classifyNodes = workflow.nodes.filter(n => n.type === 'classify');
  for (const cn of classifyNodes) {
    const d = cn.data as Record<string, unknown>;
    const classifications = (d.classifications as Array<{ label: string }>) || [];
    const varName = pyVarName((d.label as string) || cn.id);
    lines.push(`# Classify node: ${varName}`);
    lines.push(`${varName}_labels = [${classifications.map(c => `"${pyStr(c.label)}"`).join(', ')}]`);
    lines.push(``);
  }

  lines.push(`async def run_workflow(input_text: str) -> str:`);
  lines.push(`    with trace("${pyStr(workflow.name)}"):`);
  lines.push(`        conversation_history = [`);
  lines.push(`            {"role": "user", "content": [{"type": "input_text", "text": input_text}]}`);
  lines.push(`        ]`);
  lines.push(`        runner = Runner()`);
  lines.push(``);

  if (agents.length > 0) {
    const firstAgent = agents[0];
    const d = firstAgent.data as Record<string, unknown>;
    const agentVar = pyVarName((d.name as string) || (d.agentKey as string) || firstAgent.id);
    lines.push(`        result = await runner.run(${agentVar}, conversation_history)`);
    lines.push(``);

    const outEdges = getOutgoingEdges(firstAgent.id, workflow.edges);
    if (outEdges.length > 0) {
      lines.push(`        conversation_history.extend(`);
      lines.push(`            [item.raw_item for item in result.new_items]`);
      lines.push(`        )`);
    }

    for (let i = 1; i < agents.length; i++) {
      const a = agents[i];
      const ad = a.data as Record<string, unknown>;
      const av = pyVarName((ad.name as string) || (ad.agentKey as string) || a.id);
      lines.push(``);
      lines.push(`        result = await runner.run(${av}, conversation_history)`);
      lines.push(`        conversation_history.extend(`);
      lines.push(`            [item.raw_item for item in result.new_items]`);
      lines.push(`        )`);
    }
  }

  lines.push(``);
  lines.push(`        return result.final_output if result.final_output else ""`);
  lines.push(``);
  lines.push(``);
  lines.push(`if __name__ == "__main__":`);
  lines.push(`    import asyncio`);
  lines.push(`    user_input = input("Enter message: ")`);
  lines.push(`    output = asyncio.run(run_workflow(user_input))`);
  lines.push(`    print(output)`);

  return lines.join('\n');
}
