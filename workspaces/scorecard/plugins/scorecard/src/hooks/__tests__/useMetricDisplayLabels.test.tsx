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

import { useMetricDisplayLabels } from '../useMetricDisplayLabels';

jest.mock('../useTranslation', () => ({
  useTranslation: jest.fn(),
}));

import { useTranslation } from '../useTranslation';

describe('useMetricDisplayLabels', () => {
  const mockT = jest.fn();

  const metric = {
    id: 'github.open_prs',
    title: 'GitHub open PRs',
    description:
      'Current count of open Pull Requests for a given GitHub repository.',
  };

  beforeEach(() => {
    (useTranslation as jest.Mock).mockImplementation(() => ({
      t: mockT,
    }));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return empty strings when metric is undefined', () => {
    const { result } = renderHook(() => useMetricDisplayLabels());

    expect(result.current).toEqual({
      title: '',
      description: '',
    });
  });

  it('should return translated title and description when translation exists', () => {
    mockT.mockImplementation((key: string) => {
      if (key === 'metric.github.open_prs.title') return 'Translated Title';
      if (key === 'metric.github.open_prs.description')
        return 'Translated Description';
      return key;
    });

    const { result } = renderHook(() => useMetricDisplayLabels(metric));

    expect(result.current).toEqual({
      title: 'Translated Title',
      description: 'Translated Description',
    });
  });

  it('should fall back to original values when translation does not exist', () => {
    mockT.mockImplementation((key: string) => key);

    const { result } = renderHook(() => useMetricDisplayLabels(metric));

    expect(result.current).toEqual({
      title: 'GitHub open PRs',
      description:
        'Current count of open Pull Requests for a given GitHub repository.',
    });
  });

  it('should use translated title but original description when only title translation exists', () => {
    mockT.mockImplementation((key: string) => {
      if (key === 'metric.github.open_prs.title') return 'Translated Title';
      return key;
    });

    const { result } = renderHook(() => useMetricDisplayLabels(metric));

    expect(result.current).toEqual({
      title: 'Translated Title',
      description:
        'Current count of open Pull Requests for a given GitHub repository.',
    });
  });

  describe('parent key cascading lookup', () => {
    const fileCheckMetric = {
      id: 'github.files_check.readme',
      title: 'GitHub File: README.md',
      description: 'Checks if README.md exists in the repository.',
    };

    it('should resolve via parent key when exact key has no translation', () => {
      mockT.mockImplementation((key: string, params?: { name?: string }) => {
        if (key === 'metric.github.files_check.title')
          return `File Check: ${params?.name}`;
        if (key === 'metric.github.files_check.description')
          return `Checks if ${params?.name} exists`;
        return key;
      });

      const { result } = renderHook(() =>
        useMetricDisplayLabels(fileCheckMetric),
      );

      expect(result.current).toEqual({
        title: 'File Check: readme',
        description: 'Checks if readme exists',
      });
    });

    it('should prefer exact key over parent key', () => {
      mockT.mockImplementation((key: string, params?: { name?: string }) => {
        if (key === 'metric.github.files_check.readme.title')
          return 'Exact README Title';
        if (key === 'metric.github.files_check.title')
          return `File Check: ${params?.name}`;
        return key;
      });

      const { result } = renderHook(() =>
        useMetricDisplayLabels(fileCheckMetric),
      );

      expect(result.current).toEqual({
        title: 'Exact README Title',
        description: 'Checks if README.md exists in the repository.',
      });
    });

    it('should fall back to original values when neither exact nor parent key has translation', () => {
      mockT.mockImplementation((key: string) => key);

      const { result } = renderHook(() =>
        useMetricDisplayLabels(fileCheckMetric),
      );

      expect(result.current).toEqual({
        title: 'GitHub File: README.md',
        description: 'Checks if README.md exists in the repository.',
      });
    });
  });
});
