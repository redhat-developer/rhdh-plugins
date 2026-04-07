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
import type { BuildProgress } from './agentWizardTypes';
import type {
  DeploymentMethod,
  EnvRow,
  EnvSource,
  PortProtocol,
  ServicePortRow,
  ToolFormState,
  WorkloadType,
} from './toolWizardTypes';
import { isValidDns1123, TOOL_STEPS } from './toolWizardTypes';
import {
  buildToolRequest,
  getDuplicateEnvNames,
  nextRowId,
  parsePositivePort,
} from './toolWizardUtils';

const BUILD_POLL_INTERVAL_MS = 4000;
const BUILD_TIMEOUT_WARN_MS = 10 * 60 * 1000;
const MAX_CONSECUTIVE_POLL_ERRORS = 5;

export interface UseToolWizardFormReturn {
  activeStep: number;
  submitting: boolean;
  submitError: string | null;
  setSubmitError: (v: string | null) => void;
  successOpen: boolean;
  setSuccessOpen: (v: boolean) => void;
  handleNext: () => void;
  handleBack: () => void;
  handleSubmit: () => Promise<void>;

  buildProgress: BuildProgress;
  handleRetryBuild: () => void;
  handleCloseBuild: () => void;

  name: string;
  setName: (v: string) => void;
  namespace: string;
  setNamespace: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  protocol: string;
  setProtocol: (v: string) => void;
  framework: string;
  setFramework: (v: string) => void;
  availableNamespaces: string[];
  nameError: string | undefined;

  deploymentMethod: DeploymentMethod;
  setDeploymentMethod: (v: DeploymentMethod) => void;
  containerImage: string;
  setContainerImage: (v: string) => void;
  imagePullSecret: string;
  setImagePullSecret: (v: string) => void;
  gitUrl: string;
  setGitUrl: (v: string) => void;
  gitRevision: string;
  setGitRevision: (v: string) => void;
  contextDir: string;
  setContextDir: (v: string) => void;
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
  dockerfile: string;
  setDockerfile: (v: string) => void;
  buildTimeout: string;
  setBuildTimeout: (v: string) => void;

  workloadType: WorkloadType;
  setWorkloadType: (v: WorkloadType) => void;
  persistentStorageEnabled: boolean;
  setPersistentStorageEnabled: (v: boolean) => void;
  persistentStorageSize: string;
  setPersistentStorageSize: (v: string) => void;
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

export function useToolWizardForm(
  open: boolean,
  namespaceProp: string | undefined,
  onClose: () => void,
  onCreated: () => void,
): UseToolWizardFormReturn {
  const api = useApi(augmentApiRef);
  const rowIdRef = useRef(0);
  const wasOpenRef = useRef(false);

  const [activeStep, setActiveStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successOpen, setSuccessOpen] = useState(false);

  const [buildProgress, setBuildProgress] = useState<BuildProgress>({
    phase: 'idle',
    elapsedMs: 0,
    pollErrorCount: 0,
  });
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const elapsedRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollErrorCountRef = useRef(0);
  const buildNameRef = useRef('');
  const buildNsRef = useRef('');

  const [name, setName] = useState('');
  const [namespace, setNamespace] = useState(namespaceProp ?? '');
  const [description, setDescription] = useState('');
  const [protocol, setProtocol] = useState('streamable_http');
  const [framework, setFramework] = useState('Python');
  const [availableNamespaces, setAvailableNamespaces] = useState<string[]>([]);

  const [deploymentMethod, setDeploymentMethod] =
    useState<DeploymentMethod>('image');
  const [containerImage, setContainerImage] = useState('');
  const [imagePullSecret, setImagePullSecret] = useState('');
  const [gitUrl, setGitUrl] = useState('');
  const [gitRevision, setGitRevision] = useState('main');
  const [contextDir, setContextDir] = useState('.');
  const [registryUrl, setRegistryUrl] = useState('');
  const [registrySecret, setRegistrySecret] = useState('');
  const [imageTag, setImageTag] = useState('v0.0.1');
  const [buildStrategy, setBuildStrategy] = useState('');
  const [buildStrategies, setBuildStrategies] = useState<
    KagentiBuildStrategy[]
  >([]);
  const [buildStrategyError, setBuildStrategyError] = useState<string | null>(
    null,
  );
  const [dockerfile, setDockerfile] = useState('Dockerfile');
  const [buildTimeout, setBuildTimeout] = useState('15m');

  const [workloadType, setWorkloadType] = useState<WorkloadType>('deployment');
  const [persistentStorageEnabled, setPersistentStorageEnabled] =
    useState(false);
  const [persistentStorageSize, setPersistentStorageSize] = useState('1Gi');
  const [envRows, setEnvRows] = useState<EnvRow[]>([]);
  const [portRows, setPortRows] = useState<ServicePortRow[]>([]);
  const [createHttpRoute, setCreateHttpRoute] = useState(false);
  const [authBridgeEnabled, setAuthBridgeEnabled] = useState(false);
  const [spireEnabled, setSpireEnabled] = useState(false);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    if (elapsedRef.current) {
      clearInterval(elapsedRef.current);
      elapsedRef.current = null;
    }
  }, []);

  useEffect(() => stopPolling, [stopPolling]);

  const resetForm = useCallback(() => {
    stopPolling();
    rowIdRef.current = 0;
    setActiveStep(0);
    setSubmitError(null);
    setName('');
    setNamespace(namespaceProp ?? '');
    setDescription('');
    setProtocol('streamable_http');
    setFramework('Python');
    setDeploymentMethod('image');
    setContainerImage('');
    setImagePullSecret('');
    setGitUrl('');
    setGitRevision('main');
    setContextDir('.');
    setRegistryUrl('');
    setRegistrySecret('');
    setImageTag('v0.0.1');
    setBuildStrategy('');
    setBuildStrategyError(null);
    setDockerfile('Dockerfile');
    setBuildTimeout('15m');
    setWorkloadType('deployment');
    setPersistentStorageEnabled(false);
    setPersistentStorageSize('1Gi');
    setEnvRows([]);
    setPortRows([]);
    setCreateHttpRoute(false);
    setAuthBridgeEnabled(false);
    setSpireEnabled(false);
    setBuildProgress({ phase: 'idle', elapsedMs: 0, pollErrorCount: 0 });
    buildNameRef.current = '';
    buildNsRef.current = '';
    pollErrorCountRef.current = 0;
  }, [namespaceProp, stopPolling]);

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

  const formState = useMemo(
    (): ToolFormState => ({
      name,
      namespace,
      description,
      protocol,
      framework,
      deploymentMethod,
      containerImage,
      imagePullSecret,
      gitUrl,
      gitRevision,
      contextDir,
      registryUrl,
      registrySecret,
      imageTag,
      buildStrategy,
      dockerfile,
      buildTimeout,
      workloadType,
      persistentStorageEnabled,
      persistentStorageSize,
      envRows,
      portRows,
      createHttpRoute,
      authBridgeEnabled,
      spireEnabled,
    }),
    [
      name,
      namespace,
      description,
      protocol,
      framework,
      deploymentMethod,
      containerImage,
      imagePullSecret,
      gitUrl,
      gitRevision,
      contextDir,
      registryUrl,
      registrySecret,
      imageTag,
      buildStrategy,
      dockerfile,
      buildTimeout,
      workloadType,
      persistentStorageEnabled,
      persistentStorageSize,
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

  const handleNext = useCallback(() => {
    setSubmitError(null);
    if (activeStep === 0 && !validateStep0()) {
      const trimmedName = name.trim();
      if (!trimmedName || !namespace.trim()) {
        setSubmitError('Name and namespace are required.');
      } else {
        setSubmitError('Tool name must be a valid DNS-1123 label.');
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
    setActiveStep(s => Math.min(s + 1, TOOL_STEPS.length - 1));
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

  const startBuildPolling = useCallback(
    (toolName: string, toolNamespace: string) => {
      buildNameRef.current = toolName;
      buildNsRef.current = toolNamespace;
      pollErrorCountRef.current = 0;
      const startedAt = Date.now();

      elapsedRef.current = setInterval(() => {
        const elapsed = Date.now() - startedAt;
        setBuildProgress(prev => {
          const next = { ...prev, elapsedMs: elapsed };
          if (
            elapsed >= BUILD_TIMEOUT_WARN_MS &&
            prev.phase === 'building' &&
            !prev.message?.includes('taking longer')
          ) {
            next.message =
              'Build is taking longer than expected. It will continue in the background if you close this dialog.';
          }
          return next;
        });
      }, 1000);

      pollRef.current = setInterval(async () => {
        try {
          const info = await api.getToolBuildInfo(toolNamespace, toolName);
          const elapsed = Date.now() - startedAt;
          const phase = info.buildRunPhase?.toLowerCase() ?? '';
          pollErrorCountRef.current = 0;

          if (phase === 'succeeded') {
            stopPolling();
            setBuildProgress(prev => ({
              ...prev,
              phase: 'finalizing',
              buildRunPhase: info.buildRunPhase ?? undefined,
              outputImage: info.outputImage,
              elapsedMs: elapsed,
              message: 'Build complete. Deploying tool…',
              pollErrorCount: 0,
            }));

            try {
              const result = await api.finalizeToolBuild(
                toolNamespace,
                toolName,
              );
              setBuildProgress(prev => ({
                ...prev,
                phase: 'complete',
                elapsedMs: Date.now() - startedAt,
                message: result.message,
                deployFailedAfterBuild: false,
              }));
              setSuccessOpen(true);
              onCreated();
            } catch (finErr) {
              setBuildProgress(prev => ({
                ...prev,
                phase: 'failed',
                elapsedMs: Date.now() - startedAt,
                failureMessage: `Build succeeded but deployment failed: ${getErrorMessage(finErr)}`,
                deployFailedAfterBuild: true,
              }));
            }
          } else if (phase === 'failed') {
            stopPolling();
            setBuildProgress(prev => ({
              ...prev,
              phase: 'failed',
              buildRunPhase: info.buildRunPhase ?? undefined,
              elapsedMs: elapsed,
              failureMessage: info.buildRunFailureMessage ?? 'Build failed.',
              deployFailedAfterBuild: false,
            }));
          } else {
            setBuildProgress(prev => ({
              ...prev,
              buildRunPhase: info.buildRunPhase ?? undefined,
              buildRunName: info.buildRunName ?? undefined,
              outputImage: info.outputImage,
              strategy: info.strategy,
              gitUrl: info.gitUrl,
              startTime: info.buildRunStartTime ?? undefined,
              elapsedMs: elapsed,
              pollErrorCount: 0,
            }));
          }
        } catch {
          pollErrorCountRef.current += 1;
          setBuildProgress(prev => ({
            ...prev,
            pollErrorCount: pollErrorCountRef.current,
          }));
          if (pollErrorCountRef.current >= MAX_CONSECUTIVE_POLL_ERRORS) {
            stopPolling();
            setBuildProgress(prev => ({
              ...prev,
              phase: 'failed',
              failureMessage:
                'Lost connection to the build service. The build may still be running — check Build Pipelines for status.',
            }));
          }
        }
      }, BUILD_POLL_INTERVAL_MS);
    },
    [api, onCreated, stopPolling],
  );

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
    if (duplicateEnvNames.size > 0) {
      setSubmitError(
        `Duplicate environment variable names: ${Array.from(duplicateEnvNames).join(', ')}`,
      );
      return;
    }
    const body = buildToolRequest(formState);
    setSubmitting(true);

    try {
      const result = await api.createKagentiTool(body);

      if (deploymentMethod === 'source') {
        setSubmitting(false);
        setActiveStep(TOOL_STEPS.length);
        setBuildProgress({
          phase: 'building',
          elapsedMs: 0,
          message: result.message,
          pollErrorCount: 0,
        });
        startBuildPolling(body.name, body.namespace);
      } else {
        setSuccessOpen(true);
        onCreated();
        onClose();
      }
    } catch (e) {
      setSubmitError(getErrorMessage(e));
    } finally {
      if (deploymentMethod !== 'source') {
        setSubmitting(false);
      }
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
    duplicateEnvNames,
    startBuildPolling,
  ]);

  const handleRetryBuild = useCallback(() => {
    if (!buildNameRef.current || !buildNsRef.current) return;
    const ns = buildNsRef.current;
    const toolName = buildNameRef.current;
    const wasDeployFailure = buildProgress.deployFailedAfterBuild;

    if (wasDeployFailure) {
      setBuildProgress(prev => ({
        ...prev,
        phase: 'finalizing',
        failureMessage: undefined,
        message: 'Retrying deployment…',
        pollErrorCount: 0,
      }));
      api
        .finalizeToolBuild(ns, toolName)
        .then(result => {
          setBuildProgress(prev => ({
            ...prev,
            phase: 'complete',
            message: result.message,
            deployFailedAfterBuild: false,
          }));
          setSuccessOpen(true);
          onCreated();
        })
        .catch(err => {
          setBuildProgress(prev => ({
            ...prev,
            phase: 'failed',
            failureMessage: `Deployment failed: ${getErrorMessage(err)}`,
            deployFailedAfterBuild: true,
          }));
        });
    } else {
      setBuildProgress({
        phase: 'building',
        elapsedMs: 0,
        message: 'Retrying build…',
        pollErrorCount: 0,
      });
      api
        .triggerToolBuild(ns, toolName)
        .then(() => {
          startBuildPolling(toolName, ns);
        })
        .catch(err => {
          setBuildProgress(prev => ({
            ...prev,
            phase: 'failed',
            failureMessage: `Retry failed: ${getErrorMessage(err)}`,
          }));
        });
    }
  }, [api, buildProgress.deployFailedAfterBuild, onCreated, startBuildPolling]);

  const handleCloseBuild = useCallback(() => {
    stopPolling();
    setBuildProgress({ phase: 'idle', elapsedMs: 0, pollErrorCount: 0 });
    onClose();
  }, [stopPolling, onClose]);

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

    buildProgress,
    handleRetryBuild,
    handleCloseBuild,

    name,
    setName,
    namespace,
    setNamespace,
    description,
    setDescription,
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
    gitRevision,
    setGitRevision,
    contextDir,
    setContextDir,
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
    dockerfile,
    setDockerfile,
    buildTimeout,
    setBuildTimeout,

    workloadType,
    setWorkloadType,
    persistentStorageEnabled,
    setPersistentStorageEnabled,
    persistentStorageSize,
    setPersistentStorageSize,
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
