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

import { mapJiraIssues } from './mappers';
import type { JiraSearchIssue } from './schemas/jiraSearchIssue';

describe('mapJiraIssues', () => {
  const issues: JiraSearchIssue[] = [
    {
      id: '10001',
      fields: {
        created: '2026-06-01T10:00:00.000+0530',
        resolutiondate: '2026-06-01T12:00:00.000+0530',
      },
    },
    {
      id: '10002',
      fields: {
        created: '2026-06-02T10:00:00.000Z',
        resolutiondate: null,
      },
    },
  ];

  it('should map Jira API search issues to domain issues', () => {
    expect(mapJiraIssues(issues)).toEqual([
      {
        id: '10001',
        createdAt: '2026-06-01T04:30:00.000Z',
        resolutionAt: '2026-06-01T06:30:00.000Z',
      },
      {
        id: '10002',
        createdAt: '2026-06-02T10:00:00.000Z',
        resolutionAt: null,
      },
    ]);
  });
});
