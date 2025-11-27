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
    // Fetch the logs, probably add something to that orchestrator service object? OR maybe a logViewerService object instead
    // We are not querying actual orchestrator since the logs don't live there
    // Query will be against the log provider, like Loki for example
    // logViewerService is probably going to be the new class/interface that other providers can implement in the future

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
    if (response.status !== 200) {
      console.log('Error', response.statusText, response);
    } else {
      const jsonResponse = await response.json();
      // Reduce the results into another array
      allResults = jsonResponse.data.result.reduce(
        (acc: any[], curr: { values: any[] }) => {
          curr.values.reduce((_innerAcc: any, innerCurr: any) => {
            acc.push(innerCurr);
          }, acc);
          return acc;
        },
        [],
      );
    }
    const workflowLogsResponse: WorkflowLogsResponse = {
      instanceId: instance.id,
      logs: allResults.sort((a: number[], b: number[]) => {
        return a[0] - b[0];
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
