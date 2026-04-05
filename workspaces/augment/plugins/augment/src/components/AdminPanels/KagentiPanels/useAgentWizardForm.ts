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

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useApi } from '@backstage/core-plugin-api';
import type { KagentiBuildStrategy } from '@red-hat-developer-hub/backstage-plugin-augment-common';
import type { SelectChangeEvent } from '@mui/material/Select';
import { augmentApiRef } from '../../../api';
import { getErrorMessage } from '../../../utils';
import type {
  BuildArgRow,
  DeploymentMethod,
  EnvRow,
  EnvSource,
  FormState,
  PortProtocol,
  ServicePortRow,
  WorkloadType,
} from './agentWizardTypes';
import { isValidDns1123, STEPS } from './agentWizardTypes';
import {
  buildRequest,
  getDuplicateEnvNames,
  nextRowId,
  parsePositivePort,
} from './agentWizardUtils';

export interface UseAgentWizardFormReturn {
  // Wizard chrome
  activeStep: number;
  submitting: boolean;
  submitError: string | null;
  setSubmitError: (v: string | null) => void;
  successOpen: boolean;
  setSuccessOpen: (v: boolean) => void;
  handleNext: () => void;
  handleBack: () => void;
  handleSubmit: () => Promise<void>;

  // Step 0 — Basics
  name: string;
  setName: (v: string) => void;
  namespace: string;
  setNamespace: (v: string) => void;
  protocol: string;
  setProtocol: (v: string) => void;
  framework: string;
  setFramework: (v: string) => void;
  availableNamespaces: string[];
  nameError: string | undefined;

  // Step 1 — Deployment
  deploymentMethod: DeploymentMethod;
  setDeploymentMethod: (v: DeploymentMethod) => void;
  containerImage: string;
  setContainerImage: (v: string) => void;
  imagePullSecret: string;
  setImagePullSecret: (v: string) => void;
  gitUrl: string;
  setGitUrl: (v: string) => void;
  gitBranch: string;
  setGitBranch: (v: string) => void;
  gitPath: string;
  setGitPath: (v: string) => void;
  registryUrl: string;
  setRegistryUrl: (v: string) => void;
  registrySecret: string;
  setRegistrySecret: (v: string) => void;
  imageTag: string;
  setImageTag: (v: string) => void;
  buildStrategy: string;
  setBuildStrategy: (v: string) => void;
  buildStrategies: KagentiBuildStrategy[];
  buildStrategyError: string | null;
  startCommand: string;
  setStartCommand: (v: string) => void;
  dockerfile: string;
  setDockerfile: (v: string) => void;
  buildArgRows: BuildArgRow[];
  addBuildArgRow: () => void;
  updateBuildArgRow: (id: number, value: string) => void;
  removeBuildArgRow: (id: number) => void;
  buildTimeout: string;
  setBuildTimeout: (v: string) => void;

  // Step 2 — Runtime
  workloadType: WorkloadType;
  setWorkloadType: (v: WorkloadType) => void;
  envRows: EnvRow[];
  addEnvRow: () => void;
  updateEnvRow: (id: number, patch: Partial<EnvRow>) => void;
  removeEnvRow: (id: number) => void;
  portRows: ServicePortRow[];
  addPortRow: () => void;
  updatePortRow: (id: number, patch: Partial<ServicePortRow>) => void;
  removePortRow: (id: number) => void;
  handlePortProtocol: (id: number, e: SelectChangeEvent<PortProtocol>) => void;
  createHttpRoute: boolean;
  setCreateHttpRoute: (v: boolean) => void;
  authBridgeEnabled: boolean;
  setAuthBridgeEnabled: (v: boolean) => void;
  spireEnabled: boolean;
  setSpireEnabled: (v: boolean) => void;
  duplicateEnvNames: Set<string>;
  portErrors: Map<number, string>;
}

export function useAgentWizardForm(
  open: boolean,
  namespaceProp: string | undefined,
  onClose: () => void,
  onCreated: () => void,
): UseAgentWizardFormReturn {
  const api = useApi(augmentApiRef);
  const rowIdRef = useRef(0);
  const wasOpenRef = useRef(false);

  const [activeStep, setActiveStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successOpen, setSuccessOpen] = useState(false);

  // Step 0
  const [name, setName] = useState('');
  const [namespace, setNamespace] = useState(namespaceProp ?? '');
  const [protocol, setProtocol] = useState('a2a');
  const [framework, setFramework] = useState('');
  const [availableNamespaces, setAvailableNamespaces] = useState<string[]>([]);

  // Step 1
  const [deploymentMethod, setDeploymentMethod] =
    useState<DeploymentMethod>('image');
  const [containerImage, setContainerImage] = useState('');
  const [imagePullSecret, setImagePullSecret] = useState('');
  const [gitUrl, setGitUrl] = useState('');
  const [gitBranch, setGitBranch] = useState('main');
  const [gitPath, setGitPath] = useState('.');
  const [registryUrl, setRegistryUrl] = useState('');
  const [registrySecret, setRegistrySecret] = useState('');
  const [imageTag, setImageTag] = useState('');
  const [buildStrategy, setBuildStrategy] = useState('');
  const [buildStrategies, setBuildStrategies] = useState<
    KagentiBuildStrategy[]
  >([]);
  const [buildStrategyError, setBuildStrategyError] = useState<string | null>(
    null,
  );
  const [startCommand, setStartCommand] = useState('');
  const [dockerfile, setDockerfile] = useState('Dockerfile');
  const [buildArgRows, setBuildArgRows] = useState<BuildArgRow[]>([]);
  const [buildTimeout, setBuildTimeout] = useState('15m');

  // Step 2
  const [workloadType, setWorkloadType] = useState<WorkloadType>('deployment');
  const [envRows, setEnvRows] = useState<EnvRow[]>([]);
  const [portRows, setPortRows] = useState<ServicePortRow[]>([]);
  const [createHttpRoute, setCreateHttpRoute] = useState(false);
  const [authBridgeEnabled, setAuthBridgeEnabled] = useState(true);
  const [spireEnabled, setSpireEnabled] = useState(false);

  // ---------------------------------------------------------------------------

  const resetForm = useCallback(() => {
    rowIdRef.current = 0;
    setActiveStep(0);
    setSubmitError(null);
    setName('');
    setNamespace(namespaceProp ?? '');
    setProtocol('a2a');
    setFramework('');
    setDeploymentMethod('image');
    setContainerImage('');
    setImagePullSecret('');
    setGitUrl('');
    setGitBranch('main');
    setGitPath('.');
    setRegistryUrl('');
    setRegistrySecret('');
    setImageTag('');
    setBuildStrategy('');
    setBuildStrategyError(null);
    setStartCommand('');
    setDockerfile('Dockerfile');
    setBuildArgRows([]);
    setBuildTimeout('15m');
    setWorkloadType('deployment');
    setEnvRows([]);
    setPortRows([]);
    setCreateHttpRoute(false);
    setAuthBridgeEnabled(true);
    setSpireEnabled(false);
  }, [namespaceProp]);

  useEffect(() => {
    if (open && !wasOpenRef.current) {
      resetForm();
      api
        .listKagentiBuildStrategies()
        .then(r => {
          setBuildStrategies(r.strategies ?? []);
          setBuildStrategyError(null);
        })
        .catch(() => {
          setBuildStrategies([]);
          setBuildStrategyError('Failed to load build strategies.');
        });
      api
        .listKagentiNamespaces()
        .then(r => setAvailableNamespaces(r.namespaces ?? []))
        .catch(() => setAvailableNamespaces([]));
    }
    wasOpenRef.current = open;
  }, [open, resetForm, api]);

  useEffect(() => {
    setNamespace(n => namespaceProp ?? n);
  }, [namespaceProp]);

  // ---------------------------------------------------------------------------
  // Derived / computed
  // ---------------------------------------------------------------------------

  const formState = useMemo(
    (): FormState => ({
      name,
      namespace,
      protocol,
      framework,
      deploymentMethod,
      containerImage,
      imagePullSecret,
      gitUrl,
      gitBranch,
      gitPath,
      registryUrl,
      registrySecret,
      imageTag,
      buildStrategy,
      startCommand,
      dockerfile,
      buildArgRows,
      buildTimeout,
      workloadType,
      envRows,
      portRows,
      createHttpRoute,
      authBridgeEnabled,
      spireEnabled,
    }),
    [
      name,
      namespace,
      protocol,
      framework,
      deploymentMethod,
      containerImage,
      imagePullSecret,
      gitUrl,
      gitBranch,
      gitPath,
      registryUrl,
      registrySecret,
      imageTag,
      buildStrategy,
      startCommand,
      dockerfile,
      buildArgRows,
      buildTimeout,
      workloadType,
      envRows,
      portRows,
      createHttpRoute,
      authBridgeEnabled,
      spireEnabled,
    ],
  );

  const nameError = useMemo((): string | undefined => {
    const trimmed = name.trim();
    if (!trimmed) return undefined;
    if (!isValidDns1123(trimmed)) {
      return 'Lowercase alphanumeric and hyphens only. Must start/end with alphanumeric (max 63 chars).';
    }
    return undefined;
  }, [name]);

  const duplicateEnvNames = useMemo(
    () => getDuplicateEnvNames(envRows),
    [envRows],
  );

  const portErrors = useMemo((): Map<number, string> => {
    const errors = new Map<number, string>();
    for (const row of portRows) {
      if (row.port.trim() && parsePositivePort(row.port) === undefined) {
        errors.set(row.id, 'Port must be 1\u201365535');
      }
    }
    return errors;
  }, [portRows]);

  // ---------------------------------------------------------------------------
  // Validation
  // ---------------------------------------------------------------------------

  const validateStep0 = useCallback((): boolean => {
    const trimmedName = name.trim();
    if (!trimmedName || !namespace.trim()) return false;
    if (!isValidDns1123(trimmedName)) return false;
    return true;
  }, [name, namespace]);

  const validateStep1 = useCallback((): boolean => {
    if (deploymentMethod === 'image') return Boolean(containerImage.trim());
    return Boolean(gitUrl.trim());
  }, [deploymentMethod, containerImage, gitUrl]);

  // ---------------------------------------------------------------------------
  // Navigation
  // ---------------------------------------------------------------------------

  const handleNext = useCallback(() => {
    setSubmitError(null);
    if (activeStep === 0 && !validateStep0()) {
      const trimmedName = name.trim();
      if (!trimmedName || !namespace.trim()) {
        setSubmitError('Name and namespace are required.');
      } else {
        setSubmitError('Agent name must be a valid DNS-1123 label.');
      }
      return;
    }
    if (activeStep === 1 && !validateStep1()) {
      setSubmitError(
        deploymentMethod === 'image'
          ? 'Container image is required.'
          : 'Git URL is required for source deployment.',
      );
      return;
    }
    setActiveStep(s => Math.min(s + 1, STEPS.length - 1));
  }, [
    activeStep,
    validateStep0,
    validateStep1,
    deploymentMethod,
    name,
    namespace,
  ]);

  const handleBack = useCallback(() => {
    setSubmitError(null);
    setActiveStep(s => Math.max(s - 1, 0));
  }, []);

  const handleSubmit = useCallback(async () => {
    setSubmitError(null);
    if (!validateStep0()) {
      setSubmitError(
        'Name and namespace are required, and name must be a valid DNS-1123 label.',
      );
      setActiveStep(0);
      return;
    }
    if (!validateStep1()) {
      setSubmitError(
        deploymentMethod === 'image'
          ? 'Container image is required.'
          : 'Git URL is required for source deployment.',
      );
      setActiveStep(1);
      return;
    }
    if (portErrors.size > 0) {
      setSubmitError('Fix invalid service port entries before submitting.');
      return;
    }
    const body = buildRequest(formState);
    setSubmitting(true);
    try {
      await api.createKagentiAgent(body);
      setSuccessOpen(true);
      onCreated();
      onClose();
    } catch (e) {
      setSubmitError(getErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  }, [
    api,
    formState,
    onClose,
    onCreated,
    validateStep0,
    validateStep1,
    deploymentMethod,
    portErrors,
  ]);

  // ---------------------------------------------------------------------------
  // Row CRUD
  // ---------------------------------------------------------------------------

  const addEnvRow = useCallback(() => {
    setEnvRows(rows => [
      ...rows,
      {
        id: nextRowId(rowIdRef),
        name: '',
        value: '',
        source: 'direct' as EnvSource,
        refName: '',
        refKey: '',
      },
    ]);
  }, []);
  const updateEnvRow = useCallback((id: number, patch: Partial<EnvRow>) => {
    setEnvRows(rows => rows.map(r => (r.id === id ? { ...r, ...patch } : r)));
  }, []);
  const removeEnvRow = useCallback((id: number) => {
    setEnvRows(rows => rows.filter(r => r.id !== id));
  }, []);

  const addBuildArgRow = useCallback(() => {
    setBuildArgRows(rows => [...rows, { id: nextRowId(rowIdRef), value: '' }]);
  }, []);
  const updateBuildArgRow = useCallback((id: number, value: string) => {
    setBuildArgRows(rows => rows.map(r => (r.id === id ? { ...r, value } : r)));
  }, []);
  const removeBuildArgRow = useCallback((id: number) => {
    setBuildArgRows(rows => rows.filter(r => r.id !== id));
  }, []);

  const addPortRow = useCallback(() => {
    setPortRows(rows => [
      ...rows,
      {
        id: nextRowId(rowIdRef),
        name: '',
        port: '',
        targetPort: '',
        protocol: 'TCP' as PortProtocol,
      },
    ]);
  }, []);
  const updatePortRow = useCallback(
    (id: number, patch: Partial<ServicePortRow>) => {
      setPortRows(rows =>
        rows.map(r => (r.id === id ? { ...r, ...patch } : r)),
      );
    },
    [],
  );
  const removePortRow = useCallback((id: number) => {
    setPortRows(rows => rows.filter(r => r.id !== id));
  }, []);
  const handlePortProtocol = useCallback(
    (id: number, e: SelectChangeEvent<PortProtocol>) => {
      updatePortRow(id, { protocol: e.target.value as PortProtocol });
    },
    [updatePortRow],
  );

  // ---------------------------------------------------------------------------

  return {
    activeStep,
    submitting,
    submitError,
    setSubmitError,
    successOpen,
    setSuccessOpen,
    handleNext,
    handleBack,
    handleSubmit,

    name,
    setName,
    namespace,
    setNamespace,
    protocol,
    setProtocol,
    framework,
    setFramework,
    availableNamespaces,
    nameError,

    deploymentMethod,
    setDeploymentMethod,
    containerImage,
    setContainerImage,
    imagePullSecret,
    setImagePullSecret,
    gitUrl,
    setGitUrl,
    gitBranch,
    setGitBranch,
    gitPath,
    setGitPath,
    registryUrl,
    setRegistryUrl,
    registrySecret,
    setRegistrySecret,
    imageTag,
    setImageTag,
    buildStrategy,
    setBuildStrategy,
    buildStrategies,
    buildStrategyError,
    startCommand,
    setStartCommand,
    dockerfile,
    setDockerfile,
    buildArgRows,
    addBuildArgRow,
    updateBuildArgRow,
    removeBuildArgRow,
    buildTimeout,
    setBuildTimeout,

    workloadType,
    setWorkloadType,
    envRows,
    addEnvRow,
    updateEnvRow,
    removeEnvRow,
    portRows,
    addPortRow,
    updatePortRow,
    removePortRow,
    handlePortProtocol,
    createHttpRoute,
    setCreateHttpRoute,
    authBridgeEnabled,
    setAuthBridgeEnabled,
    spireEnabled,
    setSpireEnabled,
    duplicateEnvNames,
    portErrors,
  };
}
