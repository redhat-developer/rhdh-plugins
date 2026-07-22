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

import { ProcessInstanceStatusDTO } from '@red-hat-developer-hub/backstage-plugin-orchestrator-common';

import {
  getAuthTokenDescriptors,
  isAbortableState,
  isRerunnableState,
} from './WorkflowInstancePage.helpers';

describe('getAuthTokenDescriptors', () => {
  it('returns undefined when schema is missing', async () => {
    await expect(getAuthTokenDescriptors(undefined)).resolves.toBeUndefined();
  });

  it('returns undefined when AuthRequester widget is absent', async () => {
    await expect(
      getAuthTokenDescriptors({
        type: 'object',
        properties: { name: { type: 'string' } },
      }),
    ).resolves.toBeUndefined();
  });

  it('returns descriptors from an AuthRequester ui:props block', async () => {
    const descriptors = [{ provider: 'oidc', name: 'token' }];
    await expect(
      getAuthTokenDescriptors({
        type: 'object',
        properties: {
          auth: {
            type: 'object',
            'ui:widget': 'AuthRequester',
            'ui:props': { authTokenDescriptors: descriptors },
          },
        },
      }),
    ).resolves.toEqual(descriptors);
  });
});

describe('isAbortableState / isRerunnableState', () => {
  it('marks Active and Error as abortable', () => {
    expect(isAbortableState(ProcessInstanceStatusDTO.Active)).toBe(true);
    expect(isAbortableState(ProcessInstanceStatusDTO.Error)).toBe(true);
    expect(isAbortableState(ProcessInstanceStatusDTO.Completed)).toBe(false);
  });

  it('marks Completed, Aborted, and Error as rerunnable', () => {
    expect(isRerunnableState(ProcessInstanceStatusDTO.Completed)).toBe(true);
    expect(isRerunnableState(ProcessInstanceStatusDTO.Aborted)).toBe(true);
    expect(isRerunnableState(ProcessInstanceStatusDTO.Error)).toBe(true);
    expect(isRerunnableState(ProcessInstanceStatusDTO.Active)).toBe(false);
  });
});
