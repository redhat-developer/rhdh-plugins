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
 * Default configuration constants
 * These are used as fallbacks when values are not provided in app-config.yaml
 */

// LLM Configuration
/**
 * Default LLM model to use if not specified in configuration
 */
export const DEFAULT_LLM_MODEL = 'anthropic.claude-v2';

// Kubernetes Job Configuration
/**
 * Default Kubernetes namespace for X2A jobs
 */
export const DEFAULT_KUBERNETES_NAMESPACE = 'default';

/**
 * Default X2A convertor container image
 */
export const DEFAULT_KUBERNETES_IMAGE = 'quay.io/x2ansible/x2a-convertor';

/**
 * Default X2A convertor container image tag
 */
export const DEFAULT_KUBERNETES_IMAGE_TAG = 'latest';

/**
 * Default TTL for completed jobs in seconds (24 hours)
 */
export const DEFAULT_TTL_SECONDS_AFTER_FINISHED = 86400;

// Resource Defaults
/**
 * Default CPU request for job pods
 */
export const DEFAULT_CPU_REQUEST = '500m';

/**
 * Default memory request for job pods
 */
export const DEFAULT_MEMORY_REQUEST = '1Gi';

/**
 * Default CPU limit for job pods
 */
export const DEFAULT_CPU_LIMIT = '2000m';

/**
 * Default memory limit for job pods
 */
export const DEFAULT_MEMORY_LIMIT = '4Gi';

// Git Configuration
/**
 * Default git commit author name
 */
export const DEFAULT_GIT_AUTHOR_NAME = 'X2A Migration Bot';

/**
 * Default git commit author email
 */
export const DEFAULT_GIT_AUTHOR_EMAIL = 'x2a-bot@redhat.com';
