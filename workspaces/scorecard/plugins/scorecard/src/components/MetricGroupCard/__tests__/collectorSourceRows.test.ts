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

import { toCollectorSourceRows } from '../collectorSourceRows';

describe('toCollectorSourceRows', () => {
  const labels = {
    metricId: 'dora.deploymentFrequency',
    lastSynced: '1 hour ago',
    unknownPlugin: 'Unknown',
    emptyValue: '--',
    unavailableStatus: 'N/A',
    pluginLabels: {
      github: 'GitHub',
      jira: 'Jira',
    },
    statusColor: '#ccc',
  };

  it('maps collector metadata into data-source rows', () => {
    const rows = toCollectorSourceRows(
      [
        {
          id: 'github:deploymentWorkflowRuns',
          description: 'Collects deployments from GitHub Actions.',
        },
        {
          id: 'jira:incidents',
          description: 'Collects Jira incidents.',
        },
      ],
      labels,
    );

    expect(rows).toEqual([
      {
        id: '0',
        plugin: 'GitHub',
        metricId: 'dora.deploymentFrequency',
        metricDescription: 'Collects deployments from GitHub Actions.',
        value: '--',
        evaluationKey: 'noEvaluation',
        statusLabel: 'N/A',
        statusIcon: '',
        statusColor: '#ccc',
        lastSynced: '1 hour ago',
        thresholdExpression: null,
        isCollector: true,
      },
      {
        id: '1',
        plugin: 'Jira',
        metricId: 'dora.deploymentFrequency',
        metricDescription: 'Collects Jira incidents.',
        value: '--',
        evaluationKey: 'noEvaluation',
        statusLabel: 'N/A',
        statusIcon: '',
        statusColor: '#ccc',
        lastSynced: '1 hour ago',
        thresholdExpression: null,
        isCollector: true,
      },
    ]);
  });

  it('falls back to the collector id plugin name when no label is provided', () => {
    const rows = toCollectorSourceRows(
      [
        {
          id: 'pagerduty:incidents',
          description: 'Collects incidents from PagerDuty.',
        },
      ],
      labels,
    );

    expect(rows[0].plugin).toBe('Pagerduty');
  });
});
