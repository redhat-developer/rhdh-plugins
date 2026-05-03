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
import { useCallback, useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import StepButton from '@mui/material/StepButton';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Paper from '@mui/material/Paper';
import Alert from '@mui/material/Alert';

import { WIZARD_STEPS } from './types';
import { useAgentCreationForm } from './useAgentCreationForm';
import { IdentityStep } from './steps/IdentityStep';
import { InstructionsStep } from './steps/InstructionsStep';
import { ModelStep } from './steps/ModelStep';
import { ToolsStep } from './steps/ToolsStep';
import { ConnectionsStep } from './steps/ConnectionsStep';
import { GuardrailsStep } from './steps/GuardrailsStep';
import { ReviewStep } from './steps/ReviewStep';

interface AgentCreationWizardProps {
  onSave: (
    key: string,
    config: Record<string, unknown>,
  ) => Promise<void>;
  onCancel: () => void;
  fetchModels?: () => Promise<Array<{ id: string; owned_by?: string }>>;
  fetchShields?: () => Promise<
    Array<{ identifier: string; provider_id?: string }>
  >;
  generatePrompt?: (description: string) => Promise<string>;
  existingAgentKeys?: string[];
  availableMcpServers?: Array<{ id: string; name?: string }>;
  availableVectorStores?: Array<{ id: string; name?: string }>;
}

export function AgentCreationWizard({
  onSave,
  onCancel,
  fetchModels,
  fetchShields,
  generatePrompt,
  existingAgentKeys = [],
  availableMcpServers = [],
  availableVectorStores = [],
}: AgentCreationWizardProps) {
  const {
    activeStep,
    formData,
    saving,
    setSaving,
    updateField,
    handleNext,
    handleBack,
    handleStepClick,
    getFieldError,
    isValid,
    buildAgentConfig,
    reset,
  } = useAgentCreationForm();

  const [models, setModels] = useState<
    Array<{ id: string; owned_by?: string }>
  >([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [shields, setShields] = useState<
    Array<{ identifier: string; provider_id?: string }>
  >([]);
  const [loadingShields, setLoadingShields] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (fetchModels) {
      setLoadingModels(true);
      fetchModels()
        .then(setModels)
        .catch(() => setModels([]))
        .finally(() => setLoadingModels(false));
    }
  }, [fetchModels]);

  useEffect(() => {
    if (fetchShields) {
      setLoadingShields(true);
      fetchShields()
        .then(setShields)
        .catch(() => setShields([]))
        .finally(() => setLoadingShields(false));
    }
  }, [fetchShields]);

  const handleCreate = useCallback(async () => {
    if (!isValid()) return;
    setSaving(true);
    setSaveError(null);
    try {
      const config = buildAgentConfig();
      await onSave(formData.key, config);
      reset();
    } catch (err) {
      setSaveError(
        err instanceof Error ? err.message : 'Failed to create agent',
      );
    } finally {
      setSaving(false);
    }
  }, [isValid, buildAgentConfig, formData.key, onSave, reset, setSaving]);

  const isLastStep = activeStep === WIZARD_STEPS.length - 1;

  const renderStep = () => {
    switch (activeStep) {
      case 0:
        return (
          <IdentityStep
            formData={formData}
            updateField={updateField}
            getFieldError={getFieldError}
          />
        );
      case 1:
        return (
          <InstructionsStep
            formData={formData}
            updateField={updateField}
            getFieldError={getFieldError}
            onGeneratePrompt={generatePrompt}
          />
        );
      case 2:
        return (
          <ModelStep
            formData={formData}
            updateField={updateField}
            getFieldError={getFieldError}
            availableModels={models}
            loadingModels={loadingModels}
          />
        );
      case 3:
        return (
          <ToolsStep
            formData={formData}
            updateField={updateField}
            availableMcpServers={availableMcpServers}
            availableVectorStores={availableVectorStores}
          />
        );
      case 4:
        return (
          <ConnectionsStep
            formData={formData}
            updateField={updateField}
            existingAgentKeys={existingAgentKeys}
          />
        );
      case 5:
        return (
          <GuardrailsStep
            formData={formData}
            updateField={updateField}
            availableShields={shields}
            loadingShields={loadingShields}
          />
        );
      case 6:
        return <ReviewStep formData={formData} />;
      default:
        return null;
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Stepper activeStep={activeStep} nonLinear>
          {WIZARD_STEPS.map((step, index) => (
            <Step key={step.key} completed={index < activeStep}>
              <StepButton onClick={() => handleStepClick(index)}>
                <StepLabel>{step.label}</StepLabel>
              </StepButton>
            </Step>
          ))}
        </Stepper>
      </Box>

      <Box
        sx={{
          flex: 1,
          overflow: 'auto',
          p: 3,
        }}
      >
        <Paper
          elevation={0}
          sx={{
            p: 3,
            maxWidth: 700,
            mx: 'auto',
          }}
        >
          {renderStep()}
        </Paper>
      </Box>

      {saveError && (
        <Alert
          severity="error"
          onClose={() => setSaveError(null)}
          sx={{ mx: 3, mb: 1 }}
        >
          {saveError}
        </Alert>
      )}

      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          p: 2,
          borderTop: 1,
          borderColor: 'divider',
        }}
      >
        <Button onClick={onCancel} color="inherit">
          Cancel
        </Button>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            onClick={handleBack}
            disabled={activeStep === 0}
          >
            Back
          </Button>
          {isLastStep ? (
            <Button
              variant="contained"
              onClick={handleCreate}
              disabled={saving || !isValid()}
              startIcon={saving ? <CircularProgress size={16} /> : undefined}
            >
              {saving ? 'Creating...' : 'Create Agent'}
            </Button>
          ) : (
            <Button variant="contained" onClick={handleNext}>
              Next
            </Button>
          )}
        </Box>
      </Box>
    </Box>
  );
}
