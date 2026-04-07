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

export const FORM_STEPS = ['Basics', 'Deployment', 'Runtime'] as const;
export const BUILD_STEP = 'Build & Deploy' as const;

export type DeploymentMethod = 'image' | 'source';
export type WorkloadType = 'deployment' | 'statefulset' | 'job';
export type PortProtocol = 'TCP' | 'UDP';
export type EnvSource = 'direct' | 'secret' | 'configMap';

export type BuildPhase =
  | 'idle'
  | 'submitting'
  | 'building'
  | 'finalizing'
  | 'complete'
  | 'failed';

export interface BuildProgress {
  phase: BuildPhase;
  buildRunName?: string;
  buildRunPhase?: string;
  startTime?: string;
  elapsedMs: number;
  message?: string;
  failureMessage?: string;
  outputImage?: string;
  strategy?: string;
  gitUrl?: string;
}

const DNS_1123_RE = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/;

export function isValidDns1123(value: string): boolean {
  return DNS_1123_RE.test(value);
}

export interface EnvRow {
  id: number;
  name: string;
  value: string;
  source: EnvSource;
  refName: string;
  refKey: string;
}

export interface BuildArgRow {
  id: number;
  value: string;
}

export interface ServicePortRow {
  id: number;
  name: string;
  port: string;
  targetPort: string;
  protocol: PortProtocol;
}

export interface FormState {
  name: string;
  namespace: string;
  protocol: string;
  framework: string;
  deploymentMethod: DeploymentMethod;
  containerImage: string;
  imagePullSecret: string;
  gitUrl: string;
  gitBranch: string;
  gitPath: string;
  registryUrl: string;
  registrySecret: string;
  imageTag: string;
  buildStrategy: string;
  startCommand: string;
  dockerfile: string;
  buildArgRows: BuildArgRow[];
  buildTimeout: string;
  workloadType: WorkloadType;
  envRows: EnvRow[];
  portRows: ServicePortRow[];
  createHttpRoute: boolean;
  authBridgeEnabled: boolean;
  spireEnabled: boolean;
}

export interface CreateAgentWizardProps {
  open: boolean;
  namespace?: string;
  onClose: () => void;
  onCreated: () => void;
}
