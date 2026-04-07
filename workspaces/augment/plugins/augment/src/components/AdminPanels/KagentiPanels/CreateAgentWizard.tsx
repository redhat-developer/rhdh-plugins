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

import { useCallback, useMemo, useId } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Snackbar from '@mui/material/Snackbar';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import Stepper from '@mui/material/Stepper';
import BuildIcon from '@mui/icons-material/Build';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import SettingsIcon from '@mui/icons-material/Settings';
import TuneIcon from '@mui/icons-material/Tune';
import type { CreateAgentWizardProps } from './agentWizardTypes';
import { FORM_STEPS, BUILD_STEP } from './agentWizardTypes';
import { useAgentWizardForm } from './useAgentWizardForm';
import { AgentWizardBasicsStep } from './AgentWizardBasicsStep';
import { AgentWizardDeployStep } from './AgentWizardDeployStep';
import { AgentWizardRuntimeStep } from './AgentWizardRuntimeStep';
import { AgentWizardBuildStep } from './AgentWizardBuildStep';

export type { CreateAgentWizardProps } from './agentWizardTypes';

const STEP_ICONS: Record<string, React.ReactElement> = {
  Basics: <SettingsIcon />,
  Deployment: <CloudUploadIcon />,
  Runtime: <TuneIcon />,
  [BUILD_STEP]: <BuildIcon />,
};

export function CreateAgentWizard({
  open,
  namespace: namespaceProp,
  onClose,
  onCreated,
}: CreateAgentWizardProps) {
  const titleId = useId();
  const form = useAgentWizardForm(open, namespaceProp, onClose, onCreated);

  const isSourceDeploy = form.deploymentMethod === 'source';
  const isBuildStep = form.activeStep === FORM_STEPS.length;
  const buildActive =
    form.buildProgress.phase !== 'idle' &&
    form.buildProgress.phase !== 'submitting';

  const allSteps = useMemo((): string[] => {
    const base: string[] = [...FORM_STEPS];
    if (isBuildStep) {
      base.push(BUILD_STEP);
    }
    return base;
  }, [isBuildStep]);

  const { handleCloseBuild, submitting } = form;
  const handleDialogClose = useCallback(
    (_: object, reason: 'backdropClick' | 'escapeKeyDown') => {
      if (submitting) return;
      if (reason === 'backdropClick' || reason === 'escapeKeyDown') {
        if (buildActive) {
          handleCloseBuild();
        } else {
          onClose();
        }
      }
    },
    [onClose, submitting, buildActive, handleCloseBuild],
  );

  const submitLabel = isSourceDeploy ? 'Start Build' : 'Create';
  const submittingLabel = isSourceDeploy ? 'Starting…' : 'Creating…';

  return (
    <>
      <Dialog
        open={open}
        onClose={handleDialogClose}
        maxWidth="md"
        fullWidth
        aria-labelledby={titleId}
      >
        <DialogTitle id={titleId}>Create Agent</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Stepper activeStep={form.activeStep} sx={{ mb: 3, mt: 1 }}>
            {allSteps.map(label => (
              <Step key={label}>
                <StepLabel
                  StepIconProps={{
                    icon: STEP_ICONS[label] ?? undefined,
                  }}
                >
                  {label}
                </StepLabel>
              </Step>
            ))}
          </Stepper>

          {form.submitError && !isBuildStep && (
            <Alert
              severity="error"
              sx={{ mb: 2 }}
              onClose={() => form.setSubmitError(null)}
            >
              {form.submitError}
            </Alert>
          )}

          {form.activeStep === 0 && (
            <AgentWizardBasicsStep
              name={form.name}
              setName={form.setName}
              namespace={form.namespace}
              setNamespace={form.setNamespace}
              protocol={form.protocol}
              setProtocol={form.setProtocol}
              framework={form.framework}
              setFramework={form.setFramework}
              nameError={form.nameError}
              availableNamespaces={form.availableNamespaces}
            />
          )}

          {form.activeStep === 1 && (
            <AgentWizardDeployStep
              deploymentMethod={form.deploymentMethod}
              setDeploymentMethod={form.setDeploymentMethod}
              containerImage={form.containerImage}
              setContainerImage={form.setContainerImage}
              imagePullSecret={form.imagePullSecret}
              setImagePullSecret={form.setImagePullSecret}
              gitUrl={form.gitUrl}
              setGitUrl={form.setGitUrl}
              gitBranch={form.gitBranch}
              setGitBranch={form.setGitBranch}
              gitPath={form.gitPath}
              setGitPath={form.setGitPath}
              registryUrl={form.registryUrl}
              setRegistryUrl={form.setRegistryUrl}
              registrySecret={form.registrySecret}
              setRegistrySecret={form.setRegistrySecret}
              imageTag={form.imageTag}
              setImageTag={form.setImageTag}
              startCommand={form.startCommand}
              setStartCommand={form.setStartCommand}
              buildStrategy={form.buildStrategy}
              setBuildStrategy={form.setBuildStrategy}
              buildStrategies={form.buildStrategies}
              buildStrategyError={form.buildStrategyError}
              dockerfile={form.dockerfile}
              setDockerfile={form.setDockerfile}
              buildTimeout={form.buildTimeout}
              setBuildTimeout={form.setBuildTimeout}
              buildArgRows={form.buildArgRows}
              addBuildArgRow={form.addBuildArgRow}
              updateBuildArgRow={form.updateBuildArgRow}
              removeBuildArgRow={form.removeBuildArgRow}
            />
          )}

          {form.activeStep === 2 && (
            <AgentWizardRuntimeStep
              workloadType={form.workloadType}
              setWorkloadType={form.setWorkloadType}
              envRows={form.envRows}
              addEnvRow={form.addEnvRow}
              updateEnvRow={form.updateEnvRow}
              removeEnvRow={form.removeEnvRow}
              duplicateEnvNames={form.duplicateEnvNames}
              portRows={form.portRows}
              addPortRow={form.addPortRow}
              updatePortRow={form.updatePortRow}
              removePortRow={form.removePortRow}
              handlePortProtocol={form.handlePortProtocol}
              portErrors={form.portErrors}
              createHttpRoute={form.createHttpRoute}
              setCreateHttpRoute={form.setCreateHttpRoute}
              authBridgeEnabled={form.authBridgeEnabled}
              setAuthBridgeEnabled={form.setAuthBridgeEnabled}
              spireEnabled={form.spireEnabled}
              setSpireEnabled={form.setSpireEnabled}
            />
          )}

          {isBuildStep && (
            <AgentWizardBuildStep
              progress={form.buildProgress}
              onRetry={form.handleRetryBuild}
              onClose={form.handleCloseBuild}
            />
          )}
        </DialogContent>

        {!isBuildStep && (
          <DialogActions sx={{ px: 3, pb: 2, justifyContent: 'space-between' }}>
            <Button
              onClick={onClose}
              disabled={form.submitting}
              sx={{ textTransform: 'none' }}
            >
              Cancel
            </Button>
            <Box sx={{ display: 'flex', gap: 1 }}>
              {form.activeStep > 0 && (
                <Button
                  onClick={form.handleBack}
                  disabled={form.submitting}
                  sx={{ textTransform: 'none' }}
                >
                  Back
                </Button>
              )}
              {form.activeStep < FORM_STEPS.length - 1 ? (
                <Button
                  variant="contained"
                  onClick={form.handleNext}
                  disabled={form.submitting}
                  sx={{ textTransform: 'none' }}
                >
                  Next
                </Button>
              ) : (
                <Button
                  variant="contained"
                  onClick={form.handleSubmit}
                  disabled={form.submitting}
                  startIcon={
                    form.submitting ? (
                      <CircularProgress size={18} color="inherit" />
                    ) : undefined
                  }
                  sx={{ textTransform: 'none' }}
                >
                  {form.submitting ? submittingLabel : submitLabel}
                </Button>
              )}
            </Box>
          </DialogActions>
        )}
      </Dialog>

      <Snackbar
        open={form.successOpen}
        autoHideDuration={4000}
        onClose={() => form.setSuccessOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => form.setSuccessOpen(false)}
          severity="success"
          variant="filled"
          sx={{ width: '100%' }}
        >
          Agent created successfully.
        </Alert>
      </Snackbar>
    </>
  );
}
