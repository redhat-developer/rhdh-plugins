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
import { ActionsRegistryService } from '@backstage/backend-plugin-api/alpha';
import { AuthService, DiscoveryService } from '@backstage/backend-plugin-api';
import type { LogEvent } from '@backstage/plugin-scaffolder-common';

export const createGetScaffolderTaskLogsAction = ({
  actionsRegistry,
  auth,
  discovery,
}: {
  actionsRegistry: ActionsRegistryService;
  auth: AuthService;
  discovery: DiscoveryService;
}) => {
  actionsRegistry.register({
    name: 'get-scaffolder-task-logs',
    title: 'Get Scaffolder Task Logs',
    attributes: {
      destructive: false,
      readOnly: true,
      idempotent: true,
    },
    description: `
Retrieve the log events for a scaffolder task.
Each log event has a type (log, completion, cancelled, or recovered), a body containing a message and optional step ID and status.
Use the after parameter to fetch only events after a specific event ID for incremental polling.
    `,
    schema: {
      input: z =>
        z.object({
          taskId: z
            .string()
            .min(1)
            .refine(
              val =>
                !val.includes('..') &&
                !val.includes('/') &&
                !val.includes('\\'),
              { message: 'taskId must be a valid task ID' },
            )
            .describe('The ID of the scaffolder task'),
          after: z
            .number()
            .int()
            .min(0)
            .optional()
            .describe(
              'Return only log events after this event ID for incremental polling',
            ),
        }),
      output: z =>
        z
          .object({
            events: z
              .array(
                z.object({
                  id: z.number().describe('The event ID'),
                  taskId: z
                    .string()
                    .describe('The ID of the task this event belongs to'),
                  createdAt: z
                    .string()
                    .describe('Timestamp when the event was created'),
                  type: z
                    .string()
                    .describe(
                      'Event type: log, completion, cancelled, or recovered',
                    ),
                  body: z
                    .object({
                      message: z.string().describe('The log message'),
                      stepId: z
                        .string()
                        .optional()
                        .describe('The step ID associated with this event'),
                      status: z
                        .string()
                        .optional()
                        .describe('The task status at the time of this event'),
                    })
                    .describe('The event body'),
                }),
              )
              .describe('The list of log events for the task'),
          })
          .describe('Object containing the events array'),
    },
    action: async ({ input, credentials }) => {
      const { token } = await auth.getPluginRequestToken({
        onBehalfOf: credentials,
        targetPluginId: 'scaffolder',
      });

      const baseUrl = await discovery.getBaseUrl('scaffolder');
      const url = new URL(`v2/tasks/${input.taskId}/events`, `${baseUrl}/`);
      if (input.after !== undefined) {
        url.searchParams.set('after', String(input.after));
      }

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(
          `Scaffolder task logs request failed: ${response.status} ${
            response.statusText
          }${text ? ` - ${text}` : ''}`,
        );
      }

      const events = (await response.json()) as LogEvent[];

      return {
        output: {
          events: events.map(event => ({
            id: event.id,
            taskId: event.taskId,
            createdAt: event.createdAt,
            type: event.type,
            body: {
              message: event.body.message,
              stepId: event.body.stepId,
              status: event.body.status,
            },
          })),
        },
      };
    },
  });
};
