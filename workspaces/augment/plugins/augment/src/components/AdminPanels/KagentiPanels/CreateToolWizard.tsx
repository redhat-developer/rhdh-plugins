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

import { useEffect, useMemo } from 'react';
import BuildIcon from '@mui/icons-material/Build';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import SettingsIcon from '@mui/icons-material/Settings';
import TuneIcon from '@mui/icons-material/Tune';
import type { CreateToolWizardProps } from './toolWizardTypes';
import { TOOL_STEPS, TOOL_BUILD_STEP } from './toolWizardTypes';
import { useToolWizardForm } from './useToolWizardForm';
import { ToolWizardBasicsStep } from './ToolWizardBasicsStep';
import { ToolWizardDeployStep } from './ToolWizardDeployStep';
import { ToolWizardRuntimeStep } from './ToolWizardRuntimeStep';
import { AgentWizardBuildStep } from './AgentWizardBuildStep';
import { WizardShell } from './WizardShell';

export type { CreateToolWizardProps } from './toolWizardTypes';

const STEP_ICONS: Record<string, React.ReactElement> = {
  Basics: <SettingsIcon />,
  Deployment: <CloudUploadIcon />,
  Runtime: <TuneIcon />,
  [TOOL_BUILD_STEP]: <BuildIcon />,
};

const STEP_DESCRIPTIONS: Record<string, string> = {
  Basics: 'Name your tool, set its protocol, and choose a runtime framework.',
  Deployment:
    'Choose how to deploy — from a pre-built container image or built from source code.',
  Runtime:
    'Configure the workload type, environment, ports, and security settings.',
  [TOOL_BUILD_STEP]:
    'Monitor the build progress and deployment status of your tool.',
};

export function CreateToolWizard({
  open,
  namespace: namespaceProp,
  onClose,
  onCreated,
  onStepControl,
}: CreateToolWizardProps) {
  const form = useToolWizardForm(open, namespaceProp, onClose, onCreated);

  useEffect(() => {
    if (open && onStepControl) {
      onStepControl(form.setActiveStep);
    }
  }, [open, onStepControl, form.setActiveStep]);

  const isSourceDeploy = form.deploymentMethod === 'source';
  const isBuildStep = form.activeStep === TOOL_STEPS.length;
  const buildActive =
    form.buildProgress.phase !== 'idle' &&
    form.buildProgress.phase !== 'submitting';

  const allSteps = useMemo((): string[] => {
    const base: string[] = [...TOOL_STEPS];
    if (isBuildStep) {
      base.push(TOOL_BUILD_STEP);
    }
    return base;
  }, [isBuildStep]);

  return (
    <WizardShell
      open={open}
      title="Create Tool"
      subtitle="Deploy an MCP tool to your cluster"
      steps={allSteps}
      activeStep={form.activeStep}
      formStepCount={TOOL_STEPS.length}
      stepIcons={STEP_ICONS}
      stepDescriptions={STEP_DESCRIPTIONS}
      isBuildStep={isBuildStep}
      buildActive={buildActive}
      submitting={form.submitting}
      submitError={form.submitError}
      onSubmitErrorClose={() => form.setSubmitError(null)}
      submitLabel={isSourceDeploy ? 'Start Build' : 'Create'}
      submittingLabel={isSourceDeploy ? 'Starting…' : 'Creating…'}
      successOpen={form.successOpen}
      successMessage="Tool created successfully."
      onSuccessClose={() => form.setSuccessOpen(false)}
      onClose={onClose}
      onCloseBuild={form.handleCloseBuild}
      onBack={form.handleBack}
      onNext={form.handleNext}
      onSubmit={form.handleSubmit}
    >
      {form.activeStep === 0 && (
        <ToolWizardBasicsStep
          name={form.name}
          setName={form.setName}
          namespace={form.namespace}
          setNamespace={form.setNamespace}
          description={form.description}
          setDescription={form.setDescription}
          protocol={form.protocol}
          setProtocol={form.setProtocol}
          framework={form.framework}
          setFramework={form.setFramework}
          nameError={form.nameError}
          nameWarning={form.nameWarning}
          availableNamespaces={form.availableNamespaces}
        />
      )}

      {form.activeStep === 1 && (
        <ToolWizardDeployStep
          deploymentMethod={form.deploymentMethod}
          setDeploymentMethod={form.setDeploymentMethod}
          containerImage={form.containerImage}
          setContainerImage={form.setContainerImage}
          imagePullSecret={form.imagePullSecret}
          setImagePullSecret={form.setImagePullSecret}
          gitUrl={form.gitUrl}
          setGitUrl={form.setGitUrl}
          gitRevision={form.gitRevision}
          setGitRevision={form.setGitRevision}
          contextDir={form.contextDir}
          setContextDir={form.setContextDir}
          registryUrl={form.registryUrl}
          setRegistryUrl={form.setRegistryUrl}
          registrySecret={form.registrySecret}
          setRegistrySecret={form.setRegistrySecret}
          imageTag={form.imageTag}
          setImageTag={form.setImageTag}
          buildStrategy={form.buildStrategy}
          setBuildStrategy={form.setBuildStrategy}
          buildStrategies={form.buildStrategies}
          buildStrategyError={form.buildStrategyError}
          dockerfile={form.dockerfile}
          setDockerfile={form.setDockerfile}
          buildArgRows={form.buildArgRows}
          addBuildArgRow={form.addBuildArgRow}
          updateBuildArgRow={form.updateBuildArgRow}
          removeBuildArgRow={form.removeBuildArgRow}
          buildTimeout={form.buildTimeout}
          setBuildTimeout={form.setBuildTimeout}
        />
      )}

      {form.activeStep === 2 && (
        <ToolWizardRuntimeStep
          workloadType={form.workloadType}
          setWorkloadType={form.setWorkloadType}
          persistentStorageEnabled={form.persistentStorageEnabled}
          setPersistentStorageEnabled={form.setPersistentStorageEnabled}
          persistentStorageSize={form.persistentStorageSize}
          setPersistentStorageSize={form.setPersistentStorageSize}
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
          resourceLabel="tool"
        />
      )}
    </WizardShell>
  );
}
