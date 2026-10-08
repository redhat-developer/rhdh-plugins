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

import { useWindowLocation } from '../useWindowLocation';

describe('useWindowLocation', () => {
  beforeEach(() => {
    window.history.pushState({}, '', '/');
  });

  it('updates when history.pushState changes the URL', () => {
    const { result } = renderHook(() => useWindowLocation());
    expect(result.current.pathname).toBe('/');

    act(() => {
      window.history.pushState({}, '', '/catalog/default/component/demo');
    });

    expect(result.current.pathname).toBe('/catalog/default/component/demo');
  });
});
