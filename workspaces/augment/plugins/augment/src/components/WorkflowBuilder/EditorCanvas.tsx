import { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  ReactFlow,
  Background,
  MiniMap,
  Position,
  useNodesState,
  useEdgesState,
  useReactFlow,
  addEdge,
  type Connection,
  type Edge,
  type Node,
  type NodeTypes,
  type DefaultEdgeOptions,
  type NodeChange,
  type EdgeChange,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import FitScreenIcon from '@mui/icons-material/FitScreen';
import NearMeIcon from '@mui/icons-material/NearMe';
import UndoIcon from '@mui/icons-material/Undo';
import RedoIcon from '@mui/icons-material/Redo';
import { alpha, useTheme } from '@mui/material/styles';
import type { WorkflowNode, WorkflowEdge as WfEdge } from '@red-hat-developer-hub/backstage-plugin-augment-common';
import { canvasBg, handleColor, handleBorder, elevationShadow } from './theme/tokens';
import { AgentNode } from './nodes/AgentNode';
import { ClassifyNode } from './nodes/ClassifyNode';
import { LogicNode } from './nodes/LogicNode';
import { StartNode } from './nodes/StartNode';
import { EndNode } from './nodes/EndNode';
import { ToolNode } from './nodes/ToolNode';
import { GuardrailNode } from './nodes/GuardrailNode';
import { UserInteractionNode } from './nodes/UserInteractionNode';
import { NoteNode } from './nodes/NoteNode';
import { TransformNode } from './nodes/TransformNode';
import { SetStateNode } from './nodes/SetStateNode';
import { FileSearchNode } from './nodes/FileSearchNode';
import { McpNode } from './nodes/McpNode';

const nodeTypes: NodeTypes = {
  agent: AgentNode,
  classify: ClassifyNode,
  logic: LogicNode,
  start: StartNode,
  end: EndNode,
  tool: ToolNode,
  guardrail: GuardrailNode,
  user_interaction: UserInteractionNode,
  note: NoteNode,
  transform: TransformNode,
  set_state: SetStateNode,
  file_search: FileSearchNode,
  mcp: McpNode,
};

const defaultEdgeOptions: DefaultEdgeOptions = {
  type: 'default',
  style: { strokeWidth: 1.5 },
};

function toFlowNodes(wfNodes: WorkflowNode[]): Node[] {
  return wfNodes.map(n => ({
    id: n.id,
    type: n.type,
    position: n.position,
    data: { ...n.data, label: n.label },
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
  }));
}

function toFlowEdges(wfEdges: WfEdge[]): Edge[] {
  return wfEdges.map(e => ({
    id: e.id,
    source: e.source,
    target: e.target,
    type: 'default',
    label: e.label,
    animated: e.type === 'handoff',
    data: { branchLabel: e.label, condition: e.condition },
  }));
}

export function fromFlowNodes(nodes: Node[]): WorkflowNode[] {
  return nodes.map(n => ({
    id: n.id,
    type: n.type as WorkflowNode['type'],
    position: n.position,
    data: n.data as WorkflowNode['data'],
    label: (n.data as Record<string, unknown>).label as string | undefined,
  }));
}

export function fromFlowEdges(edges: Edge[]): WfEdge[] {
  return edges.map(e => ({
    id: e.id,
    source: e.source,
    target: e.target,
    type: (e.data as Record<string, unknown>)?.edgeType as WfEdge['type'] || 'sequence',
    label: (e.data as Record<string, unknown>)?.branchLabel as string | undefined,
    condition: (e.data as Record<string, unknown>)?.condition as string | undefined,
  }));
}

interface EditorCanvasProps {
  initialNodes: WorkflowNode[];
  initialEdges: WfEdge[];
  onNodeClick?: (nodeId: string) => void;
  onPaneClick?: () => void;
  onGraphChange?: (nodes: WorkflowNode[], edges: WfEdge[]) => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  readOnly?: boolean;
}

export function EditorCanvas({
  initialNodes,
  initialEdges,
  onNodeClick,
  onPaneClick,
  onGraphChange,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  readOnly,
}: EditorCanvasProps) {
  const theme = useTheme();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nodesRef = useRef<Node[]>([]);
  const edgesRef = useRef<Edge[]>([]);

  const flowNodes = useMemo(() => toFlowNodes(initialNodes), [initialNodes]);
  const flowEdges = useMemo(() => toFlowEdges(initialEdges), [initialEdges]);

  const [nodes, setNodes, onNodesChange] = useNodesState(flowNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(flowEdges);

  useEffect(() => { setNodes(flowNodes); }, [flowNodes, setNodes]);
  useEffect(() => { setEdges(flowEdges); }, [flowEdges, setEdges]);

  useEffect(() => { nodesRef.current = nodes; }, [nodes]);
  useEffect(() => { edgesRef.current = edges; }, [edges]);

  const scheduleSync = useCallback(() => {
    if (!onGraphChange || readOnly) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onGraphChange(fromFlowNodes(nodesRef.current), fromFlowEdges(edgesRef.current));
    }, 400);
  }, [onGraphChange, readOnly]);

  const handleNodesChange = useCallback((changes: NodeChange[]) => {
    onNodesChange(changes);
    const hasMoves = changes.some(c => c.type === 'position' && c.dragging === false);
    const hasRemoves = changes.some(c => c.type === 'remove');
    if (hasMoves || hasRemoves) scheduleSync();
  }, [onNodesChange, scheduleSync]);

  const handleEdgesChange = useCallback((changes: EdgeChange[]) => {
    onEdgesChange(changes);
    const hasRemoves = changes.some(c => c.type === 'remove');
    if (hasRemoves) scheduleSync();
  }, [onEdgesChange, scheduleSync]);

  const onConnect = useCallback((connection: Connection) => {
    if (readOnly) return;
    const sourceNode = nodes.find(n => n.id === connection.source);
    let edgeLabel: string | undefined;

    if (sourceNode?.type === 'logic') {
      const existing = edges.filter(e => e.source === sourceNode.id);
      const hasTrueEdge = existing.some(e => (e.data as Record<string, unknown>)?.branchLabel === 'true');
      const hasFalseEdge = existing.some(e => (e.data as Record<string, unknown>)?.branchLabel === 'false');
      if (!hasTrueEdge) edgeLabel = 'true';
      else if (!hasFalseEdge) edgeLabel = 'false';
      else return;
    }

    const newEdge: Edge = {
      ...connection,
      id: `edge-${Date.now()}`,
      type: 'default',
      label: edgeLabel,
      data: { branchLabel: edgeLabel },
    } as Edge;
    setEdges(eds => addEdge(newEdge, eds));
    setTimeout(scheduleSync, 50);
  }, [nodes, edges, setEdges, readOnly, scheduleSync]);

  const handleNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    onNodeClick?.(node.id);
  }, [onNodeClick]);

  const dotColor = alpha(theme.palette.text.primary, 0.06);
  const showMinimap = nodes.length > 5;

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        bgcolor: canvasBg(theme),
        '--wf-handle-bg': handleColor(theme),
        '--wf-handle-border': handleBorder(theme),
      } as React.CSSProperties & Record<string, string>}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={readOnly ? undefined : handleNodesChange}
        onEdgesChange={readOnly ? undefined : handleEdgesChange}
        onConnect={readOnly ? undefined : onConnect}
        onNodeClick={handleNodeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        defaultEdgeOptions={{
          ...defaultEdgeOptions,
          style: { ...defaultEdgeOptions.style, stroke: theme.palette.divider },
        }}
        connectionLineStyle={{ stroke: theme.palette.primary.main, strokeDasharray: '5 3', strokeWidth: 1.5 }}
        fitView
        snapToGrid
        snapGrid={[16, 16]}
        deleteKeyCode={readOnly ? null : 'Delete'}
        proOptions={{ hideAttribution: true }}
      >
        <Background color={dotColor} gap={16} size={1} />
        {showMinimap && (
          <MiniMap
            nodeStrokeWidth={3}
            pannable
            zoomable
            style={{
              backgroundColor: theme.palette.background.paper,
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 8,
            }}
          />
        )}
      </ReactFlow>

      {!readOnly && (
        <Box
          sx={{
            position: 'absolute',
            bottom: 16,
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: 0.5,
            bgcolor: theme.palette.background.paper,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            px: 0.5,
            py: 0.25,
            boxShadow: elevationShadow(theme, 2),
          }}
        >
          <Tooltip title="Fit view">
            <span><CanvasControl icon={<FitScreenIcon />} label="Fit view" action="fitView" /></span>
          </Tooltip>
          <Tooltip title="Select tool">
            <IconButton size="small" aria-label="Select" sx={{ p: 0.5 }}>
              <NearMeIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Undo (Ctrl+Z)">
            <span>
              <IconButton size="small" aria-label="Undo" onClick={onUndo} disabled={!canUndo} sx={{ p: 0.5 }}>
                <UndoIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Redo (Ctrl+Shift+Z)">
            <span>
              <IconButton size="small" aria-label="Redo" onClick={onRedo} disabled={!canRedo} sx={{ p: 0.5 }}>
                <RedoIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </span>
          </Tooltip>
        </Box>
      )}
    </Box>
  );
}

function CanvasControl({ icon, label, action }: { icon: React.ReactNode; label: string; action: string }) {
  const { zoomIn, zoomOut, fitView } = useReactFlow();
  const handlers: Record<string, () => void> = { zoomIn, zoomOut, fitView };
  return (
    <IconButton size="small" onClick={handlers[action]} aria-label={label} sx={{ p: 0.5 }}>
      {icon}
    </IconButton>
  );
}
