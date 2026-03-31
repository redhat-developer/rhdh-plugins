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

import { renderHook } from '@testing-library/react';

import { useTranslatedMetricLabels } from '../useTranslatedMetricLabels';
import { useTranslation } from '../useTranslation';

jest.mock('../useTranslation', () => ({
  useTranslation: jest.fn().mockReturnValue({
    t: (key: string) => key,
  }),
}));

const mockUseTranslation = useTranslation as jest.Mock;

describe('useTranslatedMetricLabels', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return empty title and description when metric is undefined', () => {
    const { result } = renderHook(() => useTranslatedMetricLabels());

    expect(result.current).toEqual({ title: '', description: '' });
  });

  it('should fall back to metric title and description when translation returns the key', () => {
    const { result } = renderHook(() =>
      useTranslatedMetricLabels({
        id: 'github.open_prs',
        title: 'Open PRs',
        description: 'Count',
      }),
    );

    expect(result.current).toEqual({
      title: 'Open PRs',
      description: 'Count',
    });
  });

  it('should use translated strings when they differ from the key', () => {
    mockUseTranslation.mockReturnValue({
      t: (key: string) => {
        if (key === 'metric.github.open_prs.title') {
          return 'PRs ouverts';
        }
        if (key === 'metric.github.open_prs.description') {
          return 'Nombre';
        }
        return key;
      },
    });

    const { result } = renderHook(() =>
      useTranslatedMetricLabels({
        id: 'github.open_prs',
        title: 'Open PRs',
        description: 'Count',
      }),
    );

    expect(result.current).toEqual({
      title: 'PRs ouverts',
      description: 'Nombre',
    });
  });

  it('should mix translated title with fallback description', () => {
    mockUseTranslation.mockReturnValue({
      t: (key: string) => (key === 'metric.m.id.title' ? 'Titre traduit' : key),
    });

    const { result } = renderHook(() =>
      useTranslatedMetricLabels({
        id: 'm.id',
        title: 'T',
        description: 'D',
      }),
    );

    expect(result.current).toEqual({
      title: 'Titre traduit',
      description: 'D',
    });
  });
});
