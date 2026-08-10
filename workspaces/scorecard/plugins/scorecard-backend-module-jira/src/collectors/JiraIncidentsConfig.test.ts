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

import { newMockRootConfig } from '../../__fixtures__/testUtils';
import { parseJiraIncidentsConfigOptions } from './JiraIncidentsConfig';

describe('parseJiraIncidentsConfigOptions', () => {
  it('should return empty options when options are not configured', () => {
    const config = newMockRootConfig();

    expect(parseJiraIncidentsConfigOptions(config)).toEqual({
      issueType: undefined,
    });
  });

  it('should parse issueType from options', () => {
    const config = newMockRootConfig({
      incidentOptions: {
        issueType: 'ServiceIncident',
      },
    });

    expect(parseJiraIncidentsConfigOptions(config)).toEqual({
      issueType: 'ServiceIncident',
    });
  });

  it('should return undefined issueType when options exist without issueType', () => {
    const config = newMockRootConfig({
      incidentOptions: {},
    });

    expect(parseJiraIncidentsConfigOptions(config)).toEqual({
      issueType: undefined,
    });
  });
});
