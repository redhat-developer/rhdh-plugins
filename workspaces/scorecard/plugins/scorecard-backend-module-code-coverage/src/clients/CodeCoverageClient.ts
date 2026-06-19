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
  DiscoveryService,
  LoggerService,
} from '@backstage/backend-plugin-api';
import type { CodeCoverageReport } from './types';

export class CodeCoverageClient {
  private readonly discovery: DiscoveryService;
  private readonly logger: LoggerService;

  constructor(discovery: DiscoveryService, logger: LoggerService) {
    this.discovery = discovery;
    this.logger = logger.child({ component: 'CodeCoverageClient' });
  }

  async getReport(entityRef: string): Promise<CodeCoverageReport> {
    const baseUrl = await this.discovery.getBaseUrl('code-coverage');
    const url = `${baseUrl}/report?entity=${encodeURIComponent(entityRef)}`;

    this.logger.debug(`Fetching code coverage report for entity ${entityRef}`);

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(
        `Code coverage API error: ${response.status} ${response.statusText} for ${url}`,
      );
    }
    return response.json() as Promise<CodeCoverageReport>;
  }
}
