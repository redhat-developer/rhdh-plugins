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
import React, { useRef, useState, useEffect, useCallback } from 'react';
import Box from '@mui/material/Box';
import type { Message } from '../../types';
import { ChatMessage } from '../ChatMessage';
import { HandoffDivider } from '../HandoffDivider';

const OVERSCAN = 5;
const PLACEHOLDER_HEIGHT = 80;

interface VirtualizedMessageListProps {
  messages: Message[];
  onRegenerate?: () => void;
  onEditMessage?: (messageId: string, newText: string) => void;
  /** Index of the message highlighted by keyboard navigation (-1 = none). */
  selectedMessageIndex?: number;
}

/**
 * Lightweight message virtualization using IntersectionObserver.
 * Offscreen messages are replaced with placeholders preserving their
 * measured height. This avoids adding react-virtuoso as a dependency
 * while preventing DOM bloat in long conversations (100+ messages).
 *
 * The last OVERSCAN messages are always rendered to keep the active
 * conversation area responsive.
 */
export const VirtualizedMessageList = React.memo(
  function VirtualizedMessageList({
    messages,
    onRegenerate,
    onEditMessage,
    selectedMessageIndex = -1,
  }: VirtualizedMessageListProps) {
    const [visibleIds, setVisibleIds] = useState<Set<string>>(new Set());
    const heightMapRef = useRef<Map<string, number>>(new Map());
    const observerRef = useRef<IntersectionObserver | null>(null);
    const nodeMapRef = useRef<Map<string, HTMLDivElement>>(new Map());

    const sessionKey = messages[0]?.id;
    useEffect(() => {
      setVisibleIds(new Set());
      heightMapRef.current.clear();
    }, [sessionKey]);

    const lastAssistantIndex = messages.reduce(
      (acc, m, i) => (!m.isUser ? i : acc),
      -1,
    );

    const alwaysVisibleStart = Math.max(0, messages.length - OVERSCAN);

    const observeNode = useCallback(
      (id: string, node: HTMLDivElement | null) => {
        if (node) {
          nodeMapRef.current.set(id, node);
          observerRef.current?.observe(node);
        } else {
          const prev = nodeMapRef.current.get(id);
          if (prev) observerRef.current?.unobserve(prev);
          nodeMapRef.current.delete(id);
        }
      },
      [],
    );

    useEffect(() => {
      observerRef.current = new IntersectionObserver(
        entries => {
          setVisibleIds(prev => {
            const next = new Set(prev);
            let changed = false;
            for (const entry of entries) {
              const id = (entry.target as HTMLElement).dataset.msgId;
              if (!id) continue;
              if (entry.isIntersecting) {
                if (!next.has(id)) {
                  next.add(id);
                  changed = true;
                }
                heightMapRef.current.set(
                  id,
                  entry.target.getBoundingClientRect().height,
                );
              } else {
                if (next.has(id)) {
                  next.delete(id);
                  changed = true;
                }
              }
            }
            return changed ? next : prev;
          });
        },
        { rootMargin: '200px 0px' },
      );

      return () => {
        observerRef.current?.disconnect();
      };
    }, []);

    function getPreviousAssistantAgent(index: number): string | undefined {
      for (let i = index - 1; i >= 0; i--) {
        if (!messages[i].isUser) return messages[i].agentName;
      }
      return undefined;
    }

    const highlightSx = {
      outline: '2px solid',
      outlineColor: 'primary.main',
      outlineOffset: 2,
      borderRadius: 1,
      transition: 'outline-color 0.15s',
    };

    if (messages.length <= 30) {
      return (
        <>
          {messages.map((message, index) => {
            const isLastAssistant =
              !message.isUser && index === lastAssistantIndex;
            const showHandoff =
              !message.isUser &&
              !!message.agentName &&
              message.agentName !== getPreviousAssistantAgent(index);
            const isSelected = index === selectedMessageIndex;
            return (
              <React.Fragment key={message.id}>
                {showHandoff && (
                  <HandoffDivider agentName={message.agentName!} />
                )}
                <Box
                  data-msg-index={index}
                  sx={isSelected ? highlightSx : undefined}
                >
                  <ChatMessage
                    message={message}
                    isLastAssistantMessage={isLastAssistant}
                    onRegenerate={isLastAssistant ? onRegenerate : undefined}
                    onEditMessage={message.isUser ? onEditMessage : undefined}
                  />
                </Box>
              </React.Fragment>
            );
          })}
        </>
      );
    }

    return (
      <>
        {messages.map((message, index) => {
          const isAlwaysVisible = index >= alwaysVisibleStart;
          const isVisible = isAlwaysVisible || visibleIds.has(message.id);
          const isLastAssistant =
            !message.isUser && index === lastAssistantIndex;

          if (!isVisible) {
            const h =
              heightMapRef.current.get(message.id) ?? PLACEHOLDER_HEIGHT;
            return (
              <Box
                key={message.id}
                data-msg-id={message.id}
                ref={(node: HTMLDivElement | null) =>
                  observeNode(message.id, node)
                }
                sx={{ height: h, flexShrink: 0 }}
              />
            );
          }

          const showHandoff =
            !message.isUser &&
            !!message.agentName &&
            message.agentName !== getPreviousAssistantAgent(index);

          const isSelected = index === selectedMessageIndex;
          return (
            <React.Fragment key={message.id}>
              {showHandoff && <HandoffDivider agentName={message.agentName!} />}
              <Box
                data-msg-id={message.id}
                data-msg-index={index}
                ref={(node: HTMLDivElement | null) =>
                  observeNode(message.id, node)
                }
                sx={isSelected ? highlightSx : undefined}
              >
                <ChatMessage
                  message={message}
                  isLastAssistantMessage={isLastAssistant}
                  onRegenerate={isLastAssistant ? onRegenerate : undefined}
                  onEditMessage={message.isUser ? onEditMessage : undefined}
                />
              </Box>
            </React.Fragment>
          );
        })}
      </>
    );
  },
);
