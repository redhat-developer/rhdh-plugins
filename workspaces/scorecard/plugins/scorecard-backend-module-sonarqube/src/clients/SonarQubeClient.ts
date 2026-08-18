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

type SonarQubeInstance = {
  baseUrl: string;
  apiKey?: string;
  authType: 'Bearer' | 'Basic';
};

export class SonarQubeClient {
  private readonly config: Config;
  private readonly logger: LoggerService;

  constructor(config: Config, logger: LoggerService) {
    this.config = config;
    this.logger = logger.child({ component: 'SonarQubeClient' });
  }

  private resolveInstance(instanceName?: string): SonarQubeInstance {
    const sonarqubeConfig = this.config.getOptionalConfig('sonarqube');

    if (instanceName && sonarqubeConfig) {
      const instances =
        sonarqubeConfig.getOptionalConfigArray('instances') ?? [];
      const instance = instances.find(
        i => i.getString('name') === instanceName,
      );
      if (instance) {
        return {
          baseUrl: instance.getString('baseUrl').replace(/\/$/, ''),
          apiKey: instance.getOptionalString('apiKey'),
          authType:
            (instance.getOptionalString('authType') as
              | 'Bearer'
              | 'Basic'
              | undefined) ?? 'Basic',
        };
      }
      throw new Error(
        `SonarQube instance '${instanceName}' not found in configuration`,
      );
    }

    return {
      baseUrl: (
        sonarqubeConfig?.getOptionalString('baseUrl') ?? DEFAULT_BASE_URL
      ).replace(/\/$/, ''),
      apiKey: sonarqubeConfig?.getOptionalString('apiKey'),
      authType: 'Basic',
    };
  }

  private async fetchApi(path: string, instanceName?: string): Promise<any> {
    const instance = this.resolveInstance(instanceName);
    const url = `${instance.baseUrl}${path}`;
    const headers: Record<string, string> = {};
    if (instance.apiKey) {
      if (instance.authType === 'Basic') {
        const encoded = Buffer.from(`${instance.apiKey}:`).toString('base64');
        headers.Authorization = `Basic ${encoded}`;
      } else {
        headers.Authorization = `${instance.authType} ${instance.apiKey}`;
      }
    }
    const response = await fetch(url, { headers });
    if (!response.ok) {
      throw new Error(
        `SonarQube API error: ${response.status} ${response.statusText} for ${url}`,
      );
    }
    return response.json();
  }

  async getQualityGateStatus(
    projectKey: string,
    instanceName?: string,
  ): Promise<boolean> {
    this.logger.debug(`Fetching quality gate status for project ${projectKey}`);
    const data = await this.fetchApi(
      `/api/qualitygates/project_status?projectKey=${encodeURIComponent(
        projectKey,
      )}`,
      instanceName,
    );
    return data.projectStatus.status === 'OK';
  }

  async getOpenIssuesCount(
    projectKey: string,
    instanceName?: string,
  ): Promise<number> {
    this.logger.debug(`Fetching open issues count for project ${projectKey}`);
    const data = await this.fetchApi(
      `/api/issues/search?componentKeys=${encodeURIComponent(
        projectKey,
      )}&statuses=OPEN,CONFIRMED,REOPENED&ps=1`,
      instanceName,
    );
    return data.total;
  }

  async getMeasures(
    projectKey: string,
    metricKeys: string[],
    instanceName?: string,
  ): Promise<Record<string, number>> {
    this.logger.debug(
      `Fetching measures [${metricKeys.join(', ')}] for project ${projectKey}`,
    );
    const data = await this.fetchApi(
      `/api/measures/component?component=${encodeURIComponent(
        projectKey,
      )}&metricKeys=${encodeURIComponent(metricKeys.join(','))}`,
      instanceName,
    );

    const result: Record<string, number> = {};
    for (const measure of data.component.measures) {
      result[measure.metric] = Number(measure.value);
    }
    return result;
  }
}
