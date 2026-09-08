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

import type { Agent } from '@red-hat-developer-hub/backstage-plugin-dcm-common';
import {
  agentToForm,
  emptyAgentForm,
  formToAgentRegistration,
  isAgentFormValid,
  validateAgentForm,
  type AgentForm,
} from './agentFormTypes';

const VALID_FORM: AgentForm = {
  name: 'env-agent-west-1',
  environment: 'production',
  service_types: ['vm', 'container'],
  cost: 'medium',
  topic_name: 'dcm.agent.env-agent-west-1',
};

describe('emptyAgentForm', () => {
  it('returns empty strings and empty array', () => {
    const form = emptyAgentForm();
    expect(form.name).toBe('');
    expect(form.environment).toBe('');
    expect(form.service_types).toEqual([]);
    expect(form.cost).toBe('');
    expect(form.topic_name).toBe('');
  });
});

describe('isAgentFormValid', () => {
  it('returns true for a fully valid form', () => {
    expect(isAgentFormValid(VALID_FORM)).toBe(true);
  });

  it('returns false when name is empty', () => {
    expect(isAgentFormValid({ ...VALID_FORM, name: '' })).toBe(false);
  });

  it('returns false when name starts with a digit', () => {
    expect(isAgentFormValid({ ...VALID_FORM, name: '1abc' })).toBe(false);
  });

  it('returns false when environment is empty', () => {
    expect(isAgentFormValid({ ...VALID_FORM, environment: '' })).toBe(false);
  });

  it('returns false when service_types is empty', () => {
    expect(isAgentFormValid({ ...VALID_FORM, service_types: [] })).toBe(false);
  });

  it('returns false when cost is empty', () => {
    expect(isAgentFormValid({ ...VALID_FORM, cost: '' })).toBe(false);
  });

  it('returns false when cost is not a valid option', () => {
    expect(
      isAgentFormValid({
        ...VALID_FORM,
        cost: 'not-a-cost' as AgentForm['cost'],
      }),
    ).toBe(false);
  });

  it('returns false when topic_name is empty', () => {
    expect(isAgentFormValid({ ...VALID_FORM, topic_name: '' })).toBe(false);
  });

  it('returns false when topic_name does not start with dcm.agent.', () => {
    expect(
      isAgentFormValid({ ...VALID_FORM, topic_name: 'other.topic.name' }),
    ).toBe(false);
  });
});

describe('validateAgentForm', () => {
  it('returns empty errors for a valid form', () => {
    expect(validateAgentForm(VALID_FORM)).toEqual({});
  });

  it('returns nameRequired error for empty name', () => {
    const errors = validateAgentForm({ ...VALID_FORM, name: '' });
    expect(errors.name).toBeDefined();
  });

  it('returns namePattern error for invalid name characters', () => {
    const errors = validateAgentForm({ ...VALID_FORM, name: 'My Agent' });
    expect(errors.name).toBeDefined();
  });

  it('returns topicNamePattern error for bad topic_name', () => {
    const errors = validateAgentForm({
      ...VALID_FORM,
      topic_name: 'not-a-dcm-topic',
    });
    expect(errors.topic_name).toBeDefined();
  });
});

describe('agentToForm', () => {
  it('maps Agent to AgentForm correctly', () => {
    const agent: Agent = {
      name: 'my-agent',
      environment: 'staging',
      service_types: ['vm'],
      cost: 'low',
      topic_name: 'dcm.agent.my-agent',
      agent_id: 'abc-123',
      health_status: 'ready',
    };

    const form = agentToForm(agent);

    expect(form).toEqual({
      name: 'my-agent',
      environment: 'staging',
      service_types: ['vm'],
      cost: 'low',
      topic_name: 'dcm.agent.my-agent',
    });
  });
});

describe('formToAgentRegistration', () => {
  it('maps AgentForm to AgentRegistrationRequest correctly', () => {
    const req = formToAgentRegistration(VALID_FORM);

    expect(req).toEqual({
      name: 'env-agent-west-1',
      environment: 'production',
      service_types: ['vm', 'container'],
      cost: 'medium',
      topic_name: 'dcm.agent.env-agent-west-1',
    });
  });

  it('trims whitespace from name and topic_name', () => {
    const req = formToAgentRegistration({
      ...VALID_FORM,
      name: '  my-agent  ',
      topic_name: '  dcm.agent.my-agent  ',
    });

    expect(req.name).toBe('my-agent');
    expect(req.topic_name).toBe('dcm.agent.my-agent');
  });

  it('filters empty strings from service_types', () => {
    const req = formToAgentRegistration({
      ...VALID_FORM,
      service_types: ['vm', '', 'container'],
    });

    expect(req.service_types).toEqual(['vm', 'container']);
  });
});
