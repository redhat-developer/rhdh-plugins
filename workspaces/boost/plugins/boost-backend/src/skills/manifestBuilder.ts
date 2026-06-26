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
 * Resource requirements for a skill deployment container.
 *
 * @public
 */
export interface DeploymentResources {
  requests?: {
    cpu?: string;
    memory?: string;
  };
  limits?: {
    cpu?: string;
    memory?: string;
  };
}

/**
 * Parameters for building a K8s Deployment manifest.
 *
 * @public
 */
export interface ManifestParams {
  /** Unique deployment identifier. */
  deploymentId: string;
  /** The skill identifier. */
  skillId: string;
  /** OCI container image for the skill runtime. */
  image: string;
  /** K8s namespace for the deployment. */
  namespace: string;
  /** K8s deployment name. */
  name: string;
  /** Resource requests and limits. */
  resources?: DeploymentResources;
}

/**
 * K8s RFC 1123 label validation regex.
 * Must be lowercase alphanumeric or '-', start and end with alphanumeric,
 * and be at most 63 characters.
 */
const RFC_1123_LABEL_RE = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/;

/**
 * Validates a string against K8s RFC 1123 DNS label rules.
 *
 * @param value - The string to validate.
 * @param fieldName - Field name for error messages.
 * @throws Error if the value does not conform to RFC 1123.
 *
 * @public
 */
export function validateRfc1123Label(value: string, fieldName: string): void {
  if (!RFC_1123_LABEL_RE.test(value)) {
    throw new Error(
      `${fieldName} must conform to RFC 1123: lowercase alphanumeric or '-', ` +
        `start and end with alphanumeric, max 63 characters. Got: "${value}"`,
    );
  }
}

/**
 * Builds a Kubernetes apps/v1 Deployment manifest for a skill agent.
 *
 * The manifest includes an OCI init container that copies the skill
 * artifact into a shared volume, and a main container that runs the
 * skill agent.
 *
 * @param params - Manifest generation parameters.
 * @returns A Kubernetes Deployment manifest object.
 *
 * @public
 */
export function buildDeploymentManifest(params: ManifestParams): object {
  const { deploymentId, skillId, image, namespace, name, resources } = params;

  return {
    apiVersion: 'apps/v1',
    kind: 'Deployment',
    metadata: {
      name,
      namespace,
      labels: {
        'app.kubernetes.io/name': name,
        'app.kubernetes.io/managed-by': 'boost',
        'boost.redhat.com/skill-id': skillId,
        'boost.redhat.com/deployment-id': deploymentId,
      },
    },
    spec: {
      replicas: 1,
      selector: {
        matchLabels: {
          'app.kubernetes.io/name': name,
        },
      },
      template: {
        metadata: {
          labels: {
            'app.kubernetes.io/name': name,
            'boost.redhat.com/skill-id': skillId,
          },
        },
        spec: {
          initContainers: [
            {
              name: 'oci-init',
              image,
              command: ['cp', '-r', '/skill/.', '/shared/skill'],
              volumeMounts: [
                {
                  name: 'shared-skill',
                  mountPath: '/shared/skill',
                },
              ],
            },
          ],
          containers: [
            {
              name: 'skill-agent',
              image,
              ports: [{ containerPort: 8080, name: 'http' }],
              resources: {
                requests: {
                  cpu: resources?.requests?.cpu || '100m',
                  memory: resources?.requests?.memory || '256Mi',
                },
                limits: {
                  cpu: resources?.limits?.cpu || '500m',
                  memory: resources?.limits?.memory || '512Mi',
                },
              },
              env: [
                {
                  name: 'SKILL_ID',
                  value: skillId,
                },
              ],
              volumeMounts: [
                {
                  name: 'shared-skill',
                  mountPath: '/shared/skill',
                  readOnly: true,
                },
              ],
            },
          ],
          volumes: [
            {
              name: 'shared-skill',
              emptyDir: {},
            },
          ],
        },
      },
    },
  };
}
