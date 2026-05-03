import { memo } from 'react';
import type { NodeProps } from '@xyflow/react';
import { BaseNode } from './BaseNode';

export const NoteNode = memo(function NoteNode({ data, selected }: NodeProps) {
  const d = data as Record<string, unknown>;
  const label = (d.label as string) || 'Note';
  const text = (d.text as string) || '';

  return (
    <BaseNode
      title={label}
      description={text || undefined}
      nodeType="note"
      selected={selected}
      hasSource={false}
      hasTarget={false}
    />
  );
});
