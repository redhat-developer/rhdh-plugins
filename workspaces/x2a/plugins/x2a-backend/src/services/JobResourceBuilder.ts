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

import { resolvePackagePath } from '@backstage/backend-plugin-api';
import { V1Job, V1Secret, V1Container } from '@kubernetes/client-node';
import crypto from 'node:crypto';
import fs from 'node:fs';
import { X2AConfig } from '../../config';
import { JobCreateParams, AAPCredentials, GitRepo } from './types';

/**
 * Builds Kubernetes Job and Secret resources for X2A migration jobs
 */
export class JobResourceBuilder {
  /**
   * Builds a Kubernetes Secret for a project containing long-lived credentials
   * This secret contains LLM and AAP credentials only (no Git credentials)
   *
   * @param projectId - The project UUID
   * @param aapCredentials - Optional AAP credentials override from user
   * @param config - X2A configuration from app-config.yaml
   * @returns V1Secret resource ready to be created in Kubernetes
   */
  static buildProjectSecret(
    projectId: string,
    aapCredentials: AAPCredentials | undefined,
    config: X2AConfig,
  ): V1Secret {
    const secretName = `x2a-project-secret-${projectId}`;

    // Get LLM credentials from config - generic key-value pairs
    const llmCredentials = config.credentials.llm;

    // Determine AAP credentials source - user-provided takes precedence over config
    let aapSource = aapCredentials;

    // If no user-provided credentials, check if config has AAP credentials
    if (!aapSource && config.credentials.aap) {
      const configAap = config.credentials.aap;
      // Only use config as fallback if it has at least url and orgName defined
      // (not undefined from missing env vars)
      if (configAap.url && configAap.orgName) {
        aapSource = configAap;
      }
    }

    if (!aapSource) {
      throw new Error(
        'AAP credentials must be provided either in app-config.yaml or by the user at project creation',
      );
    }

    // Validate AAP credentials - must have either oauthToken OR username+password
    const { url, orgName, oauthToken, username, password } = aapSource;
    const hasOAuthToken = !!oauthToken;
    const hasUserPass = !!username && !!password;

    if (!hasOAuthToken && !hasUserPass) {
      throw new Error(
        'AAP credentials must include either oauthToken OR username+password',
      );
    }

    if (hasOAuthToken && hasUserPass) {
      throw new Error(
        'AAP credentials should have either oauthToken OR username+password, not both',
      );
    }

    // Build AAP environment variables based on auth method
    const aapEnvVars: Record<string, string> = {
      AAP_CONTROLLER_URL: url,
      AAP_ORG_NAME: orgName,
    };

    if (hasOAuthToken) {
      aapEnvVars.AAP_OAUTH_TOKEN = oauthToken!;
    } else {
      aapEnvVars.AAP_USERNAME = username!;
      aapEnvVars.AAP_PASSWORD = password!;
    }

    return {
      apiVersion: 'v1',
      kind: 'Secret',
      metadata: {
        name: secretName,
        labels: {
          'app.kubernetes.io/name': 'x2a-project-secret',
          'app.kubernetes.io/component': 'credentials',
          'app.kubernetes.io/managed-by': 'x2a-backend-plugin',
          'x2a.redhat.com/project-id': projectId,
        },
        annotations: {
          'x2a.redhat.com/created-by': 'x2a-backend-plugin',
          'x2a.redhat.com/description':
            'Long-lived credentials for X2A migration project (LLM + AAP)',
          'x2a.redhat.com/aap-auth-method': hasOAuthToken
            ? 'oauth-token'
            : 'basic',
          'x2a.redhat.com/aap-source': aapCredentials
            ? 'user-provided'
            : 'config',
          'x2a.redhat.com/secret-type': 'project',
        },
      },
      type: 'Opaque',
      stringData: {
        // LLM credentials from config (generic key-value env vars)
        ...llmCredentials,

        // AAP credentials (from config or user override)
        ...aapEnvVars,
      },
    };
  }

  /**
   * Builds a Kubernetes Secret for a specific job containing ephemeral Git credentials
   *
   * Note: ownerReferences are NOT set here because the job doesn't exist yet at secret
   * creation time. After job creation, KubeService.createJob() sets the ownerReference
   * on this secret so it is automatically garbage-collected when the Job is deleted.
   *
   * @param jobId - The job UUID
   * @param projectId - The project UUID
   * @param gitCredentials - Git repository credentials from the user
   * @returns V1Secret resource ready to be created in Kubernetes
   */
  static buildJobSecret(
    jobId: string,
    projectId: string,
    gitCredentials: {
      sourceRepo: GitRepo;
      targetRepo: GitRepo;
    },
  ): V1Secret {
    const secretName = `x2a-job-secret-${jobId}`;

    return {
      apiVersion: 'v1',
      kind: 'Secret',
      metadata: {
        name: secretName,
        labels: {
          'app.kubernetes.io/name': 'x2a-job-secret',
          'app.kubernetes.io/component': 'credentials',
          'app.kubernetes.io/managed-by': 'x2a-backend-plugin',
          'x2a.redhat.com/job-id': jobId,
          'x2a.redhat.com/project-id': projectId,
          'x2a.redhat.com/secret-type': 'job',
        },
        annotations: {
          'x2a.redhat.com/created-by': 'x2a-backend-plugin',
          'x2a.redhat.com/description':
            'Ephemeral Git credentials for X2A job (auto-deleted with job)',
        },
      },
      type: 'Opaque',
      stringData: {
        // Git source repository credentials from user
        SOURCE_REPO_URL: gitCredentials.sourceRepo.url,
        SOURCE_REPO_TOKEN: gitCredentials.sourceRepo.token,
        SOURCE_REPO_BRANCH: gitCredentials.sourceRepo.branch,

        // Git target repository credentials from user
        TARGET_REPO_URL: gitCredentials.targetRepo.url,
        TARGET_REPO_TOKEN: gitCredentials.targetRepo.token,
        TARGET_REPO_BRANCH: gitCredentials.targetRepo.branch,
      },
    };
  }

  /**
   * Builds a Kubernetes Job specification for running an X2A migration phase
   *
   * @param params - Job creation parameters
   * @param config - X2A configuration from app-config.yaml
   * @returns V1Job resource ready to be created in Kubernetes
   */
  static buildJobSpec(params: JobCreateParams, config: X2AConfig): V1Job {
    const shortId = crypto.randomBytes(4).toString('hex');
    const jobName = `job-x2a-${params.phase}-${shortId}`;
    const projectSecretName = `x2a-project-secret-${params.projectId}`;
    const jobSecretName = `x2a-job-secret-${params.jobId}`;

    return {
      apiVersion: 'batch/v1',
      kind: 'Job',
      metadata: {
        name: jobName,
        labels: {
          'app.kubernetes.io/name': 'x2a-job',
          'app.kubernetes.io/component': 'migration',
          'app.kubernetes.io/managed-by': 'x2a-backend-plugin',
          'x2a.redhat.com/project-id': params.projectId,
          'x2a.redhat.com/project-name': this.sanitizeLabelValue(
            params.projectName,
          ),
          'x2a.redhat.com/phase': params.phase,
          'x2a.redhat.com/user': this.sanitizeLabelValue(params.user),
          'x2a.redhat.com/job-id': params.jobId,
          ...(params.moduleId && {
            'x2a.redhat.com/module-id': params.moduleId,
          }),
          ...(params.moduleName && {
            'x2a.redhat.com/module-name': this.sanitizeLabelValue(
              params.moduleName,
            ),
          }),
        },
        annotations: {
          'x2a.redhat.com/created-by': 'x2a-backend-plugin',
          'x2a.redhat.com/callback-url': params.callbackUrl,
        },
      },
      spec: {
        // Allow 3 retries on failure
        backoffLimit: 3,
        // Auto-delete completed jobs after configured TTL
        ttlSecondsAfterFinished: Number(
          config.kubernetes.ttlSecondsAfterFinished,
        ),
        template: {
          metadata: {
            labels: {
              'app.kubernetes.io/name': 'x2a-job',
              'x2a.redhat.com/project-id': params.projectId,
              'x2a.redhat.com/phase': params.phase,
              'x2a.redhat.com/job-id': params.jobId,
            },
          },
          spec: {
            restartPolicy: 'Never',
            // Init container: Clone source and target repositories
            initContainers: [this.buildGitFetchInitContainer(params.jobId)],
            containers: [
              {
                name: 'x2a',
                image: `${config.kubernetes.image}:${config.kubernetes.imageTag}`,
                command: ['/bin/bash', '-c'],
                args: [this.buildMainContainerScript(params, config)],
                // Mount both secrets:
                // 1. Project secret (LLM + AAP) - long-lived
                // 2. Job secret (Git credentials) - ephemeral, auto-deleted with job
                envFrom: [
                  {
                    secretRef: {
                      name: projectSecretName,
                    },
                  },
                  {
                    secretRef: {
                      name: jobSecretName,
                    },
                  },
                ],
                // Additional env vars specific to this job (metadata, not credentials)
                env: [
                  {
                    name: 'PHASE',
                    value: params.phase,
                  },
                  {
                    name: 'PROJECT_ID',
                    value: params.projectId,
                  },
                  {
                    name: 'PROJECT_NAME',
                    value: params.projectName,
                  },
                  {
                    name: 'JOB_ID',
                    value: params.jobId,
                  },
                  {
                    name: 'USER',
                    value: params.user,
                  },
                  {
                    name: 'CALLBACK_URL',
                    value: params.callbackUrl,
                  },
                  {
                    name: 'CALLBACK_TOKEN',
                    value: params.callbackToken,
                  },
                  ...(params.moduleId
                    ? [
                        {
                          name: 'MODULE_ID',
                          value: params.moduleId,
                        },
                      ]
                    : []),
                  ...(params.moduleName
                    ? [
                        {
                          name: 'MODULE_NAME',
                          value: params.moduleName,
                        },
                      ]
                    : []),
                  ...(params.userPrompt
                    ? [
                        {
                          name: 'USER_PROMPT',
                          value: params.userPrompt,
                        },
                      ]
                    : []),
                  {
                    name: 'PROJECT_ABBREV',
                    value: params.projectAbbrev,
                  },
                  {
                    name: 'GIT_AUTHOR_NAME',
                    value: config.git?.author?.name,
                  },
                  {
                    name: 'GIT_AUTHOR_EMAIL',
                    value: config.git?.author?.email,
                  },
                ],
                volumeMounts: [
                  {
                    name: 'workspace',
                    mountPath: '/workspace',
                  },
                ],
                resources: {
                  requests: {
                    cpu: config.kubernetes.resources.requests.cpu,
                    memory: config.kubernetes.resources.requests.memory,
                  },
                  limits: {
                    cpu: config.kubernetes.resources.limits.cpu,
                    memory: config.kubernetes.resources.limits.memory,
                  },
                },
              },
            ],
            // Shared volume for git repositories
            volumes: [
              {
                name: 'workspace',
                emptyDir: {},
              },
            ],
          },
        },
      },
    };
  }

  /**
   * Sanitizes a string to be a valid Kubernetes label value
   * Labels must match: (([A-Za-z0-9][-A-Za-z0-9_.]*)?[A-Za-z0-9])?
   * Max length: 63 characters
   *
   * Security: Uses manual character iteration for trimming to prevent ReDoS.
   * Guaranteed O(n) time complexity where n ≤ 63.
   *
   * @param value - The string to sanitize
   * @returns A valid Kubernetes label value
   */
  private static sanitizeLabelValue(value: string): string {
    // Truncate early to prevent ReDoS with long inputs
    let sanitized = value.substring(0, 63);

    // Replace invalid chars with dash (safe - no backtracking)
    sanitized = sanitized.replace(/[^a-zA-Z0-9-_.]/g, '-');

    // Remove leading non-alphanumeric (manual iteration - guaranteed O(n))
    let start = 0;
    while (start < sanitized.length) {
      const char = sanitized[start];
      const isAlphaNumeric =
        (char >= 'a' && char <= 'z') ||
        (char >= 'A' && char <= 'Z') ||
        (char >= '0' && char <= '9');
      if (isAlphaNumeric) break;
      start++;
    }
    sanitized = sanitized.substring(start);

    // Remove trailing non-alphanumeric (manual iteration - guaranteed O(n))
    let end = sanitized.length;
    while (end > 0) {
      const char = sanitized[end - 1];
      const isAlphaNumeric =
        (char >= 'a' && char <= 'z') ||
        (char >= 'A' && char <= 'Z') ||
        (char >= '0' && char <= '9');
      if (isAlphaNumeric) break;
      end--;
    }
    sanitized = sanitized.substring(0, end);

    // Final truncate to ensure 63 char limit
    return sanitized.substring(0, 63);
  }

  /**
   * Builds an init container that clones source and target git repositories
   *
   * @param jobId - The job UUID (for secret reference)
   * @returns V1Container for the init container
   */
  private static buildGitFetchInitContainer(jobId: string): V1Container {
    const jobSecretName = `x2a-job-secret-${jobId}`;

    return {
      name: 'git-fetch',
      image: 'alpine/git:2.43.0',
      command: ['/bin/sh', '-c'],
      args: [
        `
set -e
echo "=== Cloning source repository ==="
git clone --depth=1 --single-branch --branch=\${SOURCE_REPO_BRANCH} \\
  https://\${SOURCE_REPO_TOKEN}@\${SOURCE_REPO_URL#https://} \\
  /workspace/source

echo "=== Cloning target repository ==="
# Handle case where target repo might be empty or not exist
if git ls-remote https://\${TARGET_REPO_TOKEN}@\${TARGET_REPO_URL#https://} &>/dev/null; then
  git clone --depth=1 --single-branch --branch=\${TARGET_REPO_BRANCH} \\
    https://\${TARGET_REPO_TOKEN}@\${TARGET_REPO_URL#https://} \\
    /workspace/target
else
  echo "Target repo doesn't exist, initializing empty repo"
  mkdir -p /workspace/target
  cd /workspace/target
  git init
  git checkout -b \${TARGET_REPO_BRANCH}
fi

echo "=== Git fetch completed ==="
        `.trim(),
      ],
      envFrom: [
        {
          secretRef: {
            name: jobSecretName,
          },
        },
      ],
      volumeMounts: [
        {
          name: 'workspace',
          mountPath: '/workspace',
        },
      ],
    };
  }

  /**
   * Builds the main container script that executes x2a tool, commits, and pushes
   *
   * @param params - Job creation parameters
   * @param config - X2A configuration
   * @returns Bash script as string
   */
  private static buildMainContainerScript(
    _params: JobCreateParams,
    _config: X2AConfig,
  ): string {
    // Read the template file
    const templatePath = resolvePackagePath(
      '@red-hat-developer-hub/backstage-plugin-x2a-backend',
      'templates',
      'x2a-job-script.sh',
    );
    const template = fs.readFileSync(templatePath, 'utf-8');

    // Template uses environment variables, no string replacement needed
    // All variables are passed via environment in the container spec
    return template;
  }
}
