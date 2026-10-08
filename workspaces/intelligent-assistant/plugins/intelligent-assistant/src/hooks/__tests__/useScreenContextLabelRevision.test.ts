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

import { resetScreenContextLabelSnapshotCache } from '../screenContextLabelSubscription';
import { useScreenContextLabelRevision } from '../useScreenContextLabelRevision';

describe('useScreenContextLabelRevision', () => {
  beforeEach(() => {
    resetScreenContextLabelSnapshotCache();
    document.body.innerHTML = `
      <div id="root">
        <main><h2 class="bui-HeaderTitle">Page A</h2></main>
      </div>
    `;
    window.history.pushState({}, '', '/page-a');
  });

  it('updates when the URL changes', () => {
    const { result } = renderHook(() => useScreenContextLabelRevision());
    expect(result.current).toContain('/page-a');

    act(() => {
      window.history.pushState({}, '', '/page-b');
    });

    expect(result.current).toContain('/page-b');
  });

  it('updates when the page title in chrome changes', async () => {
    const { result } = renderHook(() => useScreenContextLabelRevision());
    expect(result.current).toContain('Page A');

    await act(async () => {
      const title = document.querySelector('.bui-HeaderTitle');
      if (title) {
        title.textContent = 'Page B';
      }
      await new Promise<void>(resolve => {
        requestAnimationFrame(() => resolve());
      });
    });

    expect(result.current).toContain('Page B');
  });
});
