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
import {
  useEffect,
  useState,
  useCallback,
  useRef,
  type RefObject,
} from 'react';

interface UseChatKeyboardShortcutsOptions {
  onNewChat?: () => void;
  isTyping: boolean;
  cancelRequest: () => void;
  chatInputRef: RefObject<HTMLTextAreaElement | null>;
  /** When true, Escape is owned by the approval dialog — skip streaming cancel. */
  isApprovalDialogOpen?: boolean;
  /** Called when the user presses "?" to open the shortcut help dialog. */
  onShowShortcuts?: () => void;
  /** Total number of messages for arrow-key navigation bounds. */
  messageCount?: number;
}

export interface ChatKeyboardShortcutsReturn {
  /** Index of the currently highlighted message, or -1 if none. */
  selectedMessageIndex: number;
  /** Clear the current message selection. */
  clearSelection: () => void;
}

/**
 * Registers global keyboard shortcuts for the chat interface:
 * - Cmd/Ctrl+Shift+O → New Chat
 * - Escape → Cancel streaming (unless tool-approval dialog is open)
 * - "/" → Focus input
 * - "?" → Show keyboard shortcuts help
 * - ArrowUp/Down → Navigate between messages (when not editing)
 * - Escape → Clear message selection (when not streaming)
 */
export function useChatKeyboardShortcuts({
  onNewChat,
  isTyping,
  cancelRequest,
  chatInputRef,
  isApprovalDialogOpen = false,
  onShowShortcuts,
  messageCount = 0,
}: UseChatKeyboardShortcutsOptions): ChatKeyboardShortcutsReturn {
  const [selectedMessageIndex, setSelectedMessageIndex] = useState(-1);
  const selectedRef = useRef(selectedMessageIndex);
  selectedRef.current = selectedMessageIndex;

  const clearSelection = useCallback(() => setSelectedMessageIndex(-1), []);

  useEffect(() => {
    setSelectedMessageIndex(-1);
  }, [messageCount]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isMod = e.metaKey || e.ctrlKey;
      const target = e.target as HTMLElement;
      const isEditing =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      if (isMod && e.shiftKey && e.key === 'O') {
        e.preventDefault();
        if (!isTyping) {
          onNewChat?.();
        }
        return;
      }

      if (e.key === 'Escape') {
        if (isTyping && !isApprovalDialogOpen) {
          e.preventDefault();
          cancelRequest();
          return;
        }
        if (selectedRef.current >= 0) {
          e.preventDefault();
          setSelectedMessageIndex(-1);
          return;
        }
      }

      if (e.key === '?' && !isEditing && !isMod) {
        e.preventDefault();
        onShowShortcuts?.();
        return;
      }

      if (e.key === '/' && !isEditing && !isMod) {
        e.preventDefault();
        chatInputRef.current?.focus();
        return;
      }

      if (
        (e.key === 'ArrowUp' || e.key === 'ArrowDown') &&
        !isEditing &&
        !isMod &&
        messageCount > 0
      ) {
        e.preventDefault();
        setSelectedMessageIndex(prev => {
          let next: number;
          if (e.key === 'ArrowUp') {
            next = prev <= 0 ? messageCount - 1 : prev - 1;
          } else {
            next = prev >= messageCount - 1 ? 0 : prev + 1;
          }
          requestAnimationFrame(() => {
            const el = document.querySelector(`[data-msg-index="${next}"]`);
            el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          });
          return next;
        });
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [
    onNewChat,
    isTyping,
    cancelRequest,
    chatInputRef,
    isApprovalDialogOpen,
    onShowShortcuts,
    messageCount,
  ]);

  return { selectedMessageIndex, clearSelection };
}
