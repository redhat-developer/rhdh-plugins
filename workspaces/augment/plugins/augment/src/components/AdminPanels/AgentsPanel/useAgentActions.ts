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
import { useCallback, type MutableRefObject } from 'react';
import {
  type AgentFormData,
  createDefaultAgent,
  agentToConfig,
  buildAgentContext,
} from './agentValidation';
import { AGENT_TEMPLATES } from './agentTemplates';

const SAVE_SUCCESS_TIMEOUT_MS = 3000;

interface SaveDeps {
  saveAgents: (v: unknown) => Promise<unknown>;
  saveDefaultAgent: (v: unknown) => Promise<unknown>;
  saveMaxTurns: (v: unknown) => Promise<unknown>;
}

interface AgentActionDeps {
  agents: Record<string, AgentFormData>;
  agentKeys: string[];
  defaultAgentKey: string;
  maxTurns: number;
  selectedAgentKey: string | null;
  selectedAgent: AgentFormData | null;
  availableMcpServers: { id: string; name: string }[];
  isSingleAgentMode: boolean | '' | null | undefined;
  effectiveConfig: Record<string, unknown> | null;
  validationErrors: string[];
  saveDeps: SaveDeps;
  generate: (prompt: string, model?: string, caps?: Record<string, boolean>) => Promise<string>;
  onSaved?: () => void;
  setAgents: React.Dispatch<React.SetStateAction<Record<string, AgentFormData>>>;
  setSelectedAgentKey: React.Dispatch<React.SetStateAction<string | null>>;
  setDefaultAgentKey: React.Dispatch<React.SetStateAction<string>>;
  setActiveTab: React.Dispatch<React.SetStateAction<number>>;
  setCreateModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setConfirmRemoveKey: React.Dispatch<React.SetStateAction<string | null>>;
  setConfirmReset: React.Dispatch<React.SetStateAction<boolean>>;
  setSaveError: React.Dispatch<React.SetStateAction<string | null>>;
  setSaveSuccess: React.Dispatch<React.SetStateAction<boolean>>;
  setSaving: React.Dispatch<React.SetStateAction<boolean>>;
  setResetting: React.Dispatch<React.SetStateAction<boolean>>;
  setInitialized: React.Dispatch<React.SetStateAction<boolean>>;
  setGenerateToast: React.Dispatch<React.SetStateAction<string | null>>;
  setSelectedTemplate: React.Dispatch<React.SetStateAction<string>>;
  setStepperStep: React.Dispatch<React.SetStateAction<number>>;
  initialSnapshotRef: MutableRefObject<string>;
  saveTimerRef: MutableRefObject<ReturnType<typeof setTimeout> | undefined>;
  resetAgents: () => Promise<void>;
  refreshConfig: () => Promise<void>;
  confirmRemoveKey: string | null;
}

export function useAgentActions(deps: AgentActionDeps) {
  const {
    agents,
    agentKeys,
    defaultAgentKey,
    maxTurns,
    selectedAgentKey,
    selectedAgent,
    availableMcpServers,
    isSingleAgentMode,
    effectiveConfig,
    validationErrors,
    saveDeps,
    generate,
    onSaved,
    setAgents,
    setSelectedAgentKey,
    setDefaultAgentKey,
    setActiveTab,
    setCreateModalOpen,
    setConfirmRemoveKey,
    setConfirmReset,
    setSaveError,
    setSaveSuccess,
    setSaving,
    setResetting,
    setInitialized,
    setGenerateToast,
    setSelectedTemplate,
    setStepperStep,
    initialSnapshotRef,
    saveTimerRef,
    resetAgents,
    refreshConfig,
    confirmRemoveKey,
  } = deps;

  const handleSelectAgent = useCallback((key: string) => {
    setSelectedAgentKey(key);
    setActiveTab(0);
  }, [setSelectedAgentKey, setActiveTab]);

  const handleCreateFromModal = useCallback(
    (name: string, key: string) => {
      if (!key || agents[key]) return;
      const agent = createDefaultAgent();
      agent.name = name || key.charAt(0).toUpperCase() + key.slice(1);
      setAgents(prev => ({ ...prev, [key]: agent }));
      if (agentKeys.length === 0) setDefaultAgentKey(key);
      setSelectedAgentKey(key);
      setCreateModalOpen(false);
    },
    [agents, agentKeys.length, setAgents, setDefaultAgentKey, setSelectedAgentKey, setCreateModalOpen],
  );

  const executeRemoveAgent = useCallback((key: string) => {
    setAgents(prev => {
      const next: Record<string, AgentFormData> = {};
      for (const [k, a] of Object.entries(prev)) {
        if (k === key) continue;
        next[k] = {
          ...a,
          handoffs: a.handoffs.filter(h => h !== key),
          asTools: a.asTools.filter(t => t !== key),
        };
      }
      const remaining = Object.keys(next);
      setSelectedAgentKey(sel => (sel === key ? remaining[0] || null : sel));
      setDefaultAgentKey(def => (def === key ? '' : def));
      return next;
    });
  }, [setAgents, setSelectedAgentKey, setDefaultAgentKey]);

  const handleRemoveAgent = useCallback((key: string) => {
    setConfirmRemoveKey(key);
  }, [setConfirmRemoveKey]);

  const handleConfirmRemove = useCallback(() => {
    if (confirmRemoveKey) {
      executeRemoveAgent(confirmRemoveKey);
      setConfirmRemoveKey(null);
    }
  }, [confirmRemoveKey, executeRemoveAgent, setConfirmRemoveKey]);

  const updateAgent = useCallback(
    (key: string, field: keyof AgentFormData, value: unknown) => {
      setAgents(prev => ({ ...prev, [key]: { ...prev[key], [field]: value } }));
    },
    [setAgents],
  );

  const handleSave = useCallback(async () => {
    if (validationErrors.length > 0) return;
    setSaveError(null);
    setSaveSuccess(false);
    setSaving(true);
    try {
      const newAgents: Record<string, Record<string, unknown>> = {};
      for (const [key, agent] of Object.entries(agents)) {
        newAgents[key] = agentToConfig(agent);
      }
      let payload = newAgents;
      if (isSingleAgentMode && effectiveConfig) {
        const existing =
          (effectiveConfig.agents as Record<string, Record<string, unknown>>) || {};
        payload = { ...existing, ...newAgents };
      }
      for (const step of [
        { label: 'agents', fn: () => saveDeps.saveAgents(payload) },
        { label: 'defaultAgent', fn: () => saveDeps.saveDefaultAgent(defaultAgentKey) },
        { label: 'maxAgentTurns', fn: () => saveDeps.saveMaxTurns(maxTurns) },
      ]) {
        try {
          await step.fn();
        } catch (e) {
          throw new Error(
            `Failed to save ${step.label}: ${e instanceof Error ? e.message : String(e)}`,
          );
        }
      }
      initialSnapshotRef.current = JSON.stringify(agents);
      setSaveSuccess(true);
      if (onSaved) {
        onSaved();
      } else {
        saveTimerRef.current = setTimeout(
          () => setSaveSuccess(false),
          SAVE_SUCCESS_TIMEOUT_MS,
        );
      }
    } catch (err) {
      let msg = 'Failed to save agent config';
      if (err instanceof Error) msg = err.message;
      const body = (err as Record<string, unknown>)?.body;
      if (
        body &&
        typeof body === 'object' &&
        typeof (body as Record<string, unknown>).message === 'string'
      ) {
        msg = (body as Record<string, unknown>).message as string;
      }
      setSaveError(msg);
    } finally {
      setSaving(false);
    }
  }, [
    agents,
    defaultAgentKey,
    maxTurns,
    validationErrors,
    saveDeps,
    onSaved,
    isSingleAgentMode,
    effectiveConfig,
    initialSnapshotRef,
    saveTimerRef,
    setSaveError,
    setSaveSuccess,
    setSaving,
  ]);

  const executeReset = useCallback(async () => {
    setResetting(true);
    try {
      await resetAgents();
      await refreshConfig();
      setInitialized(false);
      setSelectedAgentKey(null);
    } catch {
      setSaveError('Failed to reset agents');
    } finally {
      setResetting(false);
    }
  }, [resetAgents, refreshConfig, setResetting, setInitialized, setSelectedAgentKey, setSaveError]);

  const handleConfirmReset = useCallback(async () => {
    try {
      await executeReset();
    } finally {
      setConfirmReset(false);
    }
  }, [executeReset, setConfirmReset]);

  const handleUpdateInstructions = useCallback(
    (value: string) => {
      if (selectedAgentKey)
        updateAgent(selectedAgentKey, 'instructions', value);
    },
    [selectedAgentKey, updateAgent],
  );

  const handleGenerateForTab = useCallback(
    async (description: string, model: string | undefined) => {
      if (!selectedAgentKey || !selectedAgent) return;
      const context = buildAgentContext(
        selectedAgent,
        agents,
        availableMcpServers,
      );
      const capabilities = {
        enableWebSearch: selectedAgent.enableWebSearch,
        enableCodeInterpreter: selectedAgent.enableCodeInterpreter,
        ragEnabled: selectedAgent.enableRAG,
      };
      const resolvedModel = model || selectedAgent.model || undefined;
      const prompt = await generate(
        `${description.trim()}\n\nAGENT CONTEXT:\n${context}`,
        resolvedModel,
        capabilities,
      );
      updateAgent(selectedAgentKey, 'instructions', prompt);
      setGenerateToast('Instructions generated — review and save when ready');
    },
    [
      selectedAgentKey,
      selectedAgent,
      agents,
      availableMcpServers,
      generate,
      updateAgent,
      setGenerateToast,
    ],
  );

  const applyTemplate = useCallback(
    (templateId: string) => {
      if (!selectedAgentKey) return;
      setSelectedTemplate(templateId);
      const tpl = AGENT_TEMPLATES.find(t => t.id === templateId);
      if (!tpl || templateId === 'blank') return;
      setAgents(prev => ({
        ...prev,
        [selectedAgentKey]: {
          ...prev[selectedAgentKey],
          ...tpl.defaults,
        },
      }));
      if (isSingleAgentMode) {
        setStepperStep(1);
      }
    },
    [selectedAgentKey, isSingleAgentMode, setSelectedTemplate, setAgents, setStepperStep],
  );

  return {
    handleSelectAgent,
    handleCreateFromModal,
    handleRemoveAgent,
    handleConfirmRemove,
    updateAgent,
    handleSave,
    handleConfirmReset,
    handleUpdateInstructions,
    handleGenerateForTab,
    applyTemplate,
  };
}
