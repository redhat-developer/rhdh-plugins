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

import { useCallback, useRef } from 'react';
import type { AugmentApi } from '../api/AugmentApi';
import type { Message } from '../types';
import type { StreamingState } from '../components/StreamingMessage/StreamingMessage.types';
import { debugError } from '../utils';

interface UseInteractivePhasesOptions {
  api: AugmentApi;
  streamingState: StreamingState | null;
  messages: Message[];
  onMessagesChange: (messages: Message[]) => void;
  setStreamingState: (state: StreamingState | null) => void;
  setIsTyping: (typing: boolean) => void;
}

export function useInteractivePhases({
  api,
  streamingState,
  messages,
  onMessagesChange,
  setStreamingState,
  setIsTyping,
}: UseInteractivePhasesOptions) {
  const msgCounter = useRef(0);

  const handleFormSubmit = useCallback(
    async (values: Record<string, unknown>) => {
      const pending = streamingState?.pendingForm;
      if (!pending) return;
      try {
        const result = await api.submitToolApproval(
          pending.contextId || streamingState?.responseId || '',
          pending.taskId || '',
          true,
          'form_response',
          JSON.stringify(values),
        );
        const text = result?.content || 'Request processed successfully.';
        const botMsg: Message = {
          id: `msg-approval-${msgCounter.current++}`,
          text,
          isUser: false,
          timestamp: new Date(),
          responseId: result?.responseId,
        };
        onMessagesChange([...messages, botMsg]);
      } catch (err) {
        debugError('Form submission failed:', err);
        const errorMsg: Message = {
          id: `msg-error-${msgCounter.current++}`,
          text: `Form submission failed: ${err instanceof Error ? err.message : 'Unknown error'}. Please try again.`,
          isUser: false,
          timestamp: new Date(),
          errorCode: 'form_submission_error',
        };
        onMessagesChange([...messages, errorMsg]);
      } finally {
        setStreamingState(null);
        setIsTyping(false);
      }
    },
    [
      api,
      streamingState,
      setStreamingState,
      setIsTyping,
      messages,
      onMessagesChange,
    ],
  );

  const handleFormCancel = useCallback(async () => {
    const pending = streamingState?.pendingForm;
    if (!pending) return;
    setStreamingState(null);
    setIsTyping(false);
    try {
      await api.submitToolApproval(
        pending.contextId || streamingState?.responseId || '',
        pending.taskId || '',
        false,
      );
    } catch (err) {
      debugError('Form cancellation failed:', err);
      const errMsg =
        err instanceof Error ? err.message : 'Form cancellation failed';
      onMessagesChange([
        ...messages,
        {
          id: `form-cancel-err-${Date.now()}`,
          text: `Error: ${errMsg}`,
          isUser: false,
          timestamp: new Date(),
          errorCode: 'form_cancel_error',
        },
      ]);
    }
  }, [
    api,
    streamingState,
    setStreamingState,
    setIsTyping,
    messages,
    onMessagesChange,
  ]);

  const handleAuthConfirm = useCallback(async () => {
    const pending = streamingState?.pendingAuth;
    if (!pending) return;
    try {
      const result = await api.submitToolApproval(
        streamingState?.responseId || pending.taskId || '',
        pending.taskId || '',
        true,
        'oauth_confirm',
      );
      const text = result?.content || 'Authentication confirmed.';
      const botMsg: Message = {
        id: `msg-approval-${msgCounter.current++}`,
        text,
        isUser: false,
        timestamp: new Date(),
        responseId: result?.responseId,
      };
      onMessagesChange([...messages, botMsg]);
    } catch (err) {
      debugError('OAuth confirmation failed:', err);
      const errorMsg: Message = {
        id: `msg-error-${msgCounter.current++}`,
        text: `Authentication failed: ${err instanceof Error ? err.message : 'Unknown error'}. Please try again.`,
        isUser: false,
        timestamp: new Date(),
        errorCode: 'auth_confirmation_error',
      };
      onMessagesChange([...messages, errorMsg]);
    } finally {
      setStreamingState(null);
      setIsTyping(false);
    }
  }, [
    api,
    streamingState,
    setStreamingState,
    setIsTyping,
    messages,
    onMessagesChange,
  ]);

  const handleSecretsSubmit = useCallback(
    async (secrets: Record<string, string>) => {
      const pending = streamingState?.pendingAuth;
      if (!pending) return;
      try {
        const result = await api.submitToolApproval(
          streamingState?.responseId || pending.taskId || '',
          pending.taskId || '',
          true,
          'secrets_response',
          JSON.stringify(secrets),
        );
        const text = result?.content || 'Secrets submitted successfully.';
        const botMsg: Message = {
          id: `msg-approval-${msgCounter.current++}`,
          text,
          isUser: false,
          timestamp: new Date(),
          responseId: result?.responseId,
        };
        onMessagesChange([...messages, botMsg]);
      } catch (err) {
        debugError('Secrets submission failed:', err);
        const errorMsg: Message = {
          id: `msg-error-${msgCounter.current++}`,
          text: `Secrets submission failed: ${err instanceof Error ? err.message : 'Unknown error'}. Please try again.`,
          isUser: false,
          timestamp: new Date(),
          errorCode: 'secrets_submission_error',
        };
        onMessagesChange([...messages, errorMsg]);
      } finally {
        setStreamingState(null);
        setIsTyping(false);
      }
    },
    [
      api,
      streamingState,
      setStreamingState,
      setIsTyping,
      messages,
      onMessagesChange,
    ],
  );

  return {
    handleFormSubmit,
    handleFormCancel,
    handleAuthConfirm,
    handleSecretsSubmit,
  };
}
