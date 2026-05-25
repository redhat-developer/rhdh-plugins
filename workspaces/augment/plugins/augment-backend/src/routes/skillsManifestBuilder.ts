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

export interface SkillRef {
  slug?: string;
  name: string;
  skillName?: string;
  gitPath?: string;
  pluginName?: string;
}

export interface SkillAgentManifestInput {
  name: string;
  namespace: string;
  runtime: string;
  skills: SkillRef[];
  systemPrompt: string;
  llmModel: string;
  runtimeImage: string;
  llmBaseUrl?: string;
  llmProvider?: string;
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

function buildInitContainerScript(skills: SkillRef[]): string {
  const fetchCommands = skills.map(s => {
    const slug = (s.skillName ?? s.name)
      .toLocaleLowerCase('en-US')
      .replace(/[^a-z0-9-]/g, '-');
    const ref = (s.gitPath ?? '').replace(/^https?:\/\//, '');
    const tagIdx = ref.lastIndexOf(':');
    const repo = tagIdx > 0 ? ref.slice(0, tagIdx) : ref;
    const tag = tagIdx > 0 ? ref.slice(tagIdx + 1) : 'latest';
    const registryHost = repo.split('/')[0];
    const repoPath = repo.slice(registryHost.length + 1);

    return [
      `echo "Fetching skill: ${slug} from ${ref}"`,
      `mkdir -p /skills/${slug}`,
      `MANIFEST=$(wget -qO- "https://${registryHost}/v2/${repoPath}/manifests/${tag}" --header="Accept: application/vnd.oci.image.manifest.v1+json" 2>/dev/null)`,
      `DIGEST=$(echo "$MANIFEST" | grep -o '"sha256:[a-f0-9]*"' | tail -1 | tr -d '"')`,
      `wget -qO- "https://${registryHost}/v2/${repoPath}/blobs/$DIGEST" > /tmp/${slug}.blob 2>/dev/null`,
      `if tar tzf /tmp/${slug}.blob >/dev/null 2>&1; then`,
      `  tar xzf /tmp/${slug}.blob -C /skills/${slug}/`,
      `else`,
      `  gzip -d -c /tmp/${slug}.blob > /skills/${slug}/SKILL.md 2>/dev/null || cp /tmp/${slug}.blob /skills/${slug}/SKILL.md`,
      `fi`,
      `rm -f /tmp/${slug}.blob`,
      `echo "  extracted: $(ls /skills/${slug}/ | tr '\\n' ' ')"`,
    ].join('\n');
  });

  return [
    '#!/bin/sh',
    'set -e',
    'apk add --no-cache wget ca-certificates >/dev/null 2>&1 || true',
    ...fetchCommands,
    'echo "All skills fetched successfully"',
  ].join('\n');
}

export function buildDeploymentManifest(
  input: SkillAgentManifestInput,
): K8sManifest {
  const { name, namespace, runtimeImage, skills } = input;
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
              command: ['sh', '-c', buildInitContainerScript(skills)],
              volumeMounts: [{ name: 'skills', mountPath: '/skills' }],
            },
          ],
          containers: [
            {
              name: 'agent-runtime',
              image: runtimeImage,
              args: [
                'serve',
                '--config-dir',
                '/config/agent',
                '--skills-dir',
                '/skills',
                '--listen-plain-http',
              ],
              ports: [{ containerPort: 8000, protocol: 'TCP' }],
              envFrom: [{ secretRef: { name: `${name}-llm-secret` } }],
              volumeMounts: [
                {
                  name: 'agent-config',
                  mountPath: '/config/agent',
                  readOnly: true,
                },
                { name: 'skills', mountPath: '/skills', readOnly: true },
                { name: 'tmp', mountPath: '/tmp' },
              ],
              resources: {
                requests: { memory: '256Mi', cpu: '100m' },
                limits: { memory: '512Mi', cpu: '500m' },
              },
            },
          ],
          volumes: [
            { name: 'agent-config', configMap: { name: `${name}-config` } },
            { name: 'skills', emptyDir: {} },
            { name: 'tmp', emptyDir: {} },
          ],
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
  const skillNames = skills.map(s => s.skillName ?? s.name);

  return {
    apiVersion: 'v1',
    kind: 'ConfigMap',
    metadata: { name: `${name}-config`, namespace, labels: buildLabels(name) },
    data: {
      'system-prompt.txt':
        systemPrompt ||
        `You are a specialized AI agent with expertise in: ${skillNames.join(', ')}. Use the load_skill tool to leverage your skills when answering questions.`,
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

export interface SkillAgentManifests {
  deployment: K8sManifest;
  service: K8sManifest;
  configMap: K8sManifest;
  secret: K8sManifest;
}

export function generateSkillAgentManifests(
  input: SkillAgentManifestInput,
): SkillAgentManifests {
  return {
    deployment: buildDeploymentManifest(input),
    service: buildServiceManifest(input),
    configMap: buildConfigMapManifest(input),
    secret: buildLlmSecretManifest(input),
  };
}
