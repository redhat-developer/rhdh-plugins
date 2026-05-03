import { memo } from 'react';
import type { NodeProps } from '@xyflow/react';
import ShieldIcon from '@mui/icons-material/Shield';
import { BaseNode } from './BaseNode';

export const GuardrailNode = memo(function GuardrailNode({ data, selected }: NodeProps) {
  const d = data as Record<string, unknown>;
  const label = (d.label as string) || 'Guardrail';

  return (
    <BaseNode
      title={label}
      icon={<ShieldIcon sx={{ fontSize: 14, color: '#fff' }} />}
      nodeType="guardrail"
      selected={selected}
    />
  );
});
