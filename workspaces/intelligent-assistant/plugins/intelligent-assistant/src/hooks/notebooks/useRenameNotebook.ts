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

import { useApi } from '@backstage/core-plugin-api';

import {
  useMutation,
  useQueryClient,
  type UseMutationResult,
} from '@tanstack/react-query';

import { notebooksApiRef } from '../../api/notebooksApi';
import { NotebookSession } from '../../types';

type RenameNotebookPayload = {
  sessionId: string;
  name: string;
};

type RenameNotebookContext = {
  previousSessions: NotebookSession[] | undefined;
  previousSession: NotebookSession | undefined;
};

export const useRenameNotebook = (): UseMutationResult<
  void,
  unknown,
  RenameNotebookPayload,
  RenameNotebookContext
> => {
  const notebooksApi = useApi(notebooksApiRef);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: RenameNotebookPayload) => {
      await notebooksApi.renameSession(payload.sessionId, payload.name);
    },
    onMutate: async (payload): Promise<RenameNotebookContext> => {
      await queryClient.cancelQueries({
        queryKey: ['notebooks', 'sessions'],
      });
      await queryClient.cancelQueries({
        queryKey: ['notebooks', 'session', payload.sessionId],
      });

      const previousSessions = queryClient.getQueryData<NotebookSession[]>([
        'notebooks',
        'sessions',
      ]);
      const previousSession = queryClient.getQueryData<NotebookSession>([
        'notebooks',
        'session',
        payload.sessionId,
      ]);

      queryClient.setQueryData<NotebookSession[]>(
        ['notebooks', 'sessions'],
        old =>
          old?.map(s =>
            s.session_id === payload.sessionId
              ? { ...s, name: payload.name }
              : s,
          ),
      );

      if (previousSession) {
        queryClient.setQueryData<NotebookSession>(
          ['notebooks', 'session', payload.sessionId],
          old => (old ? { ...old, name: payload.name } : old),
        );
      }

      return { previousSessions, previousSession };
    },
    onError: (_err, payload, context) => {
      if (context?.previousSessions) {
        queryClient.setQueryData(
          ['notebooks', 'sessions'],
          context.previousSessions,
        );
      }
      if (context?.previousSession) {
        queryClient.setQueryData(
          ['notebooks', 'session', payload.sessionId],
          context.previousSession,
        );
      }
    },
    onSettled: (_data, _error, payload) => {
      queryClient.invalidateQueries({ queryKey: ['notebooks', 'sessions'] });
      queryClient.invalidateQueries({
        queryKey: ['notebooks', 'session', payload.sessionId],
      });
    },
  });
};
