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

export type AgentRole = 'standalone' | 'router' | 'specialist';

export interface AgentWizardFormData {
  // Step 1: Identity
  name: string;
  key: string;
  description: string;
  role: AgentRole;

  // Step 2: Instructions
  instructions: string;

  // Step 3: Model
  model: string;
  temperature: number;
  maxOutputTokens: number;
  toolChoice: 'auto' | 'required' | 'none';
  reasoningEffort: 'low' | 'medium' | 'high';
  maxToolCalls: number;

  // Step 4: Tools
  mcpServers: string[];
  enableRAG: boolean;
  vectorStoreIds: string[];
  enableWebSearch: boolean;
  enableCodeInterpreter: boolean;

  // Step 5: Connections
  handoffs: string[];
  asTools: string[];
  handoffDescription: string;

  // Step 6: Guardrails
  guardrails: string[];
  resetToolChoice: boolean;
  nestHandoffHistory: boolean;
}

export const WIZARD_STEPS = [
  { label: 'Identity', key: 'identity' },
  { label: 'Instructions', key: 'instructions' },
  { label: 'Model', key: 'model' },
  { label: 'Tools', key: 'tools' },
  { label: 'Connections', key: 'connections' },
  { label: 'Guardrails', key: 'guardrails' },
  { label: 'Review', key: 'review' },
] as const;

export type WizardStepKey = (typeof WIZARD_STEPS)[number]['key'];

export function createDefaultFormData(): AgentWizardFormData {
  return {
    name: '',
    key: '',
    description: '',
    role: 'standalone',
    instructions: '',
    model: '',
    temperature: 0.7,
    maxOutputTokens: 4096,
    toolChoice: 'auto',
    reasoningEffort: 'medium',
    maxToolCalls: 10,
    mcpServers: [],
    enableRAG: false,
    vectorStoreIds: [],
    enableWebSearch: false,
    enableCodeInterpreter: false,
    handoffs: [],
    asTools: [],
    handoffDescription: '',
    guardrails: [],
    resetToolChoice: false,
    nestHandoffHistory: false,
  };
}
