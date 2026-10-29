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

import { PropsWithChildren } from 'react';

import { act, renderHook } from '@testing-library/react';

import {
  NotebookStreamProvider,
  useNotebookStream,
  useNotebookStreamStore,
} from '../NotebookStreamProvider';
import { NotebookSendParams } from '../notebookStreamStore';

function wrapper({ children }: PropsWithChildren) {
  return <NotebookStreamProvider>{children}</NotebookStreamProvider>;
}

function hangingCreateMessage(onSignal: (signal?: AbortSignal) => void) {
  let calls = 0;
  const createMessage: NotebookSendParams['createMessage'] = async (
    _prompt,
    options,
  ) => {
    calls += 1;
    onSignal(options?.signal);
    return new Promise<ReadableStreamDefaultReader<Uint8Array>>(() => {});
  };
  return { calls: () => calls, createMessage };
}

function sendParams(
  createMessage: NotebookSendParams['createMessage'],
): NotebookSendParams {
  return {
    prompt: 'summarize the doc',
    seedMessages: [],
    conversationId: 'conv-1',
    avatar: 'user',
    botAvatar: 'bot',
    selectedModel: 'gpt-4',
    createMessage,
  };
}

describe('NotebookStreamProvider', () => {
  it('throws when the stream hook is used outside the provider', () => {
    const consoleSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    expect(() => {
      renderHook(() => useNotebookStreamStore());
    }).toThrow(
      'useNotebookStreamStore must be used within a NotebookStreamProvider',
    );

    consoleSpy.mockRestore();
  });

  it('keeps each session stream independent and aborts it from the hook', async () => {
    let signal: AbortSignal | undefined;
    const { createMessage } = hangingCreateMessage(next => {
      signal = next;
    });

    const { result } = renderHook(
      () => ({
        a: useNotebookStream('session-a'),
        b: useNotebookStream('session-b'),
      }),
      { wrapper },
    );

    act(() => {
      result.current.a.send(sendParams(createMessage));
    });

    expect(result.current.a.status).toBe('streaming');
    expect(result.current.b.status).toBe('idle');
    expect(signal?.aborted).toBe(false);

    act(() => {
      result.current.a.stop();
    });

    expect(signal?.aborted).toBe(true);
    expect(result.current.a.status).toBe('stopped');
    expect(result.current.b.status).toBe('idle');
  });

  it('aborts in-flight streams when the provider unmounts', () => {
    let signal: AbortSignal | undefined;
    const { createMessage } = hangingCreateMessage(next => {
      signal = next;
    });

    const { result, unmount } = renderHook(
      () => useNotebookStream('session-a'),
      { wrapper },
    );

    act(() => {
      result.current.send(sendParams(createMessage));
    });
    expect(signal?.aborted).toBe(false);

    unmount();

    expect(signal?.aborted).toBe(true);
  });

  it('does not start a stream for a blank prompt', () => {
    const { calls, createMessage } = hangingCreateMessage(() => {});
    const { result } = renderHook(() => useNotebookStream('session-a'), {
      wrapper,
    });

    act(() => {
      result.current.send({ ...sendParams(createMessage), prompt: '   ' });
    });

    expect(calls()).toBe(0);
    expect(result.current.status).toBe('idle');
  });
});
