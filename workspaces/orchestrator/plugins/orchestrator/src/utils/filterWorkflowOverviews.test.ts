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

import { WorkflowOverviewDTO } from '@red-hat-developer-hub/backstage-plugin-orchestrator-common';

import { filterWorkflowOverviewsBySearch } from './filterWorkflowOverviews';

describe('filterWorkflowOverviewsBySearch', () => {
  const overviews: WorkflowOverviewDTO[] = [
    {
      workflowId: 'hello',
      name: 'Hello World Workflow',
      version: '1.0',
      format: 'yaml',
    },
    {
      workflowId: 'assessment',
      name: 'Assessment Workflow',
      version: '2.0',
      format: 'yaml',
    },
  ];

  it('returns all overviews when search is empty', () => {
    expect(filterWorkflowOverviewsBySearch(overviews, '')).toEqual(overviews);
  });

  it('filters overviews by name across the full list', () => {
    expect(filterWorkflowOverviewsBySearch(overviews, 'assessment')).toEqual([
      overviews[1],
    ]);
  });
});
