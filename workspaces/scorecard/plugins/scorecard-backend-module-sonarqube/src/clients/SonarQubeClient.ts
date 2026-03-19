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

import type { LoggerService } from '@backstage/backend-plugin-api';
import type { Config } from '@backstage/config';

const DEFAULT_BASE_URL = 'https://sonarcloud.io';

export class SonarQubeClient {
  private readonly baseUrl: string;
  private readonly token: string | undefined;
  private readonly logger: LoggerService;

  constructor(config: Config, logger: LoggerService) {
    this.baseUrl = (
      config.getOptionalString('sonarqube.baseUrl') ?? DEFAULT_BASE_URL
    ).replace(/\/$/, '');
    this.token = config.getOptionalString('sonarqube.token');
    this.logger = logger.child({ component: 'SonarQubeClient' });
  }

  private async fetchApi(path: string): Promise<any> {
    const url = `${this.baseUrl}${path}`;
    const headers: Record<string, string> = {};
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }
    const response = await fetch(url, { headers });
    if (!response.ok) {
      throw new Error(
        `SonarQube API error: ${response.status} ${response.statusText} for ${url}`,
      );
    }
    return response.json();
  }

  async getQualityGateStatus(projectKey: string): Promise<boolean> {
    this.logger.debug(`Fetching quality gate status for project ${projectKey}`);
    const data = await this.fetchApi(
      `/api/qualitygates/project_status?projectKey=${encodeURIComponent(
        projectKey,
      )}`,
    );
    return data.projectStatus.status === 'OK';
  }

  async getOpenIssuesCount(projectKey: string): Promise<number> {
    this.logger.debug(`Fetching open issues count for project ${projectKey}`);
    const data = await this.fetchApi(
      `/api/issues/search?componentKeys=${encodeURIComponent(
        projectKey,
      )}&statuses=OPEN,CONFIRMED,REOPENED&ps=1`,
    );
    return data.total;
  }

  async getMeasures(
    projectKey: string,
    metricKeys: string[],
  ): Promise<Record<string, number>> {
    this.logger.debug(
      `Fetching measures [${metricKeys.join(', ')}] for project ${projectKey}`,
    );
    const data = await this.fetchApi(
      `/api/measures/component?component=${encodeURIComponent(
        projectKey,
      )}&metricKeys=${encodeURIComponent(metricKeys.join(','))}`,
    );

    const result: Record<string, number> = {};
    for (const measure of data.component.measures) {
      result[measure.metric] = Number(measure.value);
    }
    return result;
  }
}
