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

/** Default Serverless Workflow specification version for MVP builder. */
export const DEFAULT_WORKFLOW_SPEC_VERSION = '0.8';

export type WorkflowBuilderIdentity = {
  name: string;
  description: string;
  workflowId: string;
  version: string;
  /** CNCF Serverless Workflow spec version (MVP default: 0.8). */
  specVersion: string;
};

/**
 * The four builder files for a session (MVP).
 * Output schema may be empty until the user fills it.
 */
export type WorkflowBuilderFiles = {
  workflowYaml: string;
  templateYaml: string;
  inputSchemaJson: string;
  /** Optional; kept empty by default. */
  outputSchemaJson: string;
};
