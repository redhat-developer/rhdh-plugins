import { SamplePrompts } from './types';

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
export const TEMP_CONVERSATION_ID = 'temp-conversation-id';

export const FUNCTION_DISCLAIMER_WITHOUT_QUESTION_VALIDATION = `Red Hat Developer Hub Lightspeed can answer questions on many topics using your configured models. Lightspeed's responses are influenced by the Red Hat Developer Hub documentation but Lightspeed does not have access to your Software Catalog, TechDocs, or Templates etc. Do not include personal or sensitive information in your input. Interactions with Developer Hub Lightspeed may be reviewed and used to improve products or services.`;

export const FUNCTION_DISCLAIMER = `Red Hat Developer Hub Lightspeed can answer questions on many topics using your configured models. Lightspeed's responses are influenced by the Red Hat Developer Hub documentation but Lightspeed does not have access to your Software Catalog, TechDocs, or Templates etc. Lightspeed uses question (prompt) validation to ensure that conversations remain focused on technical topics relevant to Red Hat Developer Hub, such as Backstage, Kubernetes, and OpenShift. Do not include personal or sensitive information in your input. Interactions with Developer Hub Lightspeed may be reviewed and used to improve products or services.`;

const createPrompt = (title: string, message: string) => {
  return { title, message };
};

export const DEFAULT_SAMPLE_PROMPTS: SamplePrompts = [
  createPrompt(
    'Get Help On Code Readability',
    'Can you suggest techniques I can use to make my code more readable and maintainable?',
  ),
  createPrompt(
    'Get Help With Debugging',
    'My application is throwing an error when trying to connect to the database. Can you help me identify the issue?',
  ),
  createPrompt(
    'Explain a Development Concept',
    'Can you explain how microservices architecture works and its advantages over a monolithic design?',
  ),
  createPrompt(
    'Suggest Code Optimizations',
    'Can you suggest common ways to optimize code to achieve better performance?',
  ),
  createPrompt(
    'Documentation Summary',
    'Can you summarize the documentation for implementing OAuth 2.0 authentication in a web app?',
  ),
  createPrompt(
    'Workflows With Git',
    'I want to make changes to code on another branch without loosing my existing work. What is the procedure to do this using Git?',
  ),
  createPrompt(
    'Suggest Testing Strategies',
    'Can you recommend some common testing strategies that will make my application robust and error-free?',
  ),
  createPrompt(
    'Demystify Sorting Algorithms',
    'Can you explain the difference between a quicksort and a merge sort algorithm, and when to use each?',
  ),
  createPrompt(
    'Understand Event-Driven Architecture',
    'Can you explain what event-driven architecture is and when it’s beneficial to use it in software development?',
  ),
];

export const RHDH_SAMPLE_PROMPTS: SamplePrompts = [
  createPrompt(
    'Deploy With Tekton',
    'Can you help me automate the deployment of my application using Tekton pipelines?',
  ),
  createPrompt(
    'Create An OpenShift Deployment',
    'Can you guide me through creating a new deployment in OpenShift for a containerized application?',
  ),
  createPrompt(
    'Getting Started with Backstage',
    'Can you guide me through the first steps to start using Backstage as a developer, like exploring the Software Catalog and adding my service?',
  ),
];
