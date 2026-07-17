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

import { mockUseTranslation } from '../../test-utils/mockTranslations';

jest.mock('../../hooks/useTranslation', () => ({
  useTranslation: mockUseTranslation,
}));

import { renderHook } from '@testing-library/react';

import { useHomePageCardTitle } from '../useHomePageCardTitle';

describe('useHomePageCardTitle', () => {
  it('returns translated title from titleKey prop', () => {
    const { result } = renderHook(() =>
      useHomePageCardTitle('featuredDocs.title', {
        titleKey: 'starredEntities.title',
      }),
    );

    expect(result.current).toBe('Starred catalog entities');
  });

  it('returns explicit title prop when titleKey translation is unavailable', () => {
    const { result } = renderHook(() =>
      useHomePageCardTitle('featuredDocs.title', {
        titleKey: 'missing.translation.key',
        title: 'Explicit title',
      }),
    );

    expect(result.current).toBe('Explicit title');
  });

  it('uses defaultTitleKey when titleKey prop is not provided', () => {
    const { result } = renderHook(() =>
      useHomePageCardTitle('featuredDocs.title', {}),
    );

    expect(result.current).toBe('Featured Docs');
  });

  it('falls back to defaultTitleKey translation when title prop is not provided', () => {
    const { result } = renderHook(() =>
      useHomePageCardTitle('recentlyVisited.title', {
        titleKey: 'missing.translation.key',
      }),
    );

    expect(result.current).toBe('Recently Visited');
  });
});
