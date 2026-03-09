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

import { lightspeedApiRef } from '../api/api';
import { ConversationList } from '../types';

type RenameVariables = {
  conversation_id: string;
  newName: string;
  invalidateCache?: boolean;
};

type RenameContext = {
  previousConversations?: ConversationList;
};

export const useRenameConversation = (): UseMutationResult<
  void,
  Error,
  RenameVariables,
  RenameContext
> => {
  const lightspeedApi = useApi(lightspeedApiRef);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (props: {
      conversation_id: string;
      newName: string;
      invalidateCache?: boolean;
    }) => {
      await lightspeedApi.renameConversation(
        props.conversation_id,
        props.newName,
      );
    },
    onMutate: async props => {
      await queryClient.cancelQueries({ queryKey: ['conversations'] });

      const previousConversations = queryClient.getQueryData<ConversationList>([
        'conversations',
      ]);

      queryClient.setQueryData(['conversations'], (old: ConversationList) =>
        old.map(c =>
          c.conversation_id === props.conversation_id
            ? { ...c, topic_summary: props.newName }
            : c,
        ),
      );

      return { previousConversations };
    },
    onSuccess: (_, props) => {
      if (props.invalidateCache) {
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
      }
    },
    onError: (_, __, context) => {
      queryClient.setQueryData(
        ['conversations'],
        context?.previousConversations,
      );
      return { success: false };
    },
  });
};
