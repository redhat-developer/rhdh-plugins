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
import SmartToyOutlinedIcon from '@mui/icons-material/SmartToyOutlined';
import CodeIcon from '@mui/icons-material/Code';
import PublicIcon from '@mui/icons-material/Public';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import type { AgentFormData } from './agentValidation';

export interface AgentTemplate {
  id: string;
  name: string;
  icon: React.ReactElement;
  description: string;
  defaults: Partial<AgentFormData>;
}

export const AGENT_TEMPLATES: AgentTemplate[] = [
  {
    id: 'blank',
    name: 'Blank Agent',
    icon: <SmartToyOutlinedIcon />,
    description: 'Start from scratch with a clean slate',
    defaults: {},
  },
  {
    id: 'code-assistant',
    name: 'Code Assistant',
    icon: <CodeIcon />,
    description: 'Helps write, review, and debug code',
    defaults: {
      enableCodeInterpreter: true,
      enableWebSearch: true,
      instructions:
        'You are a skilled software engineering assistant. Help users write clean, efficient code. You can execute code to test solutions and search the web for documentation and best practices. Always explain your reasoning and suggest improvements.',
    },
  },
  {
    id: 'research-agent',
    name: 'Research Agent',
    icon: <PublicIcon />,
    description: 'Finds and synthesizes information from documents and the web',
    defaults: {
      enableRAG: true,
      enableWebSearch: true,
      instructions:
        'You are a research assistant. Search the knowledge base and the web to find accurate, up-to-date information. Synthesize findings into clear, well-organized responses. Always cite your sources and distinguish between verified facts and inferences.',
    },
  },
  {
    id: 'knowledge-expert',
    name: 'Knowledge Expert',
    icon: <MenuBookIcon />,
    description: 'Answers questions using your uploaded documents',
    defaults: {
      enableRAG: true,
      instructions:
        'You are a knowledgeable assistant with access to an internal knowledge base. Answer questions accurately using the available documents. If the answer is not in the knowledge base, clearly state that and suggest where the user might find the information.',
    },
  },
];
