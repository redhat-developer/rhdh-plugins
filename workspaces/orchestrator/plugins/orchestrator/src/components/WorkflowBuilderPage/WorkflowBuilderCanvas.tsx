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

import { useCallback, useMemo } from 'react';
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  Handle,
  Position,
  useEdgesState,
  useNodesState,
  type Node,
  type NodeProps,
} from 'reactflow';

import { Button } from '@backstage/ui';

import AddIcon from '@mui/icons-material/Add';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

import { useTranslation } from '../../hooks/useTranslation';
import styles from './WorkflowBuilderCanvas.module.css';

import 'reactflow/dist/style.css';

/** Prototype step card width (~176×73 rectangle). */
const STEP_WIDTH = 176;

const StepNode = ({
  data,
  selected,
}: NodeProps<{ label: string; showStartBadge?: boolean }>) => {
  const { t } = useTranslation();

  return (
    <div
      data-testid="builder-step-node"
      data-selected={selected ? 'true' : undefined}
      className={`${styles.stepNode}${selected ? ` ${styles.stepNodeSelected}` : ''}`}
    >
      <div className={styles.badgeRow}>
        <span className={`${styles.badge} ${styles.needsSetupBadge}`}>
          <ErrorOutlineIcon className={styles.badgeIcon} fontSize="inherit" />
          {t('builder.canvas.needsSetup')}
        </span>
        {data.showStartBadge ? (
          <span className={`${styles.badge} ${styles.startBadge}`}>
            {t('builder.canvas.startBadge')}
          </span>
        ) : null}
      </div>
      <div className={styles.stepLabel}>{data.label}</div>
      <div className={styles.stepType}>{t('builder.canvas.operation')}</div>
      <Handle
        type="target"
        position={Position.Top}
        style={{ width: 6, height: 6 }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ width: 6, height: 6 }}
      />
    </div>
  );
};

const nodeTypes = { step: StepNode };

const createStartNode = (): Node => ({
  id: 'start',
  type: 'step',
  position: { x: 120, y: 100 },
  data: { label: 'Start', showStartBadge: true },
  draggable: true,
  style: { width: STEP_WIDTH },
});

/**
 * React Flow canvas with BUI Add-step control (Button used as-is).
 */
export const WorkflowBuilderCanvas = () => {
  const { t } = useTranslation();
  const [nodes, setNodes, onNodesChange] = useNodesState([createStartNode()]);
  const [edges, , onEdgesChange] = useEdgesState([]);

  const onAddStep = useCallback(() => {
    const id = `step-${Date.now()}`;
    const offset = nodes.length * 24;
    setNodes(current => [
      ...current,
      {
        id,
        type: 'step',
        position: { x: 120 + offset, y: 100 + offset + 110 },
        data: { label: `Step ${current.length}`, showStartBadge: false },
        draggable: true,
        style: { width: STEP_WIDTH },
      },
    ]);
  }, [nodes.length, setNodes]);

  const defaultEdgeOptions = useMemo(() => ({ type: 'smoothstep' }), []);

  const onInit = useCallback(
    (instance: { fitView: (opts?: object) => void }) => {
      requestAnimationFrame(() => {
        instance.fitView({ padding: 0.35, maxZoom: 1 });
      });
    },
    [],
  );

  return (
    <div className={styles.canvas} data-testid="workflow-builder-canvas">
      <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 5 }}>
        <Button
          variant="secondary"
          size="small"
          iconStart={<AddIcon fontSize="small" />}
          onClick={onAddStep}
          data-testid="builder-add-step"
        >
          {t('builder.canvas.addStep')}
        </Button>
      </div>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onInit={onInit}
        nodeTypes={nodeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        minZoom={0.4}
        maxZoom={1.5}
        elementsSelectable
        selectNodesOnDrag={false}
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={16}
          size={1}
          color="var(--bui-border-1, #d2d2d2)"
        />
        <Controls showInteractive={false} position="bottom-left" />
      </ReactFlow>
    </div>
  );
};
