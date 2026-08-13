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
 * Shared utilities for Boost AI catalog connector entity providers.
 *
 * Provides CA bundle resolution, fault isolation wrappers,
 * enable/disable patterns, and configurable endpoint/credential
 * validation for air-gapped deployments.
 *
 * @packageDocumentation
 */

export { loadCaBundle, createHttpsAgent } from './ca-bundle';
export {
  createProviderWrapper,
  createSafeRefresh,
  classifyConnectorError,
  type FaultIsolationContext,
} from './fault-isolation';
export {
  isConnectorEnabled,
  safeGetOptionalString,
  validateConnectorStartupConfig,
} from './config';
export type {
  ConnectorEntityProvider,
  ConnectorErrorContext,
  ValidateConnectorStartupConfigOptions,
} from './types';
