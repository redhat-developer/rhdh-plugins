/*
 * Copyright 2024 The Backstage Authors
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

import { useMutation } from '@tanstack/react-query';

import { lightspeedApiRef } from '../api/api';

export const useCreateConversationMessage = () => {
  const lightspeedApi = useApi(lightspeedApiRef);

  return useMutation({
    mutationFn: async ({
      prompt,
      selectedModel,
      currentConversation,
    }: {
      prompt: string;
      selectedModel: string;
      currentConversation: string;
    }) => {
      if (!currentConversation) {
        throw new Error('Failed to generate AI response');
      }

      return await lightspeedApi.createMessage(
        `${prompt}`,
        selectedModel,
        currentConversation,
      );
    },
    onError: error => {
      // eslint-disable-next-line
      console.warn(error);
    },
  });
};
