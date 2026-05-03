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
import { useState, useMemo, useEffect, useRef } from 'react';
import { useEffectiveConfig } from '../../../hooks/useEffectiveConfig';
import {
  useAdminConfig,
  useModels,
  useGeneratePrompt,
  useVectorStores,
} from '../../../hooks';
import {
  type AgentFormData,
  createDefaultAgent,
  agentFromConfig,
  generateUniqueAgentKey,
} from './agentValidation';
import { useAgentDerived } from './useAgentDerived';
import { useAgentActions } from './useAgentActions';

const DEFAULT_MAX_TURNS = 10;
const MIN_TURNS = 1;
const MAX_TURNS = 50;

export { MIN_TURNS, MAX_TURNS };

export interface UseAgentEditorProps {
  focusAgentKey?: string;
  autoCreate?: boolean;
  createType?: 'single' | 'multi' | null;
  onSaved?: () => void;
  onDirtyChange?: (dirty: boolean) => void;
}

export function useAgentEditor({
  focusAgentKey,
  autoCreate,
  createType,
  onSaved,
  onDirtyChange,
}: UseAgentEditorProps) {
  // ── External hooks ────────────────────────────────────────────────────

  const {
    config: effectiveConfig,
    loading: configLoading,
    error: configError,
    refresh: refreshConfig,
  } = useEffectiveConfig();

  const {
    source: agentsSource,
    saving: agentsSaving,
    error: agentsError,
    save: saveAgents,
    reset: resetAgents,
  } = useAdminConfig('agents');
  const { save: saveDefaultAgent } = useAdminConfig('defaultAgent');
  const { save: saveMaxTurns } = useAdminConfig('maxAgentTurns');
  const { models, loading: modelsLoading, refresh: refreshModels } = useModels();
  const modelOptions = useMemo(
    () => models.map(m => m.id).filter(Boolean) as string[],
    [models],
  );
  const { generate, generating, error: generateError } = useGeneratePrompt();
  const { stores: vectorStores } = useVectorStores();

  // ── State ─────────────────────────────────────────────────────────────

  const [agents, setAgents] = useState<Record<string, AgentFormData>>({});
  const [selectedAgentKey, setSelectedAgentKey] = useState<string | null>(null);
  const [defaultAgentKey, setDefaultAgentKey] = useState('');
  const [maxTurns, setMaxTurns] = useState(DEFAULT_MAX_TURNS);

  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saving, setSaving] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [generateToast, setGenerateToast] = useState<string | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [confirmRemoveKey, setConfirmRemoveKey] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('blank');
  const [stepperStep, setStepperStep] = useState(0);

  const saveTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const initialSnapshotRef = useRef<string>('');

  const isSingleAgentMode = createType === 'single' && autoCreate;

  // ── Effects ───────────────────────────────────────────────────────────

  useEffect(
    () => () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); },
    [],
  );

  useEffect(() => {
    if (!effectiveConfig || initialized) return;
    if (isSingleAgentMode) {
      setAgents({});
      setDefaultAgentKey('');
    } else {
      const rawAgents =
        (effectiveConfig.agents as Record<string, Record<string, unknown>>) || {};
      const parsed: Record<string, AgentFormData> = {};
      for (const [key, cfg] of Object.entries(rawAgents))
        parsed[key] = agentFromConfig(cfg);
      setAgents(parsed);
      setDefaultAgentKey((effectiveConfig.defaultAgent as string) || '');
    }
    setMaxTurns((effectiveConfig.maxAgentTurns as number) || DEFAULT_MAX_TURNS);
    setInitialized(true);
  }, [effectiveConfig, initialized, isSingleAgentMode]);

  const focusAppliedRef = useRef(false);
  useEffect(() => { focusAppliedRef.current = false; }, [focusAgentKey]);
  useEffect(() => {
    if (!initialized) return;
    const keys = Object.keys(agents);
    if (keys.length === 0) { setSelectedAgentKey(null); return; }
    if (focusAgentKey && agents[focusAgentKey] && !focusAppliedRef.current) {
      focusAppliedRef.current = true;
      setSelectedAgentKey(focusAgentKey);
      return;
    }
    setSelectedAgentKey(prev => (!prev || !agents[prev] ? keys[0] : prev));
  }, [initialized, agents, focusAgentKey]);

  const autoCreateAppliedRef = useRef(false);
  useEffect(() => {
    if (autoCreate && initialized && !autoCreateAppliedRef.current) {
      autoCreateAppliedRef.current = true;
      if (isSingleAgentMode) {
        const existingKeys = effectiveConfig
          ? Object.keys((effectiveConfig.agents as Record<string, unknown>) || {})
          : [];
        const key = generateUniqueAgentKey(existingKeys);
        const agent = createDefaultAgent();
        agent.name = '';
        setAgents({ [key]: agent });
        setDefaultAgentKey(key);
        setSelectedAgentKey(key);
        setActiveTab(0);
        setStepperStep(0);
        initialSnapshotRef.current = JSON.stringify({ [key]: agent });
      } else {
        setCreateModalOpen(true);
      }
    }
  }, [autoCreate, initialized, isSingleAgentMode, effectiveConfig]);

  useEffect(() => {
    if (!initialized || initialSnapshotRef.current !== '') return;
    initialSnapshotRef.current = JSON.stringify(agents);
  }, [initialized, agents]);

  const isDirty = useMemo(() => {
    if (!initialized || initialSnapshotRef.current === '') return false;
    return JSON.stringify(agents) !== initialSnapshotRef.current;
  }, [agents, initialized]);

  useEffect(() => { onDirtyChange?.(isDirty); }, [isDirty, onDirtyChange]);

  // ── Derived ───────────────────────────────────────────────────────────

  const availableMcpServers = useMemo(() => {
    if (!effectiveConfig) return [];
    const servers = (effectiveConfig.mcpServers as Array<{ id: string; name: string }>) || [];
    return servers.map(s => ({ id: s.id, name: s.name || s.id }));
  }, [effectiveConfig]);

  const availableMcpServerIds = useMemo(
    () => availableMcpServers.map(s => s.id),
    [availableMcpServers],
  );

  const derived = useAgentDerived(agents, selectedAgentKey, defaultAgentKey, availableMcpServerIds);

  const effectiveModel = derived.selectedAgent?.model || (effectiveConfig?.model as string) || '';

  // ── Actions ───────────────────────────────────────────────────────────

  const actions = useAgentActions({
    agents,
    agentKeys: derived.agentKeys,
    defaultAgentKey,
    maxTurns,
    selectedAgentKey,
    selectedAgent: derived.selectedAgent,
    availableMcpServers,
    isSingleAgentMode,
    effectiveConfig: effectiveConfig as Record<string, unknown> | null,
    validationErrors: derived.validation.errors,
    saveDeps: { saveAgents, saveDefaultAgent, saveMaxTurns },
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
  });

  return {
    configLoading,
    configError,
    agents,
    ...derived,
    selectedAgentKey,
    availableMcpServers,
    defaultAgentKey,
    setDefaultAgentKey,
    maxTurns,
    setMaxTurns,
    isDirty,
    isSingleAgentMode,
    saving,
    saveSuccess,
    saveError,
    setSaveError,
    agentsSource,
    agentsSaving,
    agentsError,
    resetting,
    activeTab,
    setActiveTab,
    stepperStep,
    setStepperStep,
    selectedTemplate,
    showPreview,
    setShowPreview,
    createModalOpen,
    setCreateModalOpen,
    confirmRemoveKey,
    setConfirmRemoveKey,
    confirmReset,
    setConfirmReset,
    generateToast,
    setGenerateToast,
    modelOptions,
    modelsLoading,
    refreshModels,
    generating,
    generateError,
    vectorStores,
    effectiveModel,
    onSaved,
    ...actions,
  };
}

export type AgentEditorState = ReturnType<typeof useAgentEditor>;
