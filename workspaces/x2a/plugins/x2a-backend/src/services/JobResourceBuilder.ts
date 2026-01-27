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
import { X2AConfig, ProjectCredentials, JobCreateParams } from './types';

/**
 * Builds Kubernetes Job and Secret resources for X2A migration jobs
 */
export class JobResourceBuilder {
  /**
   * Builds a Kubernetes Secret for a project containing all necessary credentials
   *
   * @param projectId - The project UUID
   * @param credentials - Git repository credentials from the user
   * @param config - X2A configuration from app-config.yaml
   * @returns V1Secret resource ready to be created in Kubernetes
   */
  static buildProjectSecret(
    projectId: string,
    credentials: ProjectCredentials,
    config: X2AConfig,
  ): V1Secret {
    const secretName = `x2a-project-secret-${projectId}`;

    // Validate and build LLM credentials - must have either IAM credentials OR bearer token
    const { model, region, accessKeyId, secretAccessKey, bearerToken } =
      config.credentials.llm;
    const hasIAM = !!accessKeyId && !!secretAccessKey;
    const hasBearerToken = !!bearerToken;

    if (!hasIAM && !hasBearerToken) {
      throw new Error(
        'LLM credentials must include either AWS IAM credentials (accessKeyId + secretAccessKey) OR bearerToken',
      );
    }

    if (hasIAM && hasBearerToken) {
      throw new Error(
        'LLM credentials should have either IAM credentials OR bearerToken, not both',
      );
    }

    // Build LLM credentials based on auth method
    const llmCredentials: Record<string, string> = {
      LLM_MODEL: model,
      AWS_REGION: region,
    };

    if (hasIAM) {
      llmCredentials.AWS_ACCESS_KEY_ID = accessKeyId!;
      llmCredentials.AWS_SECRET_ACCESS_KEY = secretAccessKey!;
    } else {
      llmCredentials.AWS_BEARER_TOKEN_BEDROCK = bearerToken!;
    }

    // Determine AAP credentials source - user-provided takes precedence over config
    const aapSource = credentials.aapCredentials || config.credentials.aap;

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

    // Build AAP credentials based on auth method
    const aapCredentials: Record<string, string> = {
      AAP_CONTROLLER_URL: url,
      AAP_ORG_NAME: orgName,
    };

    if (hasOAuthToken) {
      aapCredentials.AAP_OAUTH_TOKEN = oauthToken!;
    } else {
      aapCredentials.AAP_USERNAME = username!;
      aapCredentials.AAP_PASSWORD = password!;
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
          'x2a.redhat.com/description': 'Credentials for X2A migration project',
          'x2a.redhat.com/llm-auth-method': hasIAM ? 'iam' : 'bearer-token',
          'x2a.redhat.com/aap-auth-method': hasOAuthToken
            ? 'oauth-token'
            : 'basic',
          'x2a.redhat.com/aap-source': credentials.aapCredentials
            ? 'user-provided'
            : 'config',
        },
      },
      type: 'Opaque',
      stringData: {
        // AWS Bedrock LLM credentials from config (IAM OR bearer token)
        ...llmCredentials,

        // AAP credentials from config (oauthToken OR username+password)
        ...aapCredentials,

        // Git source repository credentials from user
        SOURCE_REPO_URL: credentials.sourceRepo.url,
        SOURCE_REPO_TOKEN: credentials.sourceRepo.token,
        SOURCE_REPO_BRANCH: credentials.sourceRepo.branch,

        // Git target repository credentials from user
        TARGET_REPO_URL: credentials.targetRepo.url,
        TARGET_REPO_TOKEN: credentials.targetRepo.token,
        TARGET_REPO_BRANCH: credentials.targetRepo.branch,
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
    const secretName = `x2a-project-secret-${params.projectId}`;

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
                // Additional env vars specific to this job
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
   * @param value - The string to sanitize
   * @returns A valid Kubernetes label value
   */
  private static sanitizeLabelValue(value: string): string {
    return value
      .replace(/[^a-zA-Z0-9-_.]/g, '-') // Replace invalid chars with dash
      .replace(/^[^a-zA-Z0-9]+/, '') // Remove leading non-alphanumeric
      .replace(/[^a-zA-Z0-9]+$/, '') // Remove trailing non-alphanumeric
      .substring(0, 63); // Truncate to 63 chars
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
