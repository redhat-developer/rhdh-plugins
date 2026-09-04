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
  getWorkflowIdFromTemplate,
  isOrchestratorWorkflowTemplate,
} from './getWorkflowIdFromTemplate';

describe('getWorkflowIdFromTemplate', () => {
  it('returns workflow_id from orchestrator:workflow:run step', () => {
    const template = {
      metadata: {
        annotations: {
          'orchestrator.io/workflows': '["other-workflow"]',
        },
      },
      spec: {
        steps: [
          {
            action: 'orchestrator:workflow:run',
            input: { workflow_id: 'yamlgreet' },
          },
        ],
      },
    };

    expect(getWorkflowIdFromTemplate(template)).toBe('yamlgreet');
  });

  it('falls back to the first orchestrator.io/workflows annotation entry', () => {
    const template = {
      metadata: {
        annotations: {
          'orchestrator.io/workflows': '["yamlgreet", "assessment"]',
        },
      },
      spec: { steps: [] },
    };

    expect(getWorkflowIdFromTemplate(template)).toBe('yamlgreet');
  });

  it('returns undefined for non-orchestrator templates', () => {
    const template = {
      metadata: { name: 'plain-template' },
      spec: {
        steps: [{ action: 'publish:github', input: {} }],
      },
    };

    expect(getWorkflowIdFromTemplate(template)).toBeUndefined();
    expect(isOrchestratorWorkflowTemplate(template)).toBe(false);
  });
});
