import { useCallback, useEffect, useRef, useState } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import Box from '@mui/material/Box';
import Slide from '@mui/material/Slide';
import Dialog from '@mui/material/Dialog';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import type { WorkflowDefinition, WorkflowNode, WorkflowEdge } from '@red-hat-developer-hub/backstage-plugin-augment-common';
import { EditorToolbar, type EditorMode } from './EditorToolbar';
import { AgentListPanel } from './AgentListPanel';
import { EditorCanvas } from './EditorCanvas';
import { ConfigPanel } from './ConfigPanel';
import { PreviewChatPanel } from './PreviewChatPanel';
import { WorkflowCodeExport } from './WorkflowCodeExport';
import { WorkflowSettingsDialog } from './WorkflowSettingsDialog';
import { WorkflowEvaluation } from './WorkflowEvaluation';
import { useApi, configApiRef } from '@backstage/core-plugin-api';
import { augmentApiRef } from '../../api';
import './WorkflowEditor.css';

const MAX_HISTORY = 50;

export interface WorkflowEditorProps {
  workflow: WorkflowDefinition;
  onSave: (updated: WorkflowDefinition) => void;
  onPublish: () => void;
  onPreview: () => void;
  onBack?: () => void;
  onDelete?: () => void;
  readOnly?: boolean;
}

export function WorkflowEditor({ workflow, onSave, onPublish, onBack, onDelete, readOnly }: WorkflowEditorProps) {
  const api = useApi(augmentApiRef);
  const configApi = useApi(configApiRef);
  const editorTheme = useTheme();
  const isNarrow = useMediaQuery(editorTheme.breakpoints.down('md'));
  const [mode, setMode] = useState<EditorMode>('edit');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [codeOpen, setCodeOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [evalOpen, setEvalOpen] = useState(false);
  const [availableModels, setAvailableModels] = useState<string[]>([]);

  // Undo/redo history
  const historyRef = useRef<WorkflowDefinition[]>([workflow]);
  const historyIndexRef = useRef(0);
  const skipHistoryRef = useRef(false);

  useEffect(() => {
    if (skipHistoryRef.current) {
      skipHistoryRef.current = false;
      return;
    }
    const idx = historyIndexRef.current;
    const newHistory = historyRef.current.slice(0, idx + 1);
    newHistory.push(workflow);
    if (newHistory.length > MAX_HISTORY) newHistory.shift();
    historyRef.current = newHistory;
    historyIndexRef.current = newHistory.length - 1;
  }, [workflow]);

  const canUndo = historyIndexRef.current > 0;
  const canRedo = historyIndexRef.current < historyRef.current.length - 1;

  const handleUndo = useCallback(() => {
    if (historyIndexRef.current <= 0) return;
    historyIndexRef.current -= 1;
    skipHistoryRef.current = true;
    onSave(historyRef.current[historyIndexRef.current]);
  }, [onSave]);

  const handleRedo = useCallback(() => {
    if (historyIndexRef.current >= historyRef.current.length - 1) return;
    historyIndexRef.current += 1;
    skipHistoryRef.current = true;
    onSave(historyRef.current[historyIndexRef.current]);
  }, [onSave]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyboard = (e: KeyboardEvent) => {
      const isMeta = e.metaKey || e.ctrlKey;
      if (isMeta && e.key === 'z' && !e.shiftKey) { e.preventDefault(); handleUndo(); }
      if (isMeta && e.key === 'z' && e.shiftKey) { e.preventDefault(); handleRedo(); }
      if (isMeta && e.key === 'e') { e.preventDefault(); setEvalOpen(o => !o); }
      if (isMeta && e.key === 'p') { e.preventDefault(); setMode(m => m === 'preview' ? 'edit' : 'preview'); }
      if (e.key === 'Escape') {
        if (evalOpen) setEvalOpen(false);
        else if (codeOpen) setCodeOpen(false);
        else if (settingsOpen) setSettingsOpen(false);
        else if (selectedNodeId) setSelectedNodeId(null);
      }
    };
    window.addEventListener('keydown', handleKeyboard);
    return () => window.removeEventListener('keydown', handleKeyboard);
  }, [handleUndo, handleRedo, evalOpen, codeOpen, settingsOpen, selectedNodeId]);

  useEffect(() => {
    api.listModels()
      .then(models => setAvailableModels(models.map(m => m.id).filter(Boolean)))
      .catch(() => { /* Models endpoint optional */ });
  }, [api]);

  const selectedNode = selectedNodeId ? workflow.nodes.find(n => n.id === selectedNodeId) : null;

  const handleAddNode = useCallback((type: string) => {
    const id = `${type}-${Date.now()}`;
    const actualType = type === 'while' ? 'logic' : type;
    const defaultData: Record<string, unknown> = { label: type.charAt(0).toUpperCase() + type.slice(1) };
    if (type === 'while') defaultData.kind = 'while_loop';
    const newNode: WorkflowNode = {
      id,
      type: actualType as WorkflowNode['type'],
      position: { x: 300 + Math.random() * 100, y: 150 + Math.random() * 100 },
      data: defaultData as WorkflowNode['data'],
    };
    onSave({ ...workflow, nodes: [...workflow.nodes, newNode], updatedAt: new Date().toISOString() });
  }, [workflow, onSave]);

  const handleNodeDataChange = useCallback((nodeId: string, field: string, value: unknown) => {
    const updatedNodes = workflow.nodes.map(n =>
      n.id === nodeId ? { ...n, data: { ...n.data, [field]: value } } : n,
    );
    onSave({ ...workflow, nodes: updatedNodes, updatedAt: new Date().toISOString() });
  }, [workflow, onSave]);

  const handleDeleteNode = useCallback((nodeId: string) => {
    const updatedNodes = workflow.nodes.filter(n => n.id !== nodeId);
    const updatedEdges = workflow.edges.filter(e => e.source !== nodeId && e.target !== nodeId);
    onSave({ ...workflow, nodes: updatedNodes, edges: updatedEdges, updatedAt: new Date().toISOString() });
    setSelectedNodeId(null);
  }, [workflow, onSave]);

  const handleGraphChange = useCallback((nodes: WorkflowNode[], edges: WorkflowEdge[]) => {
    const merged = workflow.nodes.map(wn => {
      const updated = nodes.find(n => n.id === wn.id);
      return updated ? { ...wn, position: updated.position } : wn;
    });
    const newNodeIds = nodes.map(n => n.id);
    const removed = workflow.nodes.filter(n => !newNodeIds.includes(n.id));
    if (removed.length > 0 || edges.length !== workflow.edges.length) {
      onSave({ ...workflow, nodes: merged.filter(n => newNodeIds.includes(n.id)), edges, updatedAt: new Date().toISOString() });
    } else {
      onSave({ ...workflow, nodes: merged, edges, updatedAt: new Date().toISOString() });
    }
  }, [workflow, onSave]);

  const handleRename = useCallback((newName: string) => {
    onSave({ ...workflow, name: newName, updatedAt: new Date().toISOString() });
  }, [workflow, onSave]);

  const handleDuplicate = useCallback(() => {
    const dup = { ...workflow, id: `${workflow.id}-copy`, name: `${workflow.name} (Copy)`, updatedAt: new Date().toISOString() };
    onSave(dup);
  }, [workflow, onSave]);

  const handleSecretsChange = useCallback((secrets: Array<{ name: string; value: string }>) => {
    onSave({ ...workflow, settings: { ...workflow.settings, secrets }, updatedAt: new Date().toISOString() } as WorkflowDefinition);
  }, [workflow, onSave]);

  const secrets = ((workflow.settings as Record<string, unknown>)?.secrets as Array<{ name: string; value: string }>) || [];

  return (
    <Box className="wf-editor" sx={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', overflow: 'hidden' }}>
      <EditorToolbar
        workflowName={workflow.name}
        status={workflow.status}
        version={workflow.version}
        mode={mode}
        onModeChange={setMode}
        onBack={onBack}
        onCodeExport={() => setCodeOpen(true)}
        onPublish={onPublish}
        onSettings={() => setSettingsOpen(true)}
        onEvaluate={() => setEvalOpen(true)}
        onRename={handleRename}
        onDuplicate={handleDuplicate}
        onDelete={onDelete}
      />

      <Box sx={{ display: 'flex', flex: 1, minHeight: 0, minWidth: 0, overflow: 'hidden' }}>
        {/* Left palette — only in edit mode, hidden on narrow viewports */}
        {mode === 'edit' && !readOnly && !isNarrow && <AgentListPanel onAddNode={handleAddNode} />}

        {/* Center canvas + overlaid right panels */}
        <Box sx={{ flex: 1, minWidth: 0, position: 'relative', overflow: 'hidden' }}>
          <ReactFlowProvider>
            <EditorCanvas
              initialNodes={workflow.nodes}
              initialEdges={workflow.edges}
              onNodeClick={mode === 'edit' ? setSelectedNodeId : undefined}
              onPaneClick={() => {
                setSelectedNodeId(null);
                if (mode === 'preview') setMode('edit');
              }}
              onGraphChange={handleGraphChange}
              onUndo={handleUndo}
              onRedo={handleRedo}
              canUndo={canUndo}
              canRedo={canRedo}
              readOnly={readOnly || mode === 'preview'}
            />
          </ReactFlowProvider>

          {/* Right panels — absolutely positioned so they overlay the canvas instead of widening the flex row */}
          <Slide direction="left" in={mode === 'edit' && !!selectedNode && !readOnly} mountOnEnter unmountOnExit>
            <Box sx={{ position: 'absolute', top: 0, right: 0, height: '100%', zIndex: 5 }}>
              {selectedNode && (
                <ConfigPanel
                  nodeId={selectedNode.id}
                  nodeType={selectedNode.type}
                  nodeData={selectedNode.data as Record<string, unknown>}
                  onChange={handleNodeDataChange}
                  onClose={() => setSelectedNodeId(null)}
                  onDelete={handleDeleteNode}
                  availableModels={availableModels}
                />
              )}
            </Box>
          </Slide>
          <Slide direction="left" in={mode === 'preview'} mountOnEnter unmountOnExit>
            <Box sx={{ position: 'absolute', top: 0, right: 0, height: '100%', zIndex: 5 }}>
              <PreviewChatPanel workflowId={workflow.id} onClose={() => setMode('edit')} />
            </Box>
          </Slide>
        </Box>
      </Box>

      {/* Code export dialog */}
      <Dialog
        open={codeOpen}
        onClose={() => setCodeOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { height: '80vh', maxHeight: '80vh', borderRadius: 2 } }}
      >
        <WorkflowCodeExport workflow={workflow} onClose={() => setCodeOpen(false)} />
      </Dialog>

      {/* Workflow settings dialog */}
      <WorkflowSettingsDialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        workflowId={workflow.id}
        secrets={secrets}
        onSecretsChange={handleSecretsChange}
      />

      {/* Evaluation dialog */}
      <Dialog
        open={evalOpen}
        onClose={() => setEvalOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{ sx: { height: '80vh', maxHeight: '80vh', borderRadius: 2 } }}
      >
        <WorkflowEvaluation
          workflowId={workflow.id}
          onClose={() => setEvalOpen(false)}
          onRunEvaluation={async (testCases, scoringFunctions) => {
            const backendUrl = configApi.getString('backend.baseUrl');
            const resp = await fetch(`${backendUrl}/api/augment/workflows/${workflow.id}/evaluate`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ testCases, scoringFunctions }),
            });
            if (!resp.ok) {
              const errText = await resp.text().catch(() => '');
              throw new Error(`Evaluation failed: ${resp.status} ${errText}`);
            }
            return await resp.json();
          }}
        />
      </Dialog>
    </Box>
  );
}
