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
import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import StepButton from '@mui/material/StepButton';
import { useTheme, alpha } from '@mui/material/styles';
import {
  SECTION_LABEL_SX,
  HOVER_TRANSITION,
} from '../shared/commandCenterStyles';
import { AGENT_TEMPLATES } from './agentTemplates';
import { InstructionsTab } from './InstructionsTab';
import { CapabilitiesTab } from './CapabilitiesTab';
import { AgentReviewStep } from './AgentReviewStep';
import type { AgentEditorState } from './useAgentEditor';

const LEFT_PANEL_WIDTH = 280;
const RIGHT_MAX_WIDTH = 780;
const SINGLE_STEPS = ['Name', 'Instructions', 'Capabilities', 'Review'];

interface SingleAgentStepperProps {
  editor: AgentEditorState;
}

export const SingleAgentStepper = React.memo(function SingleAgentStepper({
  editor,
}: SingleAgentStepperProps) {
  const theme = useTheme();
  const {
    selectedAgentKey,
    selectedAgent,
    stepperStep,
    setStepperStep,
    selectedTemplate,
    isDirty,
    tabCompletion,
    saveSuccess,
    saving,
    validation,
    agents,
    availableMcpServers,
    modelOptions,
    modelsLoading,
    generating,
    generateError,
    effectiveModel,
    vectorStores,
    handleSave,
    handleUpdateInstructions,
    handleGenerateForTab,
    refreshModels,
    updateAgent,
    applyTemplate,
    onSaved,
  } = editor;

  if (!selectedAgentKey || !selectedAgent) return null;

  const canContinue =
    stepperStep === 0
      ? !!selectedAgent.name.trim()
      : stepperStep === 1
        ? !!selectedAgent.instructions.trim()
        : true;

  const renderStepContent = () => {
    switch (stepperStep) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
              Name Your Agent
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Give your agent a clear, descriptive name so users know what it does.
            </Typography>
            <TextField
              value={selectedAgent.name}
              onChange={e => updateAgent(selectedAgentKey, 'name', e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && selectedAgent.name.trim()) {
                  e.preventDefault();
                  setStepperStep(1);
                }
              }}
              label="Agent Name"
              placeholder="e.g. Code Review Assistant"
              fullWidth
              autoFocus
              size="small"
              error={selectedAgent.name.trim() === '' && isDirty}
              helperText={selectedAgent.name.trim() === '' && isDirty ? 'Name is required' : undefined}
              sx={{ mb: 3, maxWidth: 480 }}
            />
            <Typography sx={{ ...SECTION_LABEL_SX, mb: 1.5 }}>
              Start from a template
            </Typography>
            <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
              {AGENT_TEMPLATES.map(tpl => (
                <Box
                  key={tpl.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => applyTemplate(tpl.id)}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); applyTemplate(tpl.id); } }}
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    border: selectedTemplate === tpl.id
                      ? `2px solid ${theme.palette.primary.main}`
                      : `1px solid ${theme.palette.divider}`,
                    bgcolor: selectedTemplate === tpl.id
                      ? alpha(theme.palette.primary.main, 0.04)
                      : 'transparent',
                    cursor: 'pointer',
                    width: 180,
                    transition: HOVER_TRANSITION,
                    '&:hover': {
                      borderColor: theme.palette.primary.main,
                      bgcolor: alpha(theme.palette.primary.main, 0.02),
                    },
                  }}
                >
                  <Box sx={{ color: theme.palette.primary.main, mb: 1 }}>
                    {tpl.icon}
                  </Box>
                  <Typography sx={{ fontWeight: 600, fontSize: '0.85rem', mb: 0.5 }}>
                    {tpl.name}
                  </Typography>
                  <Typography sx={{ fontSize: '0.7rem', color: theme.palette.text.secondary, lineHeight: 1.4 }}>
                    {tpl.description}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        );
      case 1:
        return (
          <Box>
            <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
              Write Instructions
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Define exactly what your agent should do. This is the system prompt sent to the model.
            </Typography>
            <InstructionsTab
              agent={selectedAgent}
              agents={agents}
              availableMcpServers={availableMcpServers}
              modelOptions={modelOptions}
              modelsLoading={modelsLoading}
              effectiveModel={effectiveModel}
              generating={generating}
              generateError={generateError}
              onUpdateInstructions={handleUpdateInstructions}
              onGenerate={handleGenerateForTab}
              onRefreshModels={refreshModels}
            />
          </Box>
        );
      case 2:
        return (
          <CapabilitiesTab
            agent={selectedAgent}
            agentKey={selectedAgentKey}
            modelOptions={modelOptions}
            modelsLoading={modelsLoading}
            availableMcpServers={availableMcpServers}
            vectorStores={vectorStores}
            onUpdateAgent={updateAgent}
            onRefreshModels={refreshModels}
          />
        );
      case 3:
        return (
          <AgentReviewStep
            agent={selectedAgent}
            agentKey={selectedAgentKey}
            validationErrors={validation.errors}
            saving={saving}
            saveSuccess={saveSuccess}
            availableMcpServers={availableMcpServers}
            onSave={handleSave}
            onDone={onSaved}
            onBack={() => setStepperStep(2)}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Box sx={{ flex: 1, display: 'flex', minHeight: 0, overflow: 'hidden' }}>
      <Box
        sx={{
          width: LEFT_PANEL_WIDTH,
          flexShrink: 0,
          borderRight: `1px solid ${theme.palette.divider}`,
          p: 2,
          overflow: 'auto',
        }}
      >
        <Stepper activeStep={stepperStep} orientation="vertical" nonLinear>
          {SINGLE_STEPS.map((label, idx) => {
            let completed = false;
            if (idx === 0) completed = !!selectedAgent.name.trim();
            if (idx === 1) completed = !!selectedAgent.instructions.trim();
            if (idx === 2) completed = !!tabCompletion?.capabilities;
            if (idx === 3) completed = saveSuccess;
            return (
              <Step key={label} completed={completed}>
                <StepButton onClick={() => setStepperStep(idx)}>
                  <StepLabel
                    error={idx === 0 && isDirty && !selectedAgent.name.trim()}
                    sx={{
                      '& .MuiStepLabel-label': {
                        fontSize: '0.8125rem',
                        fontWeight: stepperStep === idx ? 600 : 400,
                      },
                    }}
                  >
                    {label}
                  </StepLabel>
                </StepButton>
              </Step>
            );
          })}
        </Stepper>
      </Box>
      <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
        <Box sx={{ maxWidth: RIGHT_MAX_WIDTH }}>
          {renderStepContent()}
          {stepperStep < 3 && (
            <Box sx={{ display: 'flex', gap: 1, mt: 3 }}>
              {stepperStep > 0 && (
                <Button
                  size="small"
                  onClick={() => setStepperStep(s => s - 1)}
                  sx={{ textTransform: 'none' }}
                >
                  Back
                </Button>
              )}
              <Tooltip
                title={
                  !canContinue
                    ? stepperStep === 0
                      ? 'Enter an agent name to continue'
                      : 'Add instructions to continue'
                    : ''
                }
              >
                <span>
                  <Button
                    variant="contained"
                    size="small"
                    disabled={!canContinue}
                    onClick={() => setStepperStep(s => s + 1)}
                    sx={{ textTransform: 'none' }}
                  >
                    Continue
                  </Button>
                </span>
              </Tooltip>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
});
