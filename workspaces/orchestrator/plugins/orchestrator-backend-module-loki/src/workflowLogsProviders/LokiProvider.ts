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
  private constructor(config: Config) {
    // TODO: will probably also need information regarding auth tokens and stuff for loki
    // Might Also make sense to separate out the loki http stuff to its own "client"
    this.baseURL = config.getString('baseUrl');
  }
  getBaseURL(): string {
    return this.baseURL;
  }

  getProviderId() {
    return 'loki';
  }

  async fetchWorkflowLogsByIntance(
    instance: ProcessInstanceDTO,
  ): Promise<WorkflowLogsResponse> {
    // Becuase of timing issues, subtract 5 mintues from the start and add 5 minutes to the end
    const startTime = DateTime.fromISO(instance.start as string, {
      setZone: true,
    })
      .minus({ minutes: 5 })
      .toISO();
    const endTime = instance.end
      ? DateTime.fromISO(instance.end as string, { setZone: true })
          .plus({ minutes: 5 })
          .toISO()
      : '';
    const lokiApiEndpoint = '/loki/api/v1/query_range';
    const params = new URLSearchParams({
      query: `{service_name=~".+"} |="${instance.id}"`,
      start: startTime as string,
      end: endTime as string,
    });

    const urlToFetch = `${this.baseURL}${lokiApiEndpoint}?${params.toString()}`;

    const response = await fetch(urlToFetch);

    let allResults;
    if (response.status > 399) {
      // TODO: These are errors, throw something here
      console.log('Error', response.statusText, response);
    } else {
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
      // Reduce the results into another array
      allResults = jsonResponse.data.result.reduce(
        (acc: any[], curr: { values: any[] }) => {
          curr.values.reduce((_: any, innerCurr: any) => {
            acc.push({
              id: innerCurr[0],
              log: innerCurr[1],
            });
            return;
          }, acc);
          return acc;
        },
        [],
      );
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
