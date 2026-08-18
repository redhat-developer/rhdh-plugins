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
import { parseJiraOpenIssuesConfigOptions } from './JiraOpenIssuesConfig';

describe('parseJiraOpenIssuesConfigOptions', () => {
  it('should return empty options when options are not configured', () => {
    const config = newMockRootConfig();

    expect(parseJiraOpenIssuesConfigOptions(config)).toEqual({
      mandatoryFilter: undefined,
      customFilter: undefined,
    });
  });

  it('should parse mandatoryFilter and customFilter from options', () => {
    const config = newMockRootConfig({
      options: {
        mandatoryFilter: 'type = Task',
        customFilter: 'priority = High',
      },
    });

    expect(parseJiraOpenIssuesConfigOptions(config)).toEqual({
      mandatoryFilter: 'type = Task',
      customFilter: 'priority = High',
    });
  });

  it('should parse partial options', () => {
    const config = newMockRootConfig({
      options: {
        mandatoryFilter: 'resolution = Unresolved',
      },
    });

    expect(parseJiraOpenIssuesConfigOptions(config)).toEqual({
      mandatoryFilter: 'resolution = Unresolved',
      customFilter: undefined,
    });
  });
});
