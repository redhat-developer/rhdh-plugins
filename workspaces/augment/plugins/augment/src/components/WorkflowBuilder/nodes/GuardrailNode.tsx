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
import { memo } from 'react';
import type { NodeProps } from '@xyflow/react';
import ShieldIcon from '@mui/icons-material/Shield';
import { BaseNode } from './BaseNode';

export const GuardrailNode = memo(function GuardrailNode({
  data,
  selected,
}: NodeProps) {
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
