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
import type { Entity } from '@backstage/catalog-model';
import type { Collector } from '@red-hat-developer-hub/backstage-plugin-scorecard-node';
import { z } from 'zod';
import {
  buildJqlFiltersFromEntity,
  INCIDENT_FILTER_ANNOTATIONS,
  ScorecardJiraAnnotations,
} from '../annotations';
import { JiraClient } from '../clients/base';
import {
  parseJiraIncidentsConfigOptions,
  type JiraIncidentOptions,
} from './JiraIncidentsConfig';
import { buildIncidentJql } from './incidentJql';
import {
  incidentsCollectorInputSchema,
  incidentsCollectorOutputSchema,
} from './schemas/incidentsSchemas';

const { PROJECT_KEY } = ScorecardJiraAnnotations;

export class JiraIncidentsCollector
  implements
    Collector<
      (typeof JiraIncidentsCollector)['inputSchema'],
      (typeof JiraIncidentsCollector)['outputSchema']
    >
{
  static readonly inputSchema = incidentsCollectorInputSchema;
  static readonly outputSchema = incidentsCollectorOutputSchema;

  private readonly jiraClient: JiraClient;
  private readonly incidentOptions: JiraIncidentOptions;

  private constructor(
    jiraClient: JiraClient,
    incidentOptions: JiraIncidentOptions,
  ) {
    this.jiraClient = jiraClient;
    this.incidentOptions = incidentOptions;
  }

  static fromConfig(
    config: Config,
    options: { jiraClient: JiraClient },
  ): JiraIncidentsCollector {
    return new JiraIncidentsCollector(
      options.jiraClient,
      parseJiraIncidentsConfigOptions(config),
    );
  }

  getCollectorId(): string {
    return 'jira:incidents';
  }

  getCollectorDescription(): string {
    return 'Collects Jira incidents.';
  }

  getInputSchema() {
    return JiraIncidentsCollector.inputSchema;
  }

  getOutputSchema() {
    return JiraIncidentsCollector.outputSchema;
  }

  async collect(options: {
    entity: Entity;
    input: z.infer<(typeof JiraIncidentsCollector)['inputSchema']>;
  }): Promise<z.infer<(typeof JiraIncidentsCollector)['outputSchema']>> {
    const entityFilters = buildJqlFiltersFromEntity(
      options.entity,
      INCIDENT_FILTER_ANNOTATIONS,
      { projectFallback: PROJECT_KEY },
    );
    const jql = buildIncidentJql(
      entityFilters,
      {
        from: options.input.from,
        to: options.input.to,
        issueType: this.incidentOptions.issueType,
      },
      options.entity,
    );
    const incidents = await this.jiraClient.getIssues(jql);

    return {
      incidents,
    };
  }
}
