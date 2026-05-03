import type { WorkflowNode } from '@red-hat-developer-hub/backstage-plugin-augment-common';
import { toVarName, escapeStr } from './utils';

export function generateClassifyDeclaration(node: WorkflowNode, defaultModel: string): string {
  const d = node.data as Record<string, unknown>;
  const varName = toVarName(node.id);
  const classifications = (d.classifications as Array<{ label: string; description: string }>) || [];
  const model = (d.model as string) || defaultModel;

  const enumValues = classifications.map(c => `"${c.label}"`).join(', ');
  const classDescriptions = classifications.map(c => `- "${c.label}": ${c.description}`).join('\\n');
  const classifyInstructions = d.instructions
    ? escapeStr(d.instructions as string)
    : `Classify the input into one of these categories:\\n${classDescriptions}`;

  const lines: string[] = [];
  lines.push(`// Classify node: uses text.format.json_schema (LlamaStack-compatible)`);
  lines.push(`const ${varName}Config = {`);
  lines.push(`  name: "${node.label || 'Classify'}",`);
  lines.push(`  model: "${model}",`);
  lines.push(`  instructions: \`${classifyInstructions}\`,`);
  lines.push(`  enumValues: [${enumValues}] as const,`);
  lines.push(`};`);
  lines.push('');
  lines.push(`async function run_${varName}(input: string): Promise<{ classification: string }> {`);
  lines.push(`  const response = await client.responses.create({`);
  lines.push(`    model: ${varName}Config.model,`);
  lines.push(`    input,`);
  lines.push(`    instructions: ${varName}Config.instructions,`);
  lines.push(`    text: {`);
  lines.push(`      format: {`);
  lines.push(`        type: "json_schema",`);
  lines.push(`        name: "classification",`);
  lines.push(`        schema: {`);
  lines.push(`          type: "object",`);
  lines.push(`          properties: {`);
  lines.push(`            classification: { type: "string", enum: ${varName}Config.enumValues }`);
  lines.push(`          },`);
  lines.push(`          required: ["classification"]`);
  lines.push(`        }`);
  lines.push(`      }`);
  lines.push(`    },`);
  lines.push(`    store: true,`);
  lines.push(`  });`);
  lines.push(`  const text = response.output_text;`);
  lines.push(`  return JSON.parse(text);`);
  lines.push(`}`);
  return lines.join('\n');
}
