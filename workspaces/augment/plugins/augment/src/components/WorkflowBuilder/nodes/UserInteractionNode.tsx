import { memo } from 'react';
import type { NodeProps } from '@xyflow/react';
import PersonIcon from '@mui/icons-material/Person';
import { BaseNode } from './BaseNode';

export const UserInteractionNode = memo(function UserInteractionNode({ data, selected }: NodeProps) {
  const d = data as Record<string, unknown>;
  const label = (d.label as string) || 'User approval';

  return (
    <BaseNode
      title={label}
      icon={<PersonIcon sx={{ fontSize: 14, color: '#fff' }} />}
      nodeType="user_interaction"
      selected={selected}
    />
  );
});
