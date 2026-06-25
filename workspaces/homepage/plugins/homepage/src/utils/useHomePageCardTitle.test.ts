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

import { mockUseTranslation } from '../test-utils/mockTranslations';

jest.mock('../hooks/useTranslation', () => ({
  useTranslation: mockUseTranslation,
}));

import { renderHook } from '@testing-library/react';

import { useHomePageCardTitle } from './useHomePageCardTitle';

describe('useHomePageCardTitle', () => {
  it('uses the default translation key', () => {
    const { result } = renderHook(() =>
      useHomePageCardTitle('randomJoke.title', {}),
    );

    expect(result.current).toBe('Random Joke');
  });

  it('uses a custom titleKey when provided', () => {
    const { result } = renderHook(() =>
      useHomePageCardTitle('randomJoke.title', {
        titleKey: 'search.title',
      }),
    );

    expect(result.current).toBe('Search');
  });

  it('falls back to the provided title when the translation is missing', () => {
    const { result } = renderHook(() =>
      useHomePageCardTitle('missing.translation.key', {
        title: 'Custom title',
      }),
    );

    expect(result.current).toBe('Custom title');
  });
});
