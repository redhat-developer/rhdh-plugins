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

import { useAutoScroll } from '../useAutoScroll';

describe('useAutoScroll', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    Object.defineProperty(container, 'scrollHeight', {
      value: 500,
      configurable: true,
    });
    Object.defineProperty(container, 'clientHeight', {
      value: 100,
      configurable: true,
    });
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it('should toggle autoScroll correctly', () => {
    const ref = { current: container };
    const { result } = renderHook(() => useAutoScroll(ref));

    // Start at bottom
    act(() => {
      Object.defineProperty(container, 'scrollTop', {
        value: 400, // At bottom (scrollHeight - scrollTop - clientHeight = 0)
        configurable: true,
      });
      container.dispatchEvent(new Event('scroll'));
    });

    expect(result.current.autoScroll).toBe(true);

    // Scroll up
    act(() => {
      Object.defineProperty(container, 'scrollTop', {
        value: 200, // far from bottom
        configurable: true,
      });
      container.dispatchEvent(new Event('scroll'));
    });

    expect(result.current.autoScroll).toBe(false);
  });
});
