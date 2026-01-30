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
 * X2A configuration structure
 * This is the runtime type extracted from app-config.yaml
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
    llm: Record<string, string>;
    aap?: {
      url: string;
      orgName: string;
      oauthToken?: string;
      username?: string;
      password?: string;
    };
  };
}

export interface Config {
  x2a?: {
    /**
     * Kubernetes configuration for X2A jobs
     */
    kubernetes?: {
      /**
       * Kubernetes namespace where jobs will be created
       * @visibility backend
       */
      namespace?: string;
      /**
       * X2A convertor container image
       * @visibility backend
       */
      image?: string;
      /**
       * X2A convertor container image tag
       * @visibility backend
       */
      imageTag?: string;
      /**
       * Auto-delete completed jobs after this many seconds (default: 86400 = 24 hours)
       * @visibility backend
       */
      ttlSecondsAfterFinished?: number;
      /**
       * Resource requests and limits for job pods
       * @visibility backend
       */
      resources?: {
        requests?: {
          cpu?: string;
          memory?: string;
        };
        limits?: {
          cpu?: string;
          memory?: string;
        };
      };
    };
    /**
     * Credentials configuration for X2A
     */
    credentials?: {
      /**
       * LLM provider credentials as environment variables.
       * Generic key-value pairs that will be passed to the job container as env vars.
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
       * The job container determines which env vars it needs.
       * @visibility backend
       */
      llm?: { [key: string]: string };
      /**
       * Ansible Automation Platform credentials (optional - can be provided by user at runtime).
       * If provided here, these serve as system-wide defaults.
       * If not provided, users must supply AAP credentials when creating projects.
       * Provide EITHER oauthToken OR username+password, not both.
       * @visibility backend
       */
      aap?: {
        /**
         * AAP instance URL
         */
        url?: string;
        /**
         * AAP organization name
         */
        orgName?: string;
        /**
         * OAuth token for AAP authentication
         */
        oauthToken?: string;
        /**
         * Username for AAP authentication (alternative to oauthToken)
         */
        username?: string;
        /**
         * Password for AAP authentication (alternative to oauthToken)
         */
        password?: string;
      };
    };
  };
}
