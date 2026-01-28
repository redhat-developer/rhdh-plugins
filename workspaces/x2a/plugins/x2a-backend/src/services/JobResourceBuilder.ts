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

import { V1Job, V1Secret } from '@kubernetes/client-node';
import crypto from 'node:crypto';
import {
  X2AConfig,
  JobCreateParams,
  AAPCredentials,
  GitRepoCredentials,
} from './types';

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
    const aapSource = aapCredentials || config.credentials.aap;

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
   * This secret will be auto-deleted when the job is deleted (via ownerReferences)
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
      sourceRepo: GitRepoCredentials;
      targetRepo: GitRepoCredentials;
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
        ttlSecondsAfterFinished: config.kubernetes.ttlSecondsAfterFinished,
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
            containers: [
              {
                name: 'x2a-echo',
                image: 'busybox:latest',
                command: this.buildCommand(params),
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
                ],
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
   * Builds the command array for the container based on the migration phase
   * Currently simplified to echo commands for testing job infrastructure
   *
   * @param params - Job creation parameters
   * @returns Command array to execute in the container
   */
  private static buildCommand(params: JobCreateParams): string[] {
    const baseEcho = ['/bin/sh', '-c'];

    switch (params.phase) {
      case 'init':
        // init phase: scans source repo to create migration plan
        return [
          ...baseEcho,
          `
          echo "===== X2A Init Phase ====="
          echo "Project: ${params.projectName} (${params.projectId})"
          echo "Job ID: ${params.jobId}"
          echo "User: ${params.user}"
          ${params.userPrompt ? `echo "User Prompt: ${params.userPrompt}"` : ''}
          echo ""
          echo "Simulating init phase (scanning source repo)..."
          sleep 10
          echo "Init phase completed!"
          `,
        ];

      case 'analyze':
        // analyze phase: analyzes a specific module
        if (!params.moduleName) {
          throw new Error('moduleName is required for analyze phase');
        }
        return [
          ...baseEcho,
          `
          echo "===== X2A Analyze Phase ====="
          echo "Project: ${params.projectName} (${params.projectId})"
          echo "Module: ${params.moduleName} (${params.moduleId})"
          echo "Job ID: ${params.jobId}"
          echo "User: ${params.user}"
          ${params.userPrompt ? `echo "User Prompt: ${params.userPrompt}"` : ''}
          echo ""
          echo "Simulating analyze phase for module ${params.moduleName}..."
          sleep 10
          echo "Analyze phase completed!"
          `,
        ];

      case 'migrate':
        // migrate phase: converts Chef code to Ansible
        if (!params.moduleName) {
          throw new Error('moduleName is required for migrate phase');
        }
        return [
          ...baseEcho,
          `
          echo "===== X2A Migrate Phase ====="
          echo "Project: ${params.projectName} (${params.projectId})"
          echo "Module: ${params.moduleName} (${params.moduleId})"
          echo "Job ID: ${params.jobId}"
          echo "User: ${params.user}"
          ${params.userPrompt ? `echo "User Prompt: ${params.userPrompt}"` : ''}
          echo ""
          echo "Simulating migrate phase for module ${params.moduleName}..."
          echo "Converting Chef code to Ansible..."
          sleep 10
          echo "Migrate phase completed!"
          `,
        ];

      case 'publish':
        // publish phase: prepares Ansible content for AAP
        if (!params.moduleName) {
          throw new Error('moduleName is required for publish phase');
        }
        return [
          ...baseEcho,
          `
          echo "===== X2A Publish Phase ====="
          echo "Project: ${params.projectName} (${params.projectId})"
          echo "Module: ${params.moduleName} (${params.moduleId})"
          echo "Job ID: ${params.jobId}"
          echo "User: ${params.user}"
          ${params.userPrompt ? `echo "User Prompt: ${params.userPrompt}"` : ''}
          echo ""
          echo "Simulating publish phase for module ${params.moduleName}..."
          echo "Publishing Ansible content to AAP..."
          sleep 10
          echo "Publish phase completed!"
          `,
        ];

      default:
        throw new Error(`Unknown phase: ${params.phase}`);
    }
  }
}
