import { memo } from 'react';
import type { NodeProps } from '@xyflow/react';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import { BaseNode } from './BaseNode';

export const AgentNode = memo(function AgentNode({ data, selected }: NodeProps) {
  const d = data as Record<string, unknown>;
  const name = (d.name as string) || (d.agentKey as string) || 'Agent';
  const desc = (d.instructions as string) || '';
  const summary = desc.length > 60 ? `${desc.slice(0, 60)}...` : desc;

  return (
    <BaseNode
      title={name}
      subtitle="Agent"
      description={summary || undefined}
      icon={<SmartToyIcon sx={{ fontSize: 14, color: '#fff' }} />}
      nodeType="agent"
      selected={selected}
    />
  );
});
