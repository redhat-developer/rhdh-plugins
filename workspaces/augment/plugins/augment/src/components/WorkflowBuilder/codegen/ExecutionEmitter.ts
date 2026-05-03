import type { WorkflowNode, WorkflowEdge } from '@red-hat-developer-hub/backstage-plugin-augment-common';
import { toVarName, toCamelCase, escapeStr, getOutgoingEdges } from './utils';

/**
 * DFS graph traversal that emits TypeScript code for the workflow execution.
 */
export function generateRunnerExecution(
  nodes: WorkflowNode[],
  edges: WorkflowEdge[],
): string {
  const startNode = nodes.find(n => n.type === 'start');
  if (!startNode) return '    // No start node found';

  const visited = new Set<string>();
  const lines: string[] = [];

  function visit(nodeId: string, indent: string) {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);

    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    const outEdges = getOutgoingEdges(nodeId, edges);

    if (node.type === 'start') {
      for (const edge of outEdges) visit(edge.target, indent);
      return;
    }

    if (node.type === 'agent') {
      emitAgentCode(node, outEdges, lines, indent, visit);
      return;
    }

    if (node.type === 'classify') {
      emitClassifyCode(node, outEdges, lines, indent, visit);
      return;
    }

    if (node.type === 'logic') {
      emitLogicCode(node, outEdges, lines, indent, visit);
      return;
    }

    if (node.type === 'user_interaction') {
      const d = node.data as Record<string, unknown>;
      const prompt = (d.prompt as string) || 'Please confirm.';
      lines.push(`${indent}// Human approval gate`);
      lines.push(`${indent}const _approved = await requestApproval(\`${escapeStr(prompt)}\`);`);
      lines.push(`${indent}if (!_approved) {`);
      lines.push(`${indent}  throw new Error("User rejected the action");`);
      lines.push(`${indent}}`);
      lines.push('');
      for (const edge of outEdges) visit(edge.target, indent);
      return;
    }

    if (node.type === 'transform') {
      const d = node.data as Record<string, unknown>;
      const expr = (d.expression as string) || '// transform expression';
      const outputVar = (d.outputVariable as string) || '_transformed';
      lines.push(`${indent}const ${outputVar} = ${expr};`);
      lines.push('');
      for (const edge of outEdges) visit(edge.target, indent);
      return;
    }

    if (node.type === 'set_state') {
      const d = node.data as Record<string, unknown>;
      const assignments = (d.assignments as Record<string, string>) || {};
      for (const [key, value] of Object.entries(assignments)) {
        lines.push(`${indent}state.${key} = ${value};`);
      }
      lines.push('');
      for (const edge of outEdges) visit(edge.target, indent);
      return;
    }

    if (node.type === 'end') {
      lines.push(`${indent}// Workflow complete`);
      lines.push(`${indent}return;`);
      return;
    }

    for (const edge of outEdges) visit(edge.target, indent);
  }

  visit(startNode.id, '    ');
  return lines.join('\n');
}

function emitAgentCode(
  node: WorkflowNode,
  outEdges: WorkflowEdge[],
  lines: string[],
  indent: string,
  visit: (id: string, indent: string) => void,
) {
  const varName = toVarName(node.id);
  const d = node.data as Record<string, unknown>;
  const agentName = (d.name as string) || node.id;
  const resultVar = `${toCamelCase(agentName)}Result`;
  const hasOutput = d.outputSchema != null;

  lines.push(`${indent}const ${resultVar}Temp = await runner.run(`);
  lines.push(`${indent}  ${varName},`);
  lines.push(`${indent}  [...conversationHistory]`);
  lines.push(`${indent});`);
  lines.push(`${indent}conversationHistory.push(...${resultVar}Temp.newItems.map((item) => item.rawItem));`);
  lines.push('');
  lines.push(`${indent}if (!${resultVar}Temp.finalOutput) {`);
  lines.push(`${indent}  throw new Error("Agent '${agentName}' returned no output");`);
  lines.push(`${indent}}`);
  lines.push('');

  if (hasOutput) {
    lines.push(`${indent}const ${resultVar} = {`);
    lines.push(`${indent}  output_text: JSON.stringify(${resultVar}Temp.finalOutput),`);
    lines.push(`${indent}  output_parsed: ${resultVar}Temp.finalOutput`);
    lines.push(`${indent}};`);
  } else {
    lines.push(`${indent}const ${resultVar} = {`);
    lines.push(`${indent}  output_text: ${resultVar}Temp.finalOutput ?? ""`);
    lines.push(`${indent}};`);
  }
  lines.push('');

  for (const edge of outEdges) visit(edge.target, indent);
}

function emitClassifyCode(
  node: WorkflowNode,
  outEdges: WorkflowEdge[],
  lines: string[],
  indent: string,
  visit: (id: string, indent: string) => void,
) {
  const varName = toVarName(node.id);
  const resultVar = `${varName}Result`;

  lines.push(`${indent}// Classify via direct /v1/responses call with json_schema format`);
  lines.push(`${indent}const ${resultVar}_input = conversationHistory.map(m => {`);
  lines.push(`${indent}  if (typeof m === 'string') return m;`);
  lines.push(`${indent}  if ('content' in m && Array.isArray(m.content)) {`);
  lines.push(`${indent}    return m.content.map((c: any) => c.text || '').join('');`);
  lines.push(`${indent}  }`);
  lines.push(`${indent}  return String(m);`);
  lines.push(`${indent}}).join('\\n');`);
  lines.push(`${indent}const ${resultVar} = await run_${varName}(${resultVar}_input);`);
  lines.push('');

  if (outEdges.length > 0) {
    const conditionalEdges = outEdges.filter(e => e.condition);
    const fallbackEdge = outEdges.find(e => !e.condition);

    if (conditionalEdges.length > 0) {
      conditionalEdges.forEach((edge, i) => {
        const prefix = i === 0 ? 'if' : '} else if';
        lines.push(`${indent}${prefix} (${resultVar}.classification === "${edge.condition}") {`);
        visit(edge.target, indent + '  ');
      });
      if (fallbackEdge) {
        lines.push(`${indent}} else {`);
        visit(fallbackEdge.target, indent + '  ');
      }
      lines.push(`${indent}}`);
    } else {
      for (const edge of outEdges) visit(edge.target, indent);
    }
  }
}

function emitLogicCode(
  node: WorkflowNode,
  outEdges: WorkflowEdge[],
  lines: string[],
  indent: string,
  visit: (id: string, indent: string) => void,
) {
  const d = node.data as Record<string, unknown>;
  const condition = (d.condition as string) || 'true';
  const kind = (d.kind as string) || 'if_else';

  if (kind === 'while_loop') {
    const maxIter = (d.maxIterations as number) || 10;
    lines.push(`${indent}let _loopCount = 0;`);
    lines.push(`${indent}while (${condition} && _loopCount < ${maxIter}) {`);
    lines.push(`${indent}  _loopCount++;`);
    for (const edge of outEdges) visit(edge.target, indent + '  ');
    lines.push(`${indent}}`);
  } else if (outEdges.length >= 2) {
    const trueEdge = outEdges.find(e => e.label === 'true') || outEdges[0];
    const falseEdge = outEdges.find(e => e.label === 'false') || outEdges[1];
    lines.push(`${indent}if (${condition}) {`);
    visit(trueEdge.target, indent + '  ');
    lines.push(`${indent}} else {`);
    if (falseEdge) visit(falseEdge.target, indent + '  ');
    lines.push(`${indent}}`);
  } else {
    for (const edge of outEdges) visit(edge.target, indent);
  }
}
