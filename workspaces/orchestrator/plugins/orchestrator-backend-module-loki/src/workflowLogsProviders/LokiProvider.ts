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

import type { Config } from '@backstage/config';
import { DateTime } from 'luxon';
import {
  ProcessInstanceDTO,
  WorkflowLogsResponse,
} from '@red-hat-developer-hub/backstage-plugin-orchestrator-common';
import { WorkflowLogProvider } from '@red-hat-developer-hub/backstage-plugin-orchestrator-node';

export class LokiProvider implements WorkflowLogProvider {
  private readonly baseURL: string;
  private readonly selectors: any;
  private constructor(config: Config) {
    this.baseURL = config.getString('baseUrl');
    this.selectors = config.getOptional('logStreamSelectors') || [];
  }
  getBaseURL(): string {
    return this.baseURL;
  }

  getProviderId() {
    return 'loki';
  }

  getSelectors() {
    return this.selectors;
  }

  async fetchWorkflowLogsByIntance(
    instance: ProcessInstanceDTO,
  ): Promise<WorkflowLogsResponse> {
    // Because of timing issues, subtract 5 mintues from the start and add 5 minutes to the end
    const startTime = DateTime.fromISO(instance.start as string, {
      setZone: true,
    })
      .minus({ minutes: 5 })
      .toISO();
    // Loki queries time range can't exceeds the limit (query length: 959h37m33.575s, limit: 30d1h)
    // If there is no end date specified, then just add 29 days to the start date
    // Assume that if there is an end date the range between start and end isn't more than 30 days
    const endTime = instance.end
      ? DateTime.fromISO(instance.end as string, { setZone: true })
          .plus({ minutes: 5 })
          .toISO()
      : DateTime.fromISO(instance.start as string, { setZone: true })
          .plus({ days: 29 })
          .toISO();
    const lokiApiEndpoint = '/loki/api/v1/query_range';
    // Query is created with a log stream selector and then a log pipeline for more filtering
    // format looks like this: {stream-selector=expression} | log pipeline/log filter expression
    // The log stream selector part of the query here is getting all service names
    // This might need to be configurable, based on https://grafana.com/docs/loki/latest/query/log_queries/#log-stream-selector
    // Log pipeline part looks for the workflow instance id in those logs
    // Create the streamSelector
    let streamSelector: string = '';
    if (this.selectors.length < 1) {
      streamSelector = 'service_name=~".+"';
    } else {
      this.selectors.forEach(
        (
          entry: { label: any; value: any },
          index: number,
          arr: string | any[],
        ) => {
          // somehting about that last comma
          streamSelector += `${entry.label || 'service_name'}${entry.value || '=~".+"'}${index !== arr.length - 1 ? ',' : ''}`;
        },
      );
    }
    const logPipelineFilter = `|="${instance.id}"`;
    const params = new URLSearchParams({
      query: `{${streamSelector}} ${logPipelineFilter}`,
      start: startTime as string,
      end: endTime as string,
    });

    const urlToFetch = `${this.baseURL}${lokiApiEndpoint}?${params.toString()}`;

    let allResults;
    try {
      const response = await fetch(urlToFetch);
      if (!response.ok) {
        throw new Error(await response.text());
      }

      const jsonResponse = await response.json();

      /**
      Data should look like this
        {
          "instanceId": "efe0490f-6300-453b-bcb6-f47eb7efbb36",
          "logs": [
              {
                id: "1763129443414066000",
                log: "2025-11-14 14:08:52,645 d5932f2cb566 INFO [org.kie.kogito.serverless.workflow.devservices.DevModeServerlessWorkflowLogger:40] (executor-thread-97) Starting workflow 'hello_world' (efe0490f-6300-453b-bcb6-f47eb7efbb36)"
              },
          ...
          ]
        }
      */
      // flatMap and map the results to an array like this:
      /**
       * {
       *   id: '123456',
       *   log: '2025-11-14 14:08:52,645 d5932f2cb566 INFO [org.kie.kogito.serverless.workflow.devservices.De....'
       * }
       */
      allResults = jsonResponse.data.result
        .flatMap((val: any[]) => {
          return val.values;
        })
        .map((val: any[]) => {
          return {
            id: val[0],
            log: val[1],
          };
        });
    } catch (error) {
      throw new Error(`Problem fetching loki logs: ${error.message}`);
    }

    const workflowLogsResponse: WorkflowLogsResponse = {
      instanceId: instance.id,
      logs: allResults.sort((a: { id: number }, b: { id: number }) => {
        return Number(a.id) - Number(b.id);
      }),
    };
    return workflowLogsResponse;
  }

  static fromConfig(config: Config): LokiProvider {
    const lokiConfig = config.getConfig(
      'orchestrator.workflowLogProvider.loki',
    );
    return new LokiProvider(lokiConfig);
  }
}
