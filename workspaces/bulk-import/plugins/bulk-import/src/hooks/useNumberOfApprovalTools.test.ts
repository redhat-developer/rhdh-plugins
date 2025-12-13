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

import { createElement, ReactNode } from 'react';

import { configApiRef } from '@backstage/core-plugin-api';
import { TestApiProvider } from '@backstage/test-utils';

import { renderHook } from '@testing-library/react';

import { useNumberOfApprovalTools } from './useNumberOfApprovalTools';

const mockConfigApi = {
  getOptionalConfigArray: jest.fn(),
};

function createWrapper() {
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(TestApiProvider, {
      apis: [[configApiRef, mockConfigApi]],
      children,
    });
  };
}

describe('useNumberOfApprovalTools', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 1 when only GitHub is configured', () => {
    mockConfigApi.getOptionalConfigArray.mockImplementation((key: string) => {
      if (key === 'integrations.github') return [{ host: 'github.com' }];
      if (key === 'integrations.gitlab') return [];
      return [];
    });

    const { result } = renderHook(() => useNumberOfApprovalTools(), {
      wrapper: createWrapper(),
    });

    expect(result.current.numberOfApprovalTools).toBe(1);
    expect(result.current.githubConfigured).toBe(true);
    expect(result.current.gitlabConfigured).toBe(false);
  });

  it('should return 1 when only GitLab is configured', () => {
    mockConfigApi.getOptionalConfigArray.mockImplementation((key: string) => {
      if (key === 'integrations.github') return [];
      if (key === 'integrations.gitlab') return [{ host: 'gitlab.com' }];
      return [];
    });

    const { result } = renderHook(() => useNumberOfApprovalTools(), {
      wrapper: createWrapper(),
    });

    expect(result.current.numberOfApprovalTools).toBe(1);
    expect(result.current.githubConfigured).toBe(false);
    expect(result.current.gitlabConfigured).toBe(true);
  });

  it('should return 2 when both GitHub and GitLab are configured', () => {
    mockConfigApi.getOptionalConfigArray.mockImplementation((key: string) => {
      if (key === 'integrations.github') return [{ host: 'github.com' }];
      if (key === 'integrations.gitlab') return [{ host: 'gitlab.com' }];
      return [];
    });

    const { result } = renderHook(() => useNumberOfApprovalTools(), {
      wrapper: createWrapper(),
    });

    expect(result.current.numberOfApprovalTools).toBe(2);
    expect(result.current.githubConfigured).toBe(true);
    expect(result.current.gitlabConfigured).toBe(true);
  });

  it('should return 0 when neither GitHub nor GitLab are configured', () => {
    mockConfigApi.getOptionalConfigArray.mockImplementation(() => []);

    const { result } = renderHook(() => useNumberOfApprovalTools(), {
      wrapper: createWrapper(),
    });

    expect(result.current.numberOfApprovalTools).toBe(0);
    expect(result.current.githubConfigured).toBe(false);
    expect(result.current.gitlabConfigured).toBe(false);
  });
});
