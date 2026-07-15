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
  Controls,
  EdgeProps,
  getSmoothStepPath,
  Handle,
  NodeProps,
  Position,
  ReactFlowInstance,
} from 'reactflow';

import { Progress, ResponseErrorPanel } from '@backstage/core-components';

import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import PauseCircleFilledIcon from '@mui/icons-material/PauseCircleFilled';
import PlayCircleFilledIcon from '@mui/icons-material/PlayCircleFilled';
import StopCircleIcon from '@mui/icons-material/StopCircle';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import { alpha, useTheme } from '@mui/material/styles';

import {
  ProcessInstanceDTO,
  ProcessInstanceStatusDTO,
} from '@red-hat-developer-hub/backstage-plugin-orchestrator-common';

import { useTranslation } from '../../hooks/useTranslation';
import {
  buildWorkflowReactFlowGraph,
  parseWorkflowSource,
  WorkflowFlowNodeData,
} from '../../utils/buildWorkflowReactFlowGraph';
import { buildNodeStatusMap } from './buildNodeStatusMap';
import { Paragraph } from './Paragraph';

import 'reactflow/dist/style.css';

const ICON_STYLE = { fontSize: 16, verticalAlign: 'middle' } as const;

const STATUS_ICONS: Record<
  ProcessInstanceStatusDTO,
  React.ComponentType<{ sx?: object }>
> = {
  [ProcessInstanceStatusDTO.Completed]: CheckCircleIcon,
  [ProcessInstanceStatusDTO.Active]: PlayCircleFilledIcon,
  [ProcessInstanceStatusDTO.Pending]: HourglassEmptyIcon,
  [ProcessInstanceStatusDTO.Error]: ErrorIcon,
  [ProcessInstanceStatusDTO.Aborted]: StopCircleIcon,
  [ProcessInstanceStatusDTO.Suspended]: PauseCircleFilledIcon,
};

const STATUS_LABELS: Record<ProcessInstanceStatusDTO, string> = {
  [ProcessInstanceStatusDTO.Completed]: 'Completed',
  [ProcessInstanceStatusDTO.Active]: 'Active',
  [ProcessInstanceStatusDTO.Pending]: 'Pending',
  [ProcessInstanceStatusDTO.Error]: 'Failed',
  [ProcessInstanceStatusDTO.Aborted]: 'Aborted',
  [ProcessInstanceStatusDTO.Suspended]: 'Suspended',
};

const useNodeColors = (status?: ProcessInstanceStatusDTO) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  if (!status) {
    return {
      background: theme.palette.background.paper,
      border: theme.palette.divider,
      color: theme.palette.text.primary,
      secondaryColor: theme.palette.text.secondary,
      iconColor: theme.palette.text.secondary,
    };
  }

  const statusPaletteMap: Record<
    ProcessInstanceStatusDTO,
    { main: string; light: string; dark: string }
  > = {
    [ProcessInstanceStatusDTO.Completed]: theme.palette.success,
    [ProcessInstanceStatusDTO.Error]: theme.palette.error,
    [ProcessInstanceStatusDTO.Active]: theme.palette.info,
    [ProcessInstanceStatusDTO.Pending]: theme.palette.info,
    [ProcessInstanceStatusDTO.Aborted]: {
      main: theme.palette.grey[500],
      light: theme.palette.grey[300],
      dark: theme.palette.grey[700],
    },
    [ProcessInstanceStatusDTO.Suspended]: {
      main: theme.palette.grey[500],
      light: theme.palette.grey[300],
      dark: theme.palette.grey[700],
    },
  };

  const pal = statusPaletteMap[status];

  if (isDark) {
    return {
      background: pal.dark,
      border: pal.main,
      color: theme.palette.common.white,
      secondaryColor: alpha(theme.palette.common.white, 0.8),
      iconColor: theme.palette.common.white,
    };
  }

  return {
    background: alpha(pal.main, 0.08),
    border: pal.main,
    color: theme.palette.text.primary,
    secondaryColor: pal.main,
    iconColor: pal.main,
  };
};

const WorkflowProgressFlowNode = ({
  data,
}: NodeProps<WorkflowFlowNodeData>) => {
  const theme = useTheme();
  const colors = useNodeColors(data.status);
  const IconComponent = data.status ? STATUS_ICONS[data.status] : undefined;
  const secondaryLabel =
    data.status !== undefined
      ? STATUS_LABELS[data.status]
      : data.secondaryLabel;

  return (
    <div
      style={{
        background: colors.background,
        border: `2px solid ${colors.border}`,
        borderRadius: 8,
        padding: '8px 14px',
        minWidth: 160,
        textAlign: 'center',
        fontWeight: 600,
        fontSize: 14,
        color: colors.color,
        boxShadow: theme.shadows[1],
      }}
    >
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          overflow: 'hidden',
          whiteSpace: 'nowrap',
        }}
      >
        {IconComponent && (
          <IconComponent sx={{ ...ICON_STYLE, color: colors.iconColor }} />
        )}
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {data.label}
        </span>
      </div>
      {secondaryLabel && (
        <div
          style={{
            fontSize: 11,
            fontWeight: 500,
            color: colors.secondaryColor,
          }}
        >
          {secondaryLabel}
        </div>
      )}
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
    </div>
  );
};

const nodeTypes = { workflowNode: WorkflowProgressFlowNode };
const edgeTypes = {
  labeled: ({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    markerEnd,
  }: EdgeProps) => {
    const [edgePath] = getSmoothStepPath({
      sourceX,
      sourceY,
      targetX,
      targetY,
      sourcePosition,
      targetPosition,
    });

    return (
      <path
        id={id}
        className="react-flow__edge-path"
        d={edgePath}
        markerEnd={markerEnd}
      />
    );
  },
};

export type WorkflowInstanceProgressReactFlowProps = {
  workflowSource?: string;
  loadingWorkflowSource: boolean;
  errorWorkflowSource?: Error;
  workflowStatus: ProcessInstanceDTO['state'];
  workflowNodes: ProcessInstanceDTO['nodes'];
  workflowError?: ProcessInstanceDTO['error'];
};

export const WorkflowInstanceProgressReactFlow = ({
  workflowSource,
  loadingWorkflowSource,
  errorWorkflowSource,
  workflowStatus,
  workflowNodes,
  workflowError,
}: WorkflowInstanceProgressReactFlowProps) => {
  const { t } = useTranslation();

  const flow = useMemo(() => {
    if (!workflowSource) {
      return undefined;
    }
    const parsed = parseWorkflowSource(workflowSource);
    if (parsed.error || !parsed.definition) {
      return undefined;
    }
    const nodeStatusById = buildNodeStatusMap(
      workflowNodes,
      workflowStatus,
      workflowError,
    );
    return buildWorkflowReactFlowGraph(parsed.definition, nodeStatusById);
  }, [workflowSource, workflowNodes, workflowStatus, workflowError]);

  const onInit = useCallback((instance: ReactFlowInstance) => {
    instance.fitView({ padding: 0.02 });
  }, []);

  if (loadingWorkflowSource) {
    return <Progress />;
  }

  if (errorWorkflowSource) {
    return <ResponseErrorPanel error={errorWorkflowSource} />;
  }

  if (!workflowSource) {
    return <Paragraph>{t('messages.noDataAvailable')}</Paragraph>;
  }

  if (!flow) {
    return (
      <Alert severity="info">
        {workflowNodes.length === 0
          ? t('messages.noDataAvailable')
          : 'Unable to render workflow graph from definition.'}
      </Alert>
    );
  }

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        minHeight: 300,
        aspectRatio: `${flow.contentWidth} / ${flow.contentHeight}`,
      }}
    >
      <ReactFlow
        nodes={flow.nodes}
        edges={flow.edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        onInit={onInit}
        minZoom={0.2}
        maxZoom={1.2}
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={16} />
        <Controls showInteractive={false} />
      </ReactFlow>
    </Box>
  );
};

WorkflowInstanceProgressReactFlow.displayName =
  'WorkflowInstanceProgressReactFlow';
