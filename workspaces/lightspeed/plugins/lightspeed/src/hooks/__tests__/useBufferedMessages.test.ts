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
import { act, renderHook } from '@testing-library/react';

import { useBufferedMessages } from '../useBufferedMessages';

jest.useFakeTimers();

describe('useBufferedMessages', () => {
  it('should update buffered messages after the specified interval', () => {
    const messages1 = ['msg1', 'msg2', 'msg3'];
    const messages2 = ['msg4', 'msg5', 'msg6'];

    const { result, rerender } = renderHook(
      ({ msgs }) => useBufferedMessages(msgs, 30),
      {
        initialProps: { msgs: messages1 },
      },
    );

    expect(result.current).toEqual(messages1);

    rerender({ msgs: messages2 });
    // Should not update immediately
    expect(result.current).toEqual(messages1);

    act(() => {
      jest.advanceTimersByTime(30);
    });

    expect(result.current).toEqual(messages2);
  });
});
