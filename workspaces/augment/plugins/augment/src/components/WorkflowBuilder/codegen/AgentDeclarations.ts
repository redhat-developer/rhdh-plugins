import type { WorkflowNode } from '@red-hat-developer-hub/backstage-plugin-augment-common';
import { toVarName, escapeStr } from './utils';

export function generateAgentDeclaration(node: WorkflowNode, defaultModel: string): string {
  const d = node.data as Record<string, unknown>;
  const varName = toVarName(node.id);
  const name = (d.name as string) || node.label || 'Agent';
  const instructions = (d.instructions as string) || '';
  const model = (d.model as string) || defaultModel;
  const outputSchema = d.outputSchema as Record<string, unknown> | undefined;

  const lines: string[] = [];

  if (outputSchema) {
    lines.push(`const ${varName}Schema = z.object(${JSON.stringify(outputSchema, null, 2)});`);
    lines.push('');
  }

  lines.push(`const ${varName} = new Agent({`);
  lines.push(`  name: "${name}",`);
  lines.push(`  instructions: \`${escapeStr(instructions)}\`,`);
  lines.push(`  model: "${model}",`);

  if (outputSchema) {
    lines.push(`  outputType: ${varName}Schema,`);
  }

  const temp = d.temperature as number | undefined;
  const maxTokens = d.maxOutputTokens as number | undefined;
  if (temp !== undefined || maxTokens !== undefined) {
    lines.push(`  modelSettings: {`);
    if (temp !== undefined) lines.push(`    temperature: ${temp},`);
    if (maxTokens !== undefined) lines.push(`    maxTokens: ${maxTokens},`);
    lines.push(`    store: true`);
    lines.push(`  },`);
  }

  lines.push(`});`);
  return lines.join('\n');
}
