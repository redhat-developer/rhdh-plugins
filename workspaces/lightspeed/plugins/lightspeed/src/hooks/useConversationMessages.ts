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

import React from 'react';

import { useApi } from '@backstage/core-plugin-api';

import { MessageProps } from '@patternfly/chatbot';
import { useQuery } from '@tanstack/react-query';

import { lightspeedApiRef } from '../api/api';
import { ScrollContainerHandle } from '../components/LightspeedChatBox';
import { TEMP_CONVERSATION_ID } from '../const';
import logo from '../images/logo.svg';
import {
  createBotMessage,
  createUserMessage,
  getMessageData,
  getTimestamp,
} from '../utils/lightspeed-chatbox-utils';
import { useCreateConversationMessage } from './useCreateCoversationMessage';

// Fetch all conversation messages
export const useFetchConversationMessages = (currentConversation: string) => {
  const lightspeedApi = useApi(lightspeedApiRef);
  return useQuery({
    queryKey: ['conversationMessages', currentConversation],
    queryFn: currentConversation
      ? async () => {
          const response =
            await lightspeedApi.getConversationMessages(currentConversation);

          return response;
        }
      : undefined,
    retry: false,
  });
};

type Conversations = { [_key: string]: MessageProps[] };

const defaultAvatar =
  'https://img.freepik.com/premium-photo/graphic-designer-digital-avatar-generative-ai_934475-9292.jpg';
/**
 * Fetches all the messages for given conversation_id
 * @param conversationId
 * @param userName
 * @param selectedModel
 * @param avatar
 *
 */
export const useConversationMessages = (
  conversationId: string,
  userName: string | undefined,
  selectedModel: string,
  avatar: string = defaultAvatar,
  onComplete?: (message: string) => void,
  onStart?: (conversation_id: string) => void,
) => {
  const { mutateAsync: createMessage } = useCreateConversationMessage();
  const scrollToBottomRef = React.useRef<ScrollContainerHandle>(null);

  const [currentConversation, setCurrentConversation] =
    React.useState(conversationId);
  const [conversations, setConversations] = React.useState<Conversations>({
    [currentConversation]: [],
  });
  const streamingConversations = React.useRef<Conversations>({
    [currentConversation]: [],
  });

  React.useEffect(() => {
    if (currentConversation !== conversationId) {
      setCurrentConversation(conversationId);
      setConversations(prev => {
        if (prev[conversationId]) return prev;

        return {
          ...prev,
          [conversationId]: [],
        };
      });
    }
  }, [currentConversation, conversationId]);

  const { data: conversationsData = [], ...queryProps } =
    useFetchConversationMessages(currentConversation);

  React.useEffect(() => {
    if (
      !Array.isArray(conversationsData) ||
      (conversationsData.length === 0 &&
        conversationId !== TEMP_CONVERSATION_ID)
    )
      return;

    const newConvoIndex: number[] = [];

    if (conversations) {
      const _conversations: { [key: string]: any[] } = {
        [currentConversation]: [],
      };

      let index = 0;
      for (let i = 0; i < conversationsData.length; i += 2) {
        const userMessage = conversationsData[i];
        const aiMessage = conversationsData[i + 1];

        const { content: humanMessage, timestamp: userTimestamp } =
          getMessageData(userMessage);
        const {
          model,
          content: botMessage,
          timestamp: botTimestamp,
        } = getMessageData(aiMessage);

        _conversations[currentConversation].push(
          ...[
            createUserMessage({
              avatar,
              name: userName,
              content: humanMessage,
              timestamp: userTimestamp,
            }),
            createBotMessage({
              avatar: logo,
              isLoading: false,
              name: model ?? selectedModel,
              content: botMessage,
              timestamp: botTimestamp,
            }),
          ],
        );

        newConvoIndex.push(index);
        index++;
      }

      if (streamingConversations.current[currentConversation]) {
        _conversations[currentConversation].push(
          ...streamingConversations.current[currentConversation],
        );
      }

      setConversations(_conversations);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    conversationsData,
    userName,
    avatar,
    currentConversation,
    selectedModel,
    streamingConversations,
  ]);

  const handleInputPrompt = React.useCallback(
    async (prompt: string) => {
      let newConversationId = '';

      const conversationTuple = [
        createUserMessage({
          avatar,
          name: userName,
          content: prompt,
          timestamp: getTimestamp(Date.now()) ?? '',
        }),
        createBotMessage({
          avatar: logo,
          isLoading: true,
          name: selectedModel,
          content: '',
          timestamp: '',
        }),
      ];

      streamingConversations.current = {
        ...streamingConversations.current,
        [currentConversation]: conversationTuple,
      };

      setConversations((prevConv: Conversations) => {
        return {
          ...prevConv,
          [currentConversation]: [
            ...(prevConv?.[currentConversation] ?? []),
            ...conversationTuple,
          ],
        };
      });

      setTimeout(() => {
        scrollToBottomRef.current?.scrollToBottom();
      }, 0);
      const finalMessages: string[] = [];
      let buffer = '';

      try {
        const reader = await createMessage({
          prompt,
          selectedModel,
          currentConversation,
        });

        const decoder = new TextDecoder('utf-8');
        const keepGoing = true;

        while (keepGoing) {
          const { value, done } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // Process all complete messages separated by double newlines
          const parts = buffer.split('\n\n');
          buffer = parts.pop()!;

          for (const part of parts) {
            const lines = part
              .split('\n')
              .filter(line => line.startsWith('data:'));

            const jsonString = lines
              .map(line => line.trim().slice(5).trim())
              .join('');
            try {
              const { event, data } = JSON.parse(jsonString);
              if (event === 'start') {
                if (currentConversation === TEMP_CONVERSATION_ID) {
                  // If the conversation is temp, we need to set the new conversation id
                  newConversationId = data?.conversation_id;
                }
              }

              if (event === 'token') {
                const content = data?.token || '';

                finalMessages.push(content);

                // Store streaming message
                const [humanMessage, aiMessage] =
                  streamingConversations.current[currentConversation];
                streamingConversations.current[currentConversation] = [
                  humanMessage,
                  { ...aiMessage, content: aiMessage.content + content },
                ];

                setConversations(prevConversations => {
                  const conversation =
                    prevConversations[currentConversation] ?? [];

                  const lastMessageIndex = conversation.length - 1;
                  const lastMessage =
                    conversation.length === 0
                      ? createBotMessage({
                          content: '',
                          timestamp: getTimestamp(Date.now()),
                        })
                      : { ...conversation[lastMessageIndex] };

                  lastMessage.isLoading = false;
                  lastMessage.content += content;
                  lastMessage.name =
                    data?.response_metadata?.model || selectedModel;
                  lastMessage.timestamp = getTimestamp(
                    data?.response_metadata?.created_at || Date.now(),
                  );

                  const updatedConversation = [
                    ...conversation.slice(0, lastMessageIndex),
                    lastMessage,
                  ];

                  return {
                    ...prevConversations,
                    [currentConversation]: updatedConversation,
                  };
                });
              }
            } catch (error) {
              // eslint-disable-next-line no-console
              console.warn('Error parsing JSON:', error);
              if (typeof onComplete === 'function') {
                onComplete('Invalid JSON received');
              }
            }
          }
        }
      } catch (e) {
        setConversations(prevConversations => {
          const conversation = prevConversations[currentConversation] ?? [];

          const lastMessageIndex = conversation.length - 1;
          const lastMessage =
            conversation.length === 0
              ? createBotMessage({
                  content: '',
                  timestamp: getTimestamp(Date.now()),
                })
              : { ...conversation[lastMessageIndex] };

          lastMessage.isLoading = false;
          lastMessage.content += e;
          lastMessage.error = {
            title: e.message,
          };
          lastMessage.timestamp = getTimestamp(Date.now());

          const updatedConversation = [
            ...conversation.slice(0, lastMessageIndex),
            lastMessage,
          ];

          finalMessages.push(`${e}`);

          return {
            ...prevConversations,
            [newConversationId.length > 0
              ? newConversationId
              : currentConversation]: updatedConversation,
          };
        });
      }
      // reset current streaming
      streamingConversations.current[currentConversation] = [];
      if (typeof onComplete === 'function') {
        onComplete(finalMessages.join(''));
      }
      // Swap temp conversation messages with new conversation

      if (currentConversation === TEMP_CONVERSATION_ID && newConversationId) {
        setConversations(prevConversations => {
          return {
            ...prevConversations,
            [newConversationId]: prevConversations[TEMP_CONVERSATION_ID],
          };
        });

        onStart?.(newConversationId);

        setConversations(prev => {
          const { temp, ...rest } = prev;
          return rest;
        });
      }
    },

    [
      avatar,
      userName,
      onComplete,
      onStart,
      selectedModel,
      createMessage,
      currentConversation,
    ],
  );

  return {
    conversationMessages: conversations[currentConversation] ?? [],
    handleInputPrompt,
    conversations,
    scrollToBottomRef,
    ...queryProps,
  };
};
