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

import type { z } from 'zod';
import type { runAgentRequestSchema } from './schemas';

/** Browser request to submit a turn. @public */
export type RunAgentRequest = z.infer<typeof runAgentRequestSchema>;

/** The execution mode exposed by an AI Catalog agent. @public */
export type AgentExecutionMode = 'in-process' | 'subprocess' | 'sandbox';

/** Interpreted agent and turn input sent to the LCORE controller. @public */
export interface AgentExecutionInput {
  agent: string;
  prompt: string;
  instructions?: string;
  spawn?: 'none' | 'local' | 'ephemeral';
  inference_provider: {
    name: string;
    model: string;
    modelConfig?: { temperature?: number; maxTokens?: number };
  };
  tools?: string[];
  output_schema?: Record<string, unknown>;
  conversation_id?: string;
}
