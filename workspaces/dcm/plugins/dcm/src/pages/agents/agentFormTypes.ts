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

import * as yup from 'yup';
import type {
  Agent,
  AgentCost,
  AgentRegistrationRequest,
} from '@red-hat-developer-hub/backstage-plugin-dcm-common';
import { createYupValidator } from '../../utils/createYupValidator';
import { type TFunction, makeTranslator } from '../../utils/formUtils';

export type AgentForm = {
  name: string;
  environment: string;
  service_types: string[];
  cost: AgentCost | '';
  topic_name: string;
};

export const AGENT_COST_OPTIONS: AgentCost[] = [
  'low',
  'medium-low',
  'medium',
  'medium-high',
  'high',
];

function buildAgentSchema(t?: TFunction) {
  const m = makeTranslator(t);
  return yup.object({
    name: yup
      .string()
      .required(m('validation.agent.nameRequired', 'Name is required'))
      .matches(
        /^[a-z][a-z0-9-]*$/,
        m(
          'validation.agent.namePattern',
          'Only lowercase letters, numbers, and hyphens are allowed (must start with a letter)',
        ),
      ),
    environment: yup
      .string()
      .required(
        m('validation.agent.environmentRequired', 'Environment is required'),
      ),
    service_types: yup
      .array()
      .of(yup.string().required())
      .min(
        1,
        m(
          'validation.agent.serviceTypesRequired',
          'At least one service type is required',
        ),
      ),
    cost: yup
      .string()
      .required(m('validation.agent.costRequired', 'Cost is required')),
    topic_name: yup
      .string()
      .required(
        m('validation.agent.topicNameRequired', 'Topic name is required'),
      )
      .matches(
        /^dcm\.agent\..+/,
        m(
          'validation.agent.topicNamePattern',
          'Topic name must start with dcm.agent.',
        ),
      ),
  });
}

export function validateAgentForm(
  form: AgentForm,
  t?: TFunction,
): Partial<Record<keyof AgentForm, string>> {
  const { validate } = createYupValidator<AgentForm>(buildAgentSchema(t));
  return validate(form);
}

export function isAgentFormValid(form: AgentForm): boolean {
  const { isValid } = createYupValidator<AgentForm>(buildAgentSchema());
  return isValid(form);
}

export function emptyAgentForm(): AgentForm {
  return {
    name: '',
    environment: '',
    service_types: [],
    cost: '',
    topic_name: '',
  };
}

export function agentToForm(a: Agent): AgentForm {
  return {
    name: a.name ?? '',
    environment: a.environment ?? '',
    service_types: a.service_types ?? [],
    cost: a.cost ?? '',
    topic_name: a.topic_name ?? '',
  };
}

export function formToAgentRegistration(
  f: AgentForm,
): AgentRegistrationRequest {
  return {
    name: f.name.trim(),
    environment: f.environment.trim(),
    service_types: f.service_types.map(s => s.trim()).filter(Boolean),
    cost: f.cost as AgentCost,
    topic_name: f.topic_name.trim(),
  };
}
