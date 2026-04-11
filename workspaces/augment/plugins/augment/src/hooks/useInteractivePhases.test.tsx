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

import { renderHook, act } from '@testing-library/react';
import { useInteractivePhases } from './useInteractivePhases';
import type { AugmentApi } from '../api/AugmentApi';
import type { StreamingState } from '../components/StreamingMessage/StreamingMessage.types';
import type { Message } from '../types';

function createStreamingState(
  overrides: Partial<StreamingState> = {},
): StreamingState {
  return {
    phase: 'form_input',
    text: '',
    completed: false,
    toolCalls: [],
    filesSearched: [],
    handoffs: [],
    reasoningSpans: [],
    responseId: 'resp-1',
    ...overrides,
  };
}

function createOptions(
  overrides: Partial<Parameters<typeof useInteractivePhases>[0]> = {},
) {
  return {
    api: {
      submitToolApproval: jest.fn().mockResolvedValue({
        success: true,
        content: 'Done',
        responseId: 'resp-2',
      }),
    } as unknown as AugmentApi,
    streamingState: createStreamingState({
      pendingForm: {
        taskId: 'task-1',
        contextId: 'ctx-1',
        form: {
          title: 'Test Form',
          fields: [{ id: 'name', type: 'string', title: 'Name' }],
        },
      },
    }),
    messages: [] as Message[],
    onMessagesChange: jest.fn(),
    setStreamingState: jest.fn(),
    setIsTyping: jest.fn(),
    setLastCompletedState: jest.fn(),
    ...overrides,
  };
}

describe('useInteractivePhases', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('handleFormSubmit', () => {
    it('calls submitToolApproval with form values and adds response message', async () => {
      const opts = createOptions();
      const { result } = renderHook(() => useInteractivePhases(opts));

      await act(async () => {
        await result.current.handleFormSubmit({ name: 'Alice' });
      });

      expect(opts.api.submitToolApproval).toHaveBeenCalledWith(
        'ctx-1',
        'task-1',
        true,
        'form_response',
        JSON.stringify({ name: 'Alice' }),
      );

      expect(opts.onMessagesChange).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ text: 'Done', isUser: false }),
        ]),
      );
    });

    it('preserves lastCompletedState and clears streaming on success', async () => {
      const opts = createOptions();
      const { result } = renderHook(() => useInteractivePhases(opts));

      await act(async () => {
        await result.current.handleFormSubmit({ name: 'Bob' });
      });

      expect(opts.setLastCompletedState).toHaveBeenCalledWith(
        opts.streamingState,
      );
      expect(opts.setStreamingState).toHaveBeenCalledWith(null);
      expect(opts.setIsTyping).toHaveBeenCalledWith(false);
    });

    it('adds error message on failure', async () => {
      const api = {
        submitToolApproval: jest
          .fn()
          .mockRejectedValue(new Error('Server down')),
      } as unknown as AugmentApi;
      const opts = createOptions({ api });
      const { result } = renderHook(() => useInteractivePhases(opts));

      await act(async () => {
        await result.current.handleFormSubmit({ field: 'val' });
      });

      expect(opts.onMessagesChange).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            text: expect.stringContaining('Server down'),
            errorCode: 'form_submission_error',
          }),
        ]),
      );
      expect(opts.setStreamingState).toHaveBeenCalledWith(null);
    });

    it('does nothing when no pendingForm', async () => {
      const opts = createOptions({
        streamingState: createStreamingState({ pendingForm: undefined }),
      });
      const { result } = renderHook(() => useInteractivePhases(opts));

      await act(async () => {
        await result.current.handleFormSubmit({ name: 'Alice' });
      });

      expect(opts.api.submitToolApproval).not.toHaveBeenCalled();
    });
  });

  describe('handleFormCancel', () => {
    it('clears state immediately and sends rejection', async () => {
      const opts = createOptions();
      const { result } = renderHook(() => useInteractivePhases(opts));

      await act(async () => {
        await result.current.handleFormCancel();
      });

      expect(opts.setLastCompletedState).toHaveBeenCalledWith(
        opts.streamingState,
      );
      expect(opts.setStreamingState).toHaveBeenCalledWith(null);
      expect(opts.setIsTyping).toHaveBeenCalledWith(false);
      expect(opts.api.submitToolApproval).toHaveBeenCalledWith(
        'ctx-1',
        'task-1',
        false,
      );
    });
  });

  describe('handleAuthConfirm', () => {
    it('calls submitToolApproval with oauth_confirm and adds response', async () => {
      const opts = createOptions({
        streamingState: createStreamingState({
          pendingAuth: {
            taskId: 'auth-task',
            authType: 'oauth',
            url: 'https://auth.example.com',
          },
        }),
      });
      const { result } = renderHook(() => useInteractivePhases(opts));

      await act(async () => {
        await result.current.handleAuthConfirm();
      });

      expect(opts.api.submitToolApproval).toHaveBeenCalledWith(
        'resp-1',
        'auth-task',
        true,
        'oauth_confirm',
      );
      expect(opts.setLastCompletedState).toHaveBeenCalledWith(
        opts.streamingState,
      );
      expect(opts.setStreamingState).toHaveBeenCalledWith(null);
    });

    it('adds error message on auth failure', async () => {
      const api = {
        submitToolApproval: jest
          .fn()
          .mockRejectedValue(new Error('Auth expired')),
      } as unknown as AugmentApi;
      const opts = createOptions({
        api,
        streamingState: createStreamingState({
          pendingAuth: {
            taskId: 'auth-task',
            authType: 'oauth',
          },
        }),
      });
      const { result } = renderHook(() => useInteractivePhases(opts));

      await act(async () => {
        await result.current.handleAuthConfirm();
      });

      expect(opts.onMessagesChange).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            text: expect.stringContaining('Auth expired'),
            errorCode: 'auth_confirmation_error',
          }),
        ]),
      );
    });

    it('does nothing when no pendingAuth', async () => {
      const opts = createOptions({
        streamingState: createStreamingState({ pendingAuth: undefined }),
      });
      const { result } = renderHook(() => useInteractivePhases(opts));

      await act(async () => {
        await result.current.handleAuthConfirm();
      });

      expect(opts.api.submitToolApproval).not.toHaveBeenCalled();
    });
  });

  describe('handleSecretsSubmit', () => {
    it('calls submitToolApproval with secrets and adds response', async () => {
      const opts = createOptions({
        streamingState: createStreamingState({
          pendingAuth: {
            taskId: 'sec-task',
            authType: 'secret',
            demands: {
              secrets: [{ name: 'API_KEY', description: 'Your API key' }],
            },
          },
        }),
      });
      const { result } = renderHook(() => useInteractivePhases(opts));

      const secrets = { API_KEY: 'sk-12345' };
      await act(async () => {
        await result.current.handleSecretsSubmit(secrets);
      });

      expect(opts.api.submitToolApproval).toHaveBeenCalledWith(
        'resp-1',
        'sec-task',
        true,
        'secrets_response',
        JSON.stringify(secrets),
      );

      expect(opts.onMessagesChange).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ text: 'Done', isUser: false }),
        ]),
      );
      expect(opts.setLastCompletedState).toHaveBeenCalledWith(
        opts.streamingState,
      );
    });

    it('adds error message on secrets submission failure', async () => {
      const api = {
        submitToolApproval: jest
          .fn()
          .mockRejectedValue(new Error('Invalid key')),
      } as unknown as AugmentApi;
      const opts = createOptions({
        api,
        streamingState: createStreamingState({
          pendingAuth: {
            taskId: 'sec-task',
            authType: 'secret',
          },
        }),
      });
      const { result } = renderHook(() => useInteractivePhases(opts));

      await act(async () => {
        await result.current.handleSecretsSubmit({ KEY: 'bad' });
      });

      expect(opts.onMessagesChange).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            text: expect.stringContaining('Invalid key'),
            errorCode: 'secrets_submission_error',
          }),
        ]),
      );
    });
  });
});
