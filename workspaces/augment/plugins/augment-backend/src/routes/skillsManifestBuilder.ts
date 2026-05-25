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

/**
 * Generates Kubernetes manifests for skill-based agents.
 * Deployment uses an alpine init container that fetches each skill's OCI layer
 * from quay.io, then the runtime container serves the agent with those skills.
 */

export interface SkillAgentManifestInput {
  name: string;
  namespace: string;
  runtime: string;
  skills: string[];
  systemPrompt: string;
  llmModel: string;
  runtimeImage: string;
  llmBaseUrl?: string;
  llmProvider?: string;
  registryBaseUrl: string;
}

export interface K8sManifest {
  apiVersion: string;
  kind: string;
  metadata: {
    name: string;
    namespace: string;
    labels?: Record<string, string>;
  };
  [key: string]: unknown;
}

const LABELS_PREFIX = 'augment.redhat.com';

function buildLabels(name: string): Record<string, string> {
  return {
    [`${LABELS_PREFIX}/component`]: 'skill-agent',
    [`${LABELS_PREFIX}/agent-name`]: name,
    'app.kubernetes.io/managed-by': 'augment-backstage-plugin',
  };
}

function buildInitContainerScript(
  skills: string[],
  registryBaseUrl: string,
): string {
  const commands = skills.map(skill => {
    const safeName = skill
      .toLocaleLowerCase('en-US')
      .replace(/[^a-z0-9-]/g, '-');
    return [
      `mkdir -p /skills/${safeName}`,
      `wget -q -O /tmp/${safeName}.tar.gz "${registryBaseUrl}/${skill}/blobs/sha256:latest"`,
      `tar xzf /tmp/${safeName}.tar.gz -C /skills/${safeName}/`,
      `rm -f /tmp/${safeName}.tar.gz`,
    ].join(' && ');
  });
  return commands.join(' && ');
}

export function buildDeploymentManifest(
  input: SkillAgentManifestInput,
): K8sManifest {
  const { name, namespace, runtimeImage, skills, registryBaseUrl } = input;
  const labels = buildLabels(name);

  return {
    apiVersion: 'apps/v1',
    kind: 'Deployment',
    metadata: { name, namespace, labels },
    spec: {
      replicas: 1,
      selector: { matchLabels: { [`${LABELS_PREFIX}/agent-name`]: name } },
      template: {
        metadata: { labels },
        spec: {
          initContainers: [
            {
              name: 'fetch-skills',
              image: 'alpine:3.20',
              command: [
                'sh',
                '-c',
                buildInitContainerScript(skills, registryBaseUrl),
              ],
              volumeMounts: [{ name: 'skills-volume', mountPath: '/skills' }],
            },
          ],
          containers: [
            {
              name: 'agent-runtime',
              image: runtimeImage,
              args: ['--skills-dir', '/skills', '--listen-plain-http'],
              ports: [{ containerPort: 8000, protocol: 'TCP' }],
              envFrom: [
                { configMapRef: { name: `${name}-config` } },
                { secretRef: { name: `${name}-llm-secret` } },
              ],
              volumeMounts: [{ name: 'skills-volume', mountPath: '/skills' }],
              resources: {
                requests: { memory: '256Mi', cpu: '100m' },
                limits: { memory: '512Mi', cpu: '500m' },
              },
            },
          ],
          volumes: [{ name: 'skills-volume', emptyDir: {} }],
        },
      },
    },
  };
}

export function buildServiceManifest(
  input: Pick<SkillAgentManifestInput, 'name' | 'namespace'>,
): K8sManifest {
  const { name, namespace } = input;
  return {
    apiVersion: 'v1',
    kind: 'Service',
    metadata: { name, namespace, labels: buildLabels(name) },
    spec: {
      selector: { [`${LABELS_PREFIX}/agent-name`]: name },
      ports: [{ port: 8000, targetPort: 8000, protocol: 'TCP' }],
    },
  };
}

export function buildConfigMapManifest(
  input: Pick<
    SkillAgentManifestInput,
    'name' | 'namespace' | 'systemPrompt' | 'skills'
  >,
): K8sManifest {
  const { name, namespace, systemPrompt, skills } = input;
  return {
    apiVersion: 'v1',
    kind: 'ConfigMap',
    metadata: { name: `${name}-config`, namespace, labels: buildLabels(name) },
    data: {
      SYSTEM_PROMPT: systemPrompt,
      SKILLS: skills.join(','),
    },
  };
}

/**
 * E5: Generates the LLM secret manifest.
 */
export function buildLlmSecretManifest(
  input: Pick<
    SkillAgentManifestInput,
    'name' | 'namespace' | 'llmModel' | 'llmBaseUrl' | 'llmProvider'
  >,
): K8sManifest {
  const { name, namespace, llmModel, llmBaseUrl, llmProvider } = input;
  return {
    apiVersion: 'v1',
    kind: 'Secret',
    metadata: {
      name: `${name}-llm-secret`,
      namespace,
      labels: buildLabels(name),
    },
    type: 'Opaque',
    stringData: {
      LLM_PROVIDER: llmProvider ?? 'openai',
      LLM_API_KEY: 'not-needed',
      LLM_BASE_URL: llmBaseUrl ?? '',
      LLM_MODEL: llmModel,
    },
  };
}

/**
 * Generates the full set of K8s manifests for a skill agent deployment.
 */
export function generateSkillAgentManifests(
  input: SkillAgentManifestInput,
): K8sManifest[] {
  return [
    buildDeploymentManifest(input),
    buildServiceManifest(input),
    buildConfigMapManifest(input),
    buildLlmSecretManifest(input),
  ];
}
