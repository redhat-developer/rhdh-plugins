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

import {
  ProcessInstanceDTO,
  ProcessInstanceStatusDTO,
} from '@red-hat-developer-hub/backstage-plugin-orchestrator-common';

import { VALUE_UNAVAILABLE } from '../../constants';
import { mapProcessInstanceToDetails } from './WorkflowInstancePageContent';

const t = (key: string) => key;

describe('mapProcessInstanceToDetails', () => {
  it('maps a completed instance with duration and variables', () => {
    const instance = {
      id: 'inst-1',
      processId: 'wf-1',
      processName: 'Greeting',
      state: ProcessInstanceStatusDTO.Completed,
      start: '2024-01-01T10:00:00.000Z',
      end: '2024-01-01T10:00:05.000Z',
      description: 'demo',
      version: '1.0',
      initiatorEntity: 'user:default/alice',
      targetEntity: 'component:default/app',
      workflowdata: { result: 'ok', input: { name: 'world' } },
    } as ProcessInstanceDTO;

    const details = mapProcessInstanceToDetails(instance, t);

    expect(details.id).toBe('inst-1');
    expect(details.workflowId).toBe('wf-1');
    expect(details.processName).toBe('Greeting');
    expect(details.state).toBe(ProcessInstanceStatusDTO.Completed);
    expect(details.startIso).toBe('2024-01-01T10:00:00.000Z');
    expect(details.duration).not.toBe(VALUE_UNAVAILABLE);
    expect(details.hasVariables).toBe(true);
    expect(details.initiatorEntity).toBe('user:default/alice');
    expect(details.targetEntity).toBe('component:default/app');
  });

  it('uses unavailable placeholders when start/name are missing', () => {
    const instance = {
      id: 'inst-2',
      processId: 'wf-2',
      state: ProcessInstanceStatusDTO.Active,
    } as ProcessInstanceDTO;

    const details = mapProcessInstanceToDetails(instance, t);

    expect(details.processName).toBe(VALUE_UNAVAILABLE);
    expect(details.start).toBe(VALUE_UNAVAILABLE);
    expect(details.duration).toBe(VALUE_UNAVAILABLE);
    expect(details.hasVariables).toBe(false);
  });
});
