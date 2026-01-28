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
 * Migration phase types
 */
export type MigrationPhase = 'init' | 'analyze' | 'migrate' | 'publish';

/**
 * Configuration loaded from app-config.yaml for X2A frontend plugin
 */
export interface X2AConfig {
  kubernetes: {
    namespace: string;
    image: string;
    imageTag: string;
    ttlSecondsAfterFinished: number;
    resources: {
      requests: {
        cpu: string;
        memory: string;
      };
      limits: {
        cpu: string;
        memory: string;
      };
    };
  };
  credentials: {
    /**
     * LLM provider credentials as environment variables
     * Generic key-value pairs that will be passed to the job container as env vars
     *
     * Example for AWS Bedrock with IAM:
     * {
     *   "LLM_MODEL": "anthropic.claude-v2",
     *   "AWS_REGION": "us-east-1",
     *   "AWS_ACCESS_KEY_ID": "...",
     *   "AWS_SECRET_ACCESS_KEY": "..."
     * }
     *
     * Example for AWS Bedrock with bearer token:
     * {
     *   "LLM_MODEL": "anthropic.claude-v2",
     *   "AWS_REGION": "us-east-1",
     *   "AWS_BEARER_TOKEN_BEDROCK": "..."
     * }
     *
     * Example for OpenAI:
     * {
     *   "OPENAI_API_KEY": "...",
     *   "OPENAI_MODEL": "gpt-4"
     * }
     *
     * The job container determines which env vars it needs
     */
    llm: Record<string, string>;
    /**
     * Ansible Automation Platform credentials (optional - can be provided by user at runtime)
     * If provided here, these serve as system-wide defaults
     * If not provided, users must supply AAP credentials when creating projects
     * Provide EITHER oauthToken OR username+password, not both
     */
    aap?: {
      url: string;
      orgName: string;
      oauthToken?: string;
      username?: string;
      password?: string;
    };
  };
}

/**
 * Git repository credentials
 */
export interface GitRepoCredentials {
  url: string;
  token: string;
  branch: string;
}

/**
 * AAP credentials that can be provided by user at runtime
 */
export interface AAPCredentials {
  url: string;
  orgName: string;
  oauthToken?: string;
  username?: string;
  password?: string;
}

/**
 * Project credentials provided by user at project creation
 */
export interface ProjectCredentials {
  sourceRepo: GitRepoCredentials;
  targetRepo: GitRepoCredentials;
  /**
   * Optional: AAP credentials provided by user at runtime
   * If not provided, will use credentials from app-config.yaml
   */
  aapCredentials?: AAPCredentials;
}

/**
 * Parameters for creating a Kubernetes job
 */
export interface JobCreateParams {
  jobId: string;
  projectId: string;
  projectName: string;
  phase: MigrationPhase;
  user: string;
  userPrompt?: string;
  callbackToken: string;
  callbackUrl: string;
  /**
   * Module ID - required for analyze, migrate, and publish phases
   */
  moduleId?: string;
  /**
   * Module name - required for analyze, migrate, and publish phases
   */
  moduleName?: string;
  /**
   * Git source repository credentials - will be stored in ephemeral job secret
   */
  sourceRepo: GitRepoCredentials;
  /**
   * Git target repository credentials - will be stored in ephemeral job secret
   */
  targetRepo: GitRepoCredentials;
  /**
   * Optional AAP credentials override - will be stored in project secret
   * If not provided, AAP credentials from app-config.yaml will be used
   */
  aapCredentials?: AAPCredentials;
}
