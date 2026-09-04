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

export const ORCHESTRATOR_WORKFLOWS_ANNOTATION = 'orchestrator.io/workflows';
export const ORCHESTRATOR_RUN_WORKFLOW_ACTION = 'orchestrator:workflow:run';

type TemplateLike = Record<string, unknown>;

const parseWorkflowIdsFromAnnotation = (
  annotation: string | undefined,
): string[] => {
  if (!annotation) {
    return [];
  }

  try {
    const parsed = JSON.parse(annotation);
    if (Array.isArray(parsed)) {
      return parsed.filter(
        (value): value is string => typeof value === 'string',
      );
    }
  } catch {
    return [];
  }

  return [];
};

const getWorkflowIdFromSteps = (template: TemplateLike): string | undefined => {
  const spec = template.spec as
    | {
        steps?: Array<{
          action?: string;
          input?: { workflow_id?: string };
        }>;
      }
    | undefined;

  for (const step of spec?.steps ?? []) {
    if (
      step.action === ORCHESTRATOR_RUN_WORKFLOW_ACTION &&
      typeof step.input?.workflow_id === 'string' &&
      step.input.workflow_id.length > 0
    ) {
      return step.input.workflow_id;
    }
  }

  return undefined;
};

/**
 * Resolves the orchestrator workflow ID referenced by a scaffolder template.
 * Prefers the `orchestrator:workflow:run` step input, then the first entry in
 * the `orchestrator.io/workflows` annotation.
 */
export const getWorkflowIdFromTemplate = (
  template: TemplateLike,
): string | undefined => {
  const fromStep = getWorkflowIdFromSteps(template);
  if (fromStep) {
    return fromStep;
  }

  const metadata = template.metadata as
    { annotations?: Record<string, string> } | undefined;
  const annotatedWorkflowIds = parseWorkflowIdsFromAnnotation(
    metadata?.annotations?.[ORCHESTRATOR_WORKFLOWS_ANNOTATION],
  );

  return annotatedWorkflowIds[0];
};

/**
 * Returns true when the template executes an orchestrator workflow.
 */
export const isOrchestratorWorkflowTemplate = (
  template: TemplateLike,
): boolean => Boolean(getWorkflowIdFromTemplate(template));
