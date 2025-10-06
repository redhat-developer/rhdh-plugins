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

import { SamplePrompts } from './types';

export const TEMP_CONVERSATION_ID = 'temp-conversation-id';

// Translation keys for disclaimers
export const FUNCTION_DISCLAIMER_WITHOUT_QUESTION_VALIDATION_KEY =
  'disclaimer.withoutValidation';
export const FUNCTION_DISCLAIMER_KEY = 'disclaimer.withValidation';

const createPrompt = (titleKey: string, messageKey: string) => {
  return { titleKey, messageKey };
};

export const supportedFileTypes = {
  'text/plain': ['.txt'],
  'application/json': ['.json'],
  'application/yaml': ['.yaml', '.yml'],
  'application/xml': ['.xml'],
};

export const DEFAULT_SAMPLE_PROMPTS: SamplePrompts = [
  createPrompt(
    'prompts.codeReadability.title',
    'prompts.codeReadability.message',
  ),
  createPrompt('prompts.debugging.title', 'prompts.debugging.message'),
  createPrompt(
    'prompts.developmentConcept.title',
    'prompts.developmentConcept.message',
  ),
  createPrompt(
    'prompts.codeOptimization.title',
    'prompts.codeOptimization.message',
  ),
  createPrompt('prompts.documentation.title', 'prompts.documentation.message'),
  createPrompt('prompts.gitWorkflows.title', 'prompts.gitWorkflows.message'),
  createPrompt(
    'prompts.testingStrategies.title',
    'prompts.testingStrategies.message',
  ),
  createPrompt(
    'prompts.sortingAlgorithms.title',
    'prompts.sortingAlgorithms.message',
  ),
  createPrompt('prompts.eventDriven.title', 'prompts.eventDriven.message'),
];

export const RHDH_SAMPLE_PROMPTS: SamplePrompts = [
  createPrompt('prompts.tekton.title', 'prompts.tekton.message'),
  createPrompt('prompts.openshift.title', 'prompts.openshift.message'),
  createPrompt('prompts.rhdh.title', 'prompts.rhdh.message'),
];

// Topic restriction valid provider IDs
export const VALID_TOPIC_RESTRICTION_PROVIDER_IDS = [
  'lightspeed_question_validity-shield',
];
