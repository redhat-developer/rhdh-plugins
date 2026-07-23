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

import { slicePaginatedPage } from './WorkflowsTabContent.helpers';

describe('slicePaginatedPage', () => {
  const overviews = [
    { workflowId: 'a' },
    { workflowId: 'b' },
    { workflowId: 'c' },
    { workflowId: 'd' },
  ] as WorkflowOverviewDTO[];

  it('returns the requested page slice', () => {
    expect(slicePaginatedPage(overviews, 0, 2)).toEqual([
      overviews[0],
      overviews[1],
    ]);
    expect(slicePaginatedPage(overviews, 1, 2)).toEqual([
      overviews[2],
      overviews[3],
    ]);
  });

  it('returns a short final page when near the end', () => {
    expect(slicePaginatedPage(overviews, 1, 3)).toEqual([overviews[3]]);
  });
});
