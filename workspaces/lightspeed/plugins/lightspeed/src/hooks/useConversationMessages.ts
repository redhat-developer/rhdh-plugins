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

import { MessageProps } from '@patternfly/chatbot';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { lightspeedApiRef } from '../api/api';
import { ScrollContainerHandle } from '../components/LightspeedChatBox';
import { TEMP_CONVERSATION_ID } from '../const';
import botAvatar from '../images/bot-avatar.svg';
import userAvatar from '../images/user-avatar.svg';
import {
  Attachment,
  BaseMessage,
  LCSConversation,
  ReferencedDocument,
  ToolCall,
} from '../types';
import {
  createBotMessage,
  createUserMessage,
  getConversationsData,
  getTimestamp,
  transformDocumentsToSources,
} from '../utils/lightspeed-chatbox-utils';
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

const toolCallIdKey = (id: string | number): string => {
  return String(id);
};

const normalizeToolCalls = (
  calls: (ToolCall | undefined)[] | undefined,
): ToolCall[] => (calls ?? []).filter((tc): tc is ToolCall => tc !== null);

const isMcpStyleToolCallPayload = (
  data: Record<string, any> | undefined,
): boolean => {
  return (
    !!data &&
    typeof data.name === 'string' &&
    data.name.trim().length > 0 &&
    data.id !== null
  );
};

/** Legacy tool_result uses data.token with at least tool_name and response. */
const isLegacyToolResultToken = (
  token: unknown,
): token is { tool_name: string; response?: unknown } => {
  return (
    !!token &&
    typeof token === 'object' &&
    !Array.isArray(token) &&
    typeof (token as { tool_name?: string }).tool_name === 'string' &&
    (token as { tool_name: string }).tool_name.length > 0
  );
};

let tempToolCallsCachePrefixFallbackSeq = 0;

/** Unique prefix per temp send so late streams cannot migrate another session's tool cache. */
function createTempToolCallsCacheSessionPrefix(): string {
  const suffix =
    globalThis.crypto?.randomUUID?.() ??
    `${Date.now()}-${++tempToolCallsCachePrefixFallbackSeq}`;
  return `lightspeed-temp:${suffix}`;
}

const legacyToolResultToString = (response: unknown): string => {
  if (!response) return '';
  if (typeof response === 'string') return response;
  try {
    return JSON.stringify(response);
  } catch {
    return String(response);
  }
};

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
  onRequestIdReady?: (request_id: string) => void,
): UseConversationMessagesReturn => {
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
            content: prompt,
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
            prompt,
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
                  requestId = data?.request_id;
                  onRequestIdReady?.(requestId);

                  if (currentConversation === TEMP_CONVERSATION_ID) {
                    // If the conversation is temp, we need to set the new conversation id
                    newConversationId = data?.conversation_id;
                  }
                }

                // Handle tool_call event
                if (event === 'tool_call') {
                  const toolCallData = data?.token;
                  const legacyObjectCall =
                    typeof toolCallData === 'object' &&
                    toolCallData !== null &&
                    !Array.isArray(toolCallData) &&
                    (toolCallData as { tool_name?: string }).tool_name;

                  const mcpStyle = isMcpStyleToolCallPayload(data);
                  const rawArgs = data?.args ?? data?.arguments;
                  const mcpArgs: Record<string, any> =
                    rawArgs &&
                    typeof rawArgs === 'object' &&
                    !Array.isArray(rawArgs)
                      ? rawArgs
                      : {};

                  let toolCall: ToolCall | undefined;
                  // Prefer legacy token object when present (backward compatible)
                  if (legacyObjectCall && data.id !== null) {
                    toolCall = {
                      id: data.id,
                      toolName: (toolCallData as { tool_name: string })
                        .tool_name,
                      arguments:
                        (toolCallData as { arguments?: Record<string, any> })
                          .arguments || {},
                      startTime: Date.now(),
                      isLoading: true,
                    };
                  } else if (mcpStyle) {
                    toolCall = {
                      id: data.id,
                      toolName: data.name.trim(),
                      description:
                        typeof data.type === 'string' && data.type !== data.name
                          ? data.type
                          : undefined,
                      arguments: mcpArgs,
                      startTime: Date.now(),
                      isLoading: true,
                    };
                  }

                  if (toolCall && data.id !== null) {
                    const newToolCall: ToolCall = toolCall;
                    pendingToolCalls.current[toolCallIdKey(data.id)] =
                      newToolCall;

                    // Update the bot message with the pending tool call
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

                      // Cache tool calls for this message (message pair index)
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

                    // Also update streaming ref
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

                // Handle tool_result event
                if (event === 'tool_result') {
                  const tokenResult = data?.token;
                  const legacyResult = isLegacyToolResultToken(tokenResult);

                  const mcpHasContent =
                    data?.id !== null &&
                    data.content !== undefined &&
                    !legacyResult;

                  let responsePayload: string | undefined;
                  let matchToolName: string | undefined;
                  let toolIdKey: string | undefined;

                  if (legacyResult) {
                    responsePayload = legacyToolResultToString(
                      tokenResult.response,
                    );
                    matchToolName = tokenResult.tool_name;
                    toolIdKey =
                      data?.id !== null ? toolCallIdKey(data.id) : undefined;
                  } else if (mcpHasContent) {
                    toolIdKey = toolCallIdKey(data.id);
                    responsePayload =
                      typeof data.content === 'string'
                        ? data.content
                        : JSON.stringify(data.content);
                    if (
                      typeof data.status === 'string' &&
                      data.status !== 'success'
                    ) {
                      responsePayload = `[${data.status}] ${responsePayload}`;
                    }
                  }

                  if (
                    responsePayload !== undefined &&
                    toolIdKey !== undefined
                  ) {
                    const pendingCall = pendingToolCalls.current[toolIdKey];
                    const endTime = Date.now();
                    const executionTime = pendingCall
                      ? (endTime - pendingCall.startTime) / 1000
                      : 0;

                    // Update the tool call with result
                    setConversations(prevConversations => {
                      const conversation =
                        prevConversations[currentConversation] ?? [];
                      const lastMessageIndex = conversation.length - 1;

                      if (lastMessageIndex < 0) return prevConversations;

                      const lastMessage = { ...conversation[lastMessageIndex] };
                      const toolCalls = lastMessage.toolCalls || [];

                      // Find and update the matching tool call
                      const updatedToolCalls = toolCalls.map(tc => {
                        const idMatches =
                          toolCallIdKey(tc.id) === toolIdKey ||
                          (matchToolName !== undefined &&
                            tc.toolName === matchToolName);
                        if (idMatches) {
                          return {
                            ...tc,
                            response: responsePayload,
                            endTime,
                            executionTime,
                            isLoading: false,
                          };
                        }
                        return tc;
                      });

                      lastMessage.toolCalls = updatedToolCalls;

                      // Update cache with completed tool call
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

                    // Also update streaming ref
                    const [humanMessage, aiMessage] =
                      streamingConversations.current[currentConversation] || [];
                    if (aiMessage) {
                      const toolCalls = aiMessage.toolCalls || [];
                      const updatedToolCalls = toolCalls.map(tc => {
                        const idMatches =
                          toolCallIdKey(tc.id) === toolIdKey ||
                          (matchToolName !== undefined &&
                            tc.toolName === matchToolName);
                        if (idMatches) {
                          return {
                            ...tc,
                            response: responsePayload,
                            endTime,
                            executionTime,
                            isLoading: false,
                          };
                        }
                        return tc;
                      });
                      streamingConversations.current[currentConversation] = [
                        humanMessage,
                        { ...aiMessage, toolCalls: updatedToolCalls },
                      ];
                    }

                    // Clean up pending tool call
                    delete pendingToolCalls.current[toolIdKey];
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

                    if (documents.length) {
                      lastMessage.sources = {
                        sources: documents.map((doc: ReferencedDocument) => ({
                          title: doc.doc_title,
                          link: doc.doc_url,
                          body: doc.doc_description,
                        })),
                      };
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
