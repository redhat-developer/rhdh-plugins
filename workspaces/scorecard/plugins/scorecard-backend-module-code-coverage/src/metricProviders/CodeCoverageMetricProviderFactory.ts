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
import type {
  AuthService,
  DiscoveryService,
  LoggerService,
} from '@backstage/backend-plugin-api';
import { MetricProvider } from '@red-hat-developer-hub/backstage-plugin-scorecard-node';

import { CodeCoverageClient } from '../clients/CodeCoverageClient';
import {
  CodeCoverageMetricProvider,
  CODE_COVERAGE_METRICS,
  type CodeCoverageMetricId,
} from './CodeCoverageMetricProvider';

/**
 * Creates a single code-coverage metric provider for the given metric ID.
 */
export function createCodeCoverageMetricProvider(
  client: CodeCoverageClient,
  metricId: CodeCoverageMetricId,
): MetricProvider<'number'> {
  return new CodeCoverageMetricProvider(client, metricId);
}

/**
 * Creates one metric provider per code-coverage metric (8 total).
 * A single shared CodeCoverageClient is used across all providers.
 */
export function createCodeCoverageMetricProviders(
  auth: AuthService,
  discovery: DiscoveryService,
  logger: LoggerService,
): MetricProvider<'number'>[] {
  const client = new CodeCoverageClient(auth, discovery, logger);
  return CODE_COVERAGE_METRICS.map(metricId =>
    createCodeCoverageMetricProvider(client, metricId),
  );
}
