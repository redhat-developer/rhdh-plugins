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

import { Agent, fetch } from 'undici';

/** Fields read from Loki `query_range` JSON responses in this provider. */
interface LokiQueryRangeJsonBody {
  data: {
    result: Array<{ values: [string, string][] }>;
  };
}

type LokiParsedLogLine = { id: string; log: string };

export class LokiProvider implements WorkflowLogProvider {
  private readonly baseURL: string;
  private readonly token: string;
  private readonly selectors: any;
  private readonly rejectUnauthorized: boolean;
  private readonly logPipelineFilters: any;
  private readonly limit: number;
  private readonly agent: Agent;
  private constructor(config: Config) {
    this.baseURL = config.getString('baseUrl');
    this.token = config.getString('token');
    // Only should be false if specified, undefined here should be true
    this.rejectUnauthorized =
      config.getOptionalBoolean('rejectUnauthorized') === false ? false : true;
    this.selectors = config.getOptional('logStreamSelectors') || [];
    this.logPipelineFilters = config.getOptional('logPipelineFilters') || [];
    this.limit = config.getOptionalNumber('limit') || 100;
    this.agent = new Agent({
      connect: {
        rejectUnauthorized: this.rejectUnauthorized,
      },
    });
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

  getToken(): string {
    return this.token;
  }

  getRejectUnauthorized(): boolean {
    return this.rejectUnauthorized;
  }

  async fetchWorkflowLogsByInstance(
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
    // The log stream selector part of the query here is defaulting to openshift_log_type=application
    // This is the value used for Openshift Logging
    // This might need to be configurable, based on https://grafana.com/docs/loki/latest/query/log_queries/#log-stream-selector
    // Log pipeline part looks for the workflow instance id in those logs
    // Create the streamSelector
    let streamSelector: string = '';
    if (this.selectors.length < 1) {
      streamSelector = 'openshift_log_type="application"';
    } else {
      this.selectors.forEach(
        (
          entry: { label: any; value: any },
          index: number,
          arr: string | any[],
        ) => {
          // something about that last comma
          // TODO: Ensure all queries have at least one strict equality matcher (e.g., {app="frontend"}), not just broad regular expressions (e.g., app=~".*").
          // TODO: don't allow the =~ or the !~ characters in the value
          // TODO sanitize the entry.labe and entry.value to prevent injection attacks
          streamSelector += `${entry.label || 'openshift_log_type'}${entry.value || '="application"'}${index !== arr.length - 1 ? ',' : ''}`;
        },
      );
    }
    let logPipelineFilter: string = `|="${instance.id}"`;

    if (this.logPipelineFilters.length > 0) {
      this.logPipelineFilters.forEach((element: any) => {
        logPipelineFilter += ` ${element}`;
      });
    }

    const params = new URLSearchParams({
      query: `{${streamSelector}} ${logPipelineFilter}`,
      start: startTime as string,
      end: endTime as string,
      limit: this.limit.toString(),
    });

    const urlToFetch = `${this.baseURL}${lokiApiEndpoint}?${params.toString()}`;

    let allResults!: LokiParsedLogLine[];
    try {
      const response = await fetch(urlToFetch, {
        dispatcher: this.agent,
        headers: {
          Authorization: `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error(await response.text());
      }

      const jsonResponse = (await response.json()) as LokiQueryRangeJsonBody;

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
        .flatMap(entry => entry.values)
        .map(([id, log]) => ({ id, log }));
    } catch (error) {
      throw new Error(`Problem fetching loki logs: ${error.message}`);
    }

    allResults.sort(
      (a: LokiParsedLogLine, b: LokiParsedLogLine) =>
        Number(a.id) - Number(b.id),
    );

    const workflowLogsResponse: WorkflowLogsResponse = {
      instanceId: instance.id,
      logs: allResults,
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
