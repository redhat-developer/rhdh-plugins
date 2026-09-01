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

import { RefObject, useCallback, useEffect, useRef, useState } from 'react';

import { useApi } from '@backstage/core-plugin-api';

import { useTheme } from '@mui/material/styles';
import { MessageProps } from '@patternfly/chatbot';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { lightspeedApiRef } from '../api/api';
import { ScrollContainerHandle } from '../components/LightspeedChatBox';
import { TEMP_CONVERSATION_ID } from '../const';
import botAvatarDark from '../images/bot-avatar-dark.svg';
import botAvatarLight from '../images/bot-avatar.svg';
import userAvatar from '../images/user-avatar.svg';
import { Attachment, BaseMessage, LCSConversation, ToolCall } from '../types';
import {
  createBotMessage,
  createUserMessage,
  getConversationsData,
  getTimestamp,
  normalizeChatUserInput,
  transformDocumentsToSources,
} from '../utils/lightspeed-chatbox-utils';
import {
  applyToolResultToToolCalls,
  createTempToolCallsCacheSessionPrefix,
  normalizeToolCalls,
  parseSSEBuffer,
  parseToolCallFromEvent,
  parseToolResultFromEvent,
  toolCallIdKey,
} from '../utils/stream-event-helpers';
import {
  clearSharedToolCallsCacheSessionPrefix,
  getSharedToolCallsCache,
  migrateSharedToolCallsCacheSessionPrefixToConversation,
  setSharedToolCallsCache,
} from './toolCallsCacheStore';
import {
  CreateMessageVariables,
  useCreateConversationMessage,
} from './useCreateCoversationMessage';

// Fetch all conversation messages
export const useFetchConversationMessages = (
  currentConversation: string,
): UseQueryResult<BaseMessage[] | undefined, Error> => {
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

// Extended message type to include tool calls
interface ExtendedMessageProps extends MessageProps {
  toolCalls?: ToolCall[];
}

type Conversations = { [_key: string]: ExtendedMessageProps[] };

export type UseConversationMessagesReturn = {
  conversationMessages: ExtendedMessageProps[];
  handleInputPrompt: (
    prompt: string,
    attachments?: Attachment[],
  ) => Promise<void>;
  conversations: Conversations;
  scrollToBottomRef: RefObject<ScrollContainerHandle | null>;
  streamingConversationId: string | null;
  data?: BaseMessage[] | undefined;
  error: Error | null;
  isPending: boolean;
  isFetching: boolean;
  isSuccess: boolean;
  isError: boolean;
  status: 'pending' | 'error' | 'success';
  refetch: () => void;
};

/**
 * Fetches all the messages for given conversation_id
 * @param conversationId
 * @param userName
 * @param selectedModel
 * @param selectedProvider
 * @param avatar
 *
 */
export const useConversationMessages = (
  conversationId: string,
  userName: string | undefined,
  selectedModel: string,
  selectedProvider: string,
  avatar: string = userAvatar,
  onComplete?: (message: string) => void,
  onStart?: (conversation_id: string) => void,
  createMessageOverride?: (
    vars: CreateMessageVariables,
  ) => Promise<ReadableStreamDefaultReader<Uint8Array>>,
  onRequestIdReady?: (request_id: string, conversation_id?: string) => void,
): UseConversationMessagesReturn => {
  const theme = useTheme();
  const botAvatar =
    theme.palette.mode === 'dark' ? botAvatarDark : botAvatarLight;
  const { mutateAsync: defaultCreateMessage } = useCreateConversationMessage();
  const createMessage = createMessageOverride ?? defaultCreateMessage;
  const scrollToBottomRef = useRef<ScrollContainerHandle>(null);

  const [currentConversation, setCurrentConversation] =
    useState(conversationId);
  const [conversations, setConversations] = useState<Conversations>({
    [currentConversation]: [],
  });
  const streamingConversations = useRef<Conversations>({
    [currentConversation]: [],
  });

  /** True while a send on the provisional thread is still running (even if UI switched to another conv). */
  const isTempStreamInProgressRef = useRef(false);

  const [streamingConversationId, setStreamingConversationId] = useState<
    string | null
  >(null);

  // Track pending tool calls during streaming
  const pendingToolCalls = useRef<Record<string, ToolCall>>({});

  useEffect(() => {
    if (currentConversation !== conversationId) {
      setCurrentConversation(conversationId);
      setConversations(prev => {
        // New chat from the nav resets TEMP to []. When returning to a still-streaming temp thread,
        // keep existing messages so the user sees the full inflight exchange (RHDHBUGS-3040).
        if (conversationId === TEMP_CONVERSATION_ID) {
          if (
            isTempStreamInProgressRef.current &&
            (prev[TEMP_CONVERSATION_ID]?.length ?? 0) > 0
          ) {
            return prev;
          }
          return { ...prev, [TEMP_CONVERSATION_ID]: [] };
        }
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

  useEffect(() => {
    if (!Array.isArray(conversationsData) || conversationsData.length === 0)
      return;

    const newConvoIndex: number[] = [];

    if (conversations) {
      const _conversations: { [key: string]: any[] } = {
        [currentConversation]: [],
      };

      let index = 0;
      for (let i = 0; i < conversationsData.length; i++) {
        const [userMessage, aiMessage] = getConversationsData(
          conversationsData[i] as unknown as LCSConversation,
        );

        // Create user message
        const userMsg = createUserMessage({
          avatar,
          name: userName,
          content: userMessage.content,
          timestamp: userMessage.timestamp,
        });

        // Create bot message
        const botMsg = createBotMessage({
          avatar: botAvatar,
          isLoading: false,
          name: conversationsData[i].model ?? selectedModel,
          content: aiMessage.content,
          timestamp: aiMessage.timestamp,
          sources: transformDocumentsToSources(
            aiMessage?.referenced_documents ?? [],
          ),
        });

        // Merge cached tool calls if available
        const cacheKey = `${currentConversation}-${i}`;
        const cachedToolCalls = getSharedToolCallsCache(cacheKey);
        if (cachedToolCalls && cachedToolCalls.length > 0) {
          botMsg.toolCalls = cachedToolCalls;
        }

        _conversations[currentConversation].push(userMsg, botMsg);

        newConvoIndex.push(index);
        index++;
      }

      if (streamingConversations.current[currentConversation]) {
        _conversations[currentConversation].push(
          ...streamingConversations.current[currentConversation],
        );
      }

      setConversations(prev => ({
        ...prev,
        ..._conversations,
      }));
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

  const handleInputPrompt = useCallback(
    async (prompt: string, attachments: Attachment[] = []) => {
      const normalizedPrompt = normalizeChatUserInput(prompt);
      if (!normalizedPrompt) {
        return;
      }

      const streamStartedOnTemp = currentConversation === TEMP_CONVERSATION_ID;
      if (streamStartedOnTemp) {
        isTempStreamInProgressRef.current = true;
      }

      try {
        let newConversationId = '';
        let requestId = '';
        setStreamingConversationId(currentConversation);

        const toolCallsCacheKeyPrefix =
          currentConversation === TEMP_CONVERSATION_ID
            ? createTempToolCallsCacheSessionPrefix()
            : currentConversation;

        const conversationTuple = [
          createUserMessage({
            avatar,
            name: userName,
            content: normalizedPrompt,
            timestamp: getTimestamp(Date.now()) ?? '',
          }),
          createBotMessage({
            avatar: botAvatar,
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
            prompt: normalizedPrompt,
            selectedModel,
            selectedProvider,
            currentConversation,
            attachments,
          });

          const decoder = new TextDecoder('utf-8');
          let streamEnded = false;

          while (!streamEnded) {
            const { value, done } = await reader.read();
            if (done) {
              streamEnded = true;
              break;
            }

            buffer += decoder.decode(value, { stream: true });

            const {
              events: parsedEvents,
              parseErrors,
              remainder,
            } = parseSSEBuffer(buffer);
            buffer = remainder;

            if (parseErrors.length > 0) {
              // eslint-disable-next-line no-console
              console.warn('Error parsing JSON:', parseErrors[0]);
              if (typeof onComplete === 'function') {
                onComplete('Invalid JSON received');
              }
            }

            for (const { event, data } of parsedEvents) {
              try {
                if (event === 'start') {
                  requestId = data?.request_id;

                  if (currentConversation === TEMP_CONVERSATION_ID) {
                    newConversationId = data?.conversation_id;
                  }

                  onRequestIdReady?.(requestId, newConversationId || undefined);
                }

                if (event === 'tool_call') {
                  const toolCall = parseToolCallFromEvent(data);

                  if (toolCall && data.id !== null) {
                    const newToolCall: ToolCall = toolCall;
                    pendingToolCalls.current[toolCallIdKey(data.id)] =
                      newToolCall;

                    setConversations(prevConversations => {
                      const conversation =
                        prevConversations[currentConversation] ?? [];
                      const lastMessageIndex = conversation.length - 1;

                      if (lastMessageIndex < 0) return prevConversations;

                      const lastMessage = { ...conversation[lastMessageIndex] };
                      const existingToolCalls = normalizeToolCalls(
                        lastMessage.toolCalls,
                      );
                      const nextToolCalls: ToolCall[] = [
                        ...existingToolCalls,
                        newToolCall,
                      ];
                      lastMessage.toolCalls = nextToolCalls;

                      const messageIndex = Math.floor(lastMessageIndex / 2);
                      const cacheKey = `${toolCallsCacheKeyPrefix}-${messageIndex}`;
                      setSharedToolCallsCache(cacheKey, nextToolCalls);

                      const updatedConversation = [
                        ...conversation.slice(0, lastMessageIndex),
                        lastMessage,
                      ];

                      return {
                        ...prevConversations,
                        [currentConversation]: updatedConversation,
                      };
                    });

                    const [humanMessage, aiMessage] =
                      streamingConversations.current[currentConversation] || [];
                    if (aiMessage) {
                      const existingStreamingToolCalls = normalizeToolCalls(
                        aiMessage.toolCalls,
                      );
                      streamingConversations.current[currentConversation] = [
                        humanMessage,
                        {
                          ...aiMessage,
                          toolCalls: [
                            ...existingStreamingToolCalls,
                            newToolCall,
                          ],
                        },
                      ];
                    }
                  }
                }

                if (event === 'tool_result') {
                  const result = parseToolResultFromEvent(
                    data,
                    pendingToolCalls.current,
                  );

                  if (result) {
                    setConversations(prevConversations => {
                      const conversation =
                        prevConversations[currentConversation] ?? [];
                      const lastMessageIndex = conversation.length - 1;

                      if (lastMessageIndex < 0) return prevConversations;

                      const lastMessage = { ...conversation[lastMessageIndex] };
                      const updatedToolCalls = applyToolResultToToolCalls(
                        lastMessage.toolCalls || [],
                        result,
                      );

                      lastMessage.toolCalls = updatedToolCalls;

                      const messageIndex = Math.floor(lastMessageIndex / 2);
                      const cacheKey = `${toolCallsCacheKeyPrefix}-${messageIndex}`;
                      setSharedToolCallsCache(cacheKey, updatedToolCalls);

                      const updatedConversation = [
                        ...conversation.slice(0, lastMessageIndex),
                        lastMessage,
                      ];

                      return {
                        ...prevConversations,
                        [currentConversation]: updatedConversation,
                      };
                    });

                    const [humanMessage, aiMessage] =
                      streamingConversations.current[currentConversation] || [];
                    if (aiMessage) {
                      const updatedToolCalls = applyToolResultToToolCalls(
                        aiMessage.toolCalls || [],
                        result,
                      );
                      streamingConversations.current[currentConversation] = [
                        humanMessage,
                        { ...aiMessage, toolCalls: updatedToolCalls },
                      ];
                    }

                    delete pendingToolCalls.current[result.toolIdKey];
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

                    if ((lastMessage?.content ?? '').trim().length > 0) {
                      lastMessage.isLoading = false;
                    }
                    lastMessage.content += content;
                    lastMessage.name =
                      data?.response_metadata?.model || selectedModel;
                    lastMessage.timestamp = getTimestamp(
                      // TODO: To be fixed in the query response
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

                if (event === 'interrupted') {
                  if (
                    currentConversation === TEMP_CONVERSATION_ID &&
                    data?.conversation_id
                  ) {
                    newConversationId = data.conversation_id;
                  }
                  setConversations(prevConversations => {
                    const conversation =
                      prevConversations[currentConversation] ?? [];
                    const lastMessageIndex = conversation.length - 1;
                    const lastMessage =
                      conversation.length === 0
                        ? createBotMessage({
                            content: '',
                            isLoading: false,
                            timestamp: getTimestamp(Date.now()),
                          })
                        : {
                            ...conversation[lastMessageIndex],
                            isLoading: false,
                          };
                    const updatedConversation = [
                      ...conversation.slice(0, lastMessageIndex),
                      lastMessage,
                    ];
                    return {
                      ...prevConversations,
                      [currentConversation]: updatedConversation,
                    };
                  });
                  streamEnded = true;
                  break;
                }

                if (event === 'end') {
                  const documents = data?.referenced_documents || [];

                  setConversations(prevConversations => {
                    const conversation =
                      prevConversations[currentConversation] ?? [];

                    const lastMessageIndex = conversation.length - 1;
                    const lastMessage =
                      conversation.length === 0
                        ? createBotMessage({
                            content: '',
                            isLoading: false,
                            timestamp: getTimestamp(Date.now()),
                          })
                        : {
                            ...conversation[lastMessageIndex],
                            isLoading: false,
                          };

                    const sourcesFromDocs =
                      transformDocumentsToSources(documents);
                    if (sourcesFromDocs) {
                      lastMessage.sources = sourcesFromDocs;
                    }

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
            if (streamEnded) break;
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
          migrateSharedToolCallsCacheSessionPrefixToConversation(
            toolCallsCacheKeyPrefix,
            newConversationId,
          );

          setConversations(prevConversations => {
            return {
              ...prevConversations,
              [newConversationId]: prevConversations[TEMP_CONVERSATION_ID],
            };
          });

          onStart?.(newConversationId);

          // Defer removal so it runs after the sync useEffect updates currentConversation.
          setTimeout(() => {
            setConversations(prev => {
              const { [TEMP_CONVERSATION_ID]: _, ...rest } = prev;
              return rest;
            });
          }, 0);
        } else if (currentConversation === TEMP_CONVERSATION_ID) {
          clearSharedToolCallsCacheSessionPrefix(toolCallsCacheKeyPrefix);
        }
      } finally {
        if (streamStartedOnTemp) {
          isTempStreamInProgressRef.current = false;
        }
        setStreamingConversationId(null);
      }
    },

    [
      avatar,
      botAvatar,
      userName,
      onComplete,
      onStart,
      onRequestIdReady,
      selectedModel,
      selectedProvider,
      createMessage,
      currentConversation,
    ],
  );

  return {
    conversationMessages: conversations[currentConversation] ?? [],
    handleInputPrompt,
    conversations,
    scrollToBottomRef,
    streamingConversationId,
    ...queryProps,
  };
};
