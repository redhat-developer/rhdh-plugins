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

import { useMutation, type UseMutationResult } from '@tanstack/react-query';

import { notebooksApiRef } from '../../api/notebooksApi';

export type CreateNotebookMessageVariables = {
  prompt: string;
  sessionId: string;
};

export const useCreateNotebookMessage = (): UseMutationResult<
  ReadableStreamDefaultReader<Uint8Array>,
  Error,
  CreateNotebookMessageVariables
> => {
  const notebooksApi = useApi(notebooksApiRef);

  return useMutation({
    mutationFn: async ({
      prompt,
      sessionId,
    }: CreateNotebookMessageVariables) => {
      if (!sessionId) {
        throw new Error('Failed to generate AI response');
      }

      return await notebooksApi.querySession(sessionId, prompt);
    },
    onError: error => {
      // eslint-disable-next-line
      console.warn(error);
    },
  });
};
