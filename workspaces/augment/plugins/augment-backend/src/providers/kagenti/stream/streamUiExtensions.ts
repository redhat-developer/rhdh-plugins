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

import type {
  NormalizedStreamEvent,
  StreamCitationReference,
} from '@red-hat-developer-hub/backstage-plugin-augment-common';
import {
  TRAJECTORY_EXTENSION_URI,
  ERROR_EXTENSION_URI,
  CITATION_EXTENSION_URI,
} from '@kagenti/adk/extensions';

export function extractUiExtensions(
  metadata: Record<string, unknown> | undefined,
  events: NormalizedStreamEvent[],
  currentGroupIdRef: { value: string | undefined },
): void {
  if (!metadata) return;

  const trajectory = metadata[TRAJECTORY_EXTENSION_URI];
  if (Array.isArray(trajectory)) {
    for (const step of trajectory) {
      const s = step as Record<string, unknown>;
      const groupId = s.group_id ?? s.agent_name ?? s.agent;
      if (typeof groupId === 'string' && groupId !== currentGroupIdRef.value) {
        const fromAgent = currentGroupIdRef.value;
        currentGroupIdRef.value = groupId;
        events.push({
          type: 'stream.agent.handoff',
          fromAgent,
          toAgent: groupId,
        } as NormalizedStreamEvent);
      }
      const title = s.title;
      const content = s.content;
      const text = [title, content].filter(Boolean).join(': ');
      if (text)
        events.push({ type: 'stream.reasoning.delta', delta: `${text}\n` });
    }
  }

  const citation = metadata[CITATION_EXTENSION_URI];
  if (Array.isArray(citation) && citation.length > 0) {
    events.push({
      type: 'stream.citation',
      citations: citation as StreamCitationReference[],
    });
  }
}

export function extractStructuredError(
  metadata: Record<string, unknown> | undefined,
  events: NormalizedStreamEvent[],
  fallbackText: string,
): void {
  const errorMeta = metadata?.[ERROR_EXTENSION_URI] as
    | {
        error?: { title?: string; message?: string };
        context?: Record<string, unknown>;
      }
    | undefined;

  if (errorMeta?.error) {
    events.push({
      type: 'stream.error',
      error: errorMeta.error.message ?? 'Agent task failed',
      code: 'kagenti_task_failed',
      title: errorMeta.error.title,
      context: errorMeta.context,
    });
  } else {
    events.push({
      type: 'stream.error',
      error: fallbackText || 'Agent task failed',
      code: 'kagenti_task_failed',
    });
  }
}
