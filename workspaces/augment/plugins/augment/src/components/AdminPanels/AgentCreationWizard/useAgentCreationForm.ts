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

import { useCallback, useState } from 'react';
import {
  type AgentWizardFormData,
  type WizardStepKey,
  WIZARD_STEPS,
  createDefaultFormData,
} from './types';
import { validateStep, validateAll, type ValidationError } from './validation';

export function useAgentCreationForm() {
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState<AgentWizardFormData>(
    createDefaultFormData(),
  );
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [saving, setSaving] = useState(false);

  const currentStepKey = WIZARD_STEPS[activeStep].key as WizardStepKey;

  const updateField = useCallback(
    <K extends keyof AgentWizardFormData>(
      field: K,
      value: AgentWizardFormData[K],
    ) => {
      setFormData(prev => ({ ...prev, [field]: value }));
      setErrors(prev => prev.filter(e => e.field !== field));
    },
    [],
  );

  const canAdvance = useCallback((): boolean => {
    const stepErrors = validateStep(currentStepKey, formData);
    setErrors(stepErrors);
    return stepErrors.length === 0;
  }, [currentStepKey, formData]);

  const handleNext = useCallback(() => {
    if (canAdvance() && activeStep < WIZARD_STEPS.length - 1) {
      setActiveStep(prev => prev + 1);
    }
  }, [canAdvance, activeStep]);

  const handleBack = useCallback(() => {
    if (activeStep > 0) {
      setActiveStep(prev => prev - 1);
      setErrors([]);
    }
  }, [activeStep]);

  const handleStepClick = useCallback(
    (stepIndex: number) => {
      if (stepIndex < activeStep) {
        setActiveStep(stepIndex);
        setErrors([]);
      } else if (stepIndex === activeStep + 1) {
        handleNext();
      }
    },
    [activeStep, handleNext],
  );

  const getFieldError = useCallback(
    (field: string): string | undefined => {
      return errors.find(e => e.field === field)?.message;
    },
    [errors],
  );

  const isValid = useCallback((): boolean => {
    return validateAll(formData).length === 0;
  }, [formData]);

  const buildAgentConfig = useCallback((): Record<string, unknown> => {
    return {
      name: formData.name,
      instructions: formData.instructions,
      handoffDescription: formData.handoffDescription || undefined,
      model: formData.model || undefined,
      mcpServers: formData.mcpServers.length > 0 ? formData.mcpServers : undefined,
      handoffs: formData.handoffs.length > 0 ? formData.handoffs : undefined,
      asTools: formData.asTools.length > 0 ? formData.asTools : undefined,
      enableRAG: formData.enableRAG || undefined,
      vectorStoreIds:
        formData.vectorStoreIds.length > 0
          ? formData.vectorStoreIds
          : undefined,
      enableWebSearch: formData.enableWebSearch || undefined,
      enableCodeInterpreter: formData.enableCodeInterpreter || undefined,
      toolChoice:
        formData.toolChoice !== 'auto' ? formData.toolChoice : undefined,
      temperature:
        formData.temperature !== 0.7 ? formData.temperature : undefined,
      maxOutputTokens:
        formData.maxOutputTokens !== 4096
          ? formData.maxOutputTokens
          : undefined,
      reasoning:
        formData.reasoningEffort !== 'medium'
          ? { effort: formData.reasoningEffort }
          : undefined,
      guardrails:
        formData.guardrails.length > 0 ? formData.guardrails : undefined,
      resetToolChoice: formData.resetToolChoice || undefined,
      nestHandoffHistory: formData.nestHandoffHistory || undefined,
    };
  }, [formData]);

  const reset = useCallback(() => {
    setFormData(createDefaultFormData());
    setActiveStep(0);
    setErrors([]);
    setSaving(false);
  }, []);

  return {
    activeStep,
    formData,
    errors,
    saving,
    setSaving,
    currentStepKey,
    updateField,
    handleNext,
    handleBack,
    handleStepClick,
    getFieldError,
    isValid,
    buildAgentConfig,
    reset,
  };
}
