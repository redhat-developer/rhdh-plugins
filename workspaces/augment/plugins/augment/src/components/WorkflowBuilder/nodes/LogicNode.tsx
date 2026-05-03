import { memo } from 'react';
import type { NodeProps } from '@xyflow/react';
import { BaseNode } from './BaseNode';

export const LogicNode = memo(function LogicNode({ data, selected }: NodeProps) {
  const d = data as Record<string, unknown>;
  const label = (d.label as string) || 'Condition';
  const condition = (d.condition as string) || '';

  return (
    <BaseNode
      title={label}
      description={condition || undefined}
      nodeType="logic"
      selected={selected}
    />
  );
});
