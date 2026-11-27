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

import { useApi } from '@backstage/core-plugin-api';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';

import { Skill } from '../../types';
import { useIaSkillsPermission } from '../useIaSkillsPermission';
import { useSkills } from '../useSkills';

jest.mock('@backstage/core-plugin-api', () => ({
  ...jest.requireActual('@backstage/core-plugin-api'),
  useApi: jest.fn(),
}));
jest.mock('../useIaSkillsPermission');

const mockGetSkills = jest.fn();
const mockUsePermission = jest.mocked(useIaSkillsPermission);
const skills: Skill[] = [
  {
    name: 'summarize',
    description: 'Summarize documents or conversations',
  },
];

let queryClient: QueryClient;
const wrapper = ({ children }: { children?: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe('useSkills', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    queryClient = new QueryClient();
    jest.mocked(useApi).mockReturnValue({ getSkills: mockGetSkills });
    mockUsePermission.mockReturnValue({ loading: false, allowed: true });
    mockGetSkills.mockResolvedValue(skills);
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('fetches the catalog only once slash suggestions are enabled', async () => {
    const { result, rerender } = renderHook(
      ({ enabled }) => useSkills(enabled),
      { wrapper, initialProps: { enabled: false } },
    );

    expect(mockGetSkills).not.toHaveBeenCalled();
    expect(result.current.loading).toBe(false);

    rerender({ enabled: true });

    await waitFor(() => expect(result.current.skills).toEqual(skills));
    expect(mockGetSkills).toHaveBeenCalledTimes(1);
    expect(result.current).toMatchObject({
      loading: false,
      error: null,
      denied: false,
    });
  });

  it('waits for the permission check before requesting the catalog', async () => {
    mockUsePermission.mockReturnValue({ loading: true, allowed: false });
    const { result, rerender } = renderHook(() => useSkills(true), {
      wrapper,
    });

    expect(result.current.loading).toBe(true);
    expect(result.current.denied).toBe(false);
    expect(mockGetSkills).not.toHaveBeenCalled();

    mockUsePermission.mockReturnValue({ loading: false, allowed: true });
    rerender();

    await waitFor(() => expect(result.current.skills).toEqual(skills));
    expect(mockGetSkills).toHaveBeenCalledTimes(1);
  });

  it('reports a pending catalog request as loading', async () => {
    let resolveSkills: (value: Skill[]) => void = () => {};
    mockGetSkills.mockReturnValue(
      new Promise<Skill[]>(resolve => {
        resolveSkills = resolve;
      }),
    );
    const { result } = renderHook(() => useSkills(true), { wrapper });

    expect(result.current.loading).toBe(true);
    expect(result.current.skills).toEqual([]);

    act(() => resolveSkills(skills));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.skills).toEqual(skills);
  });

  it('reports denied permission without requesting or exposing cached skills', () => {
    queryClient.setQueryData(['skills'], skills);
    mockUsePermission.mockReturnValue({ loading: false, allowed: false });
    const { result } = renderHook(() => useSkills(true), { wrapper });

    expect(result.current).toEqual({
      skills: [],
      loading: false,
      error: null,
      denied: true,
    });
    expect(mockGetSkills).not.toHaveBeenCalled();
  });

  it('hides a cached catalog while permission is unresolved', () => {
    queryClient.setQueryData(['skills'], skills);
    mockUsePermission.mockReturnValue({ loading: true, allowed: false });
    const { result } = renderHook(() => useSkills(true), { wrapper });

    expect(result.current.skills).toEqual([]);
    expect(result.current.loading).toBe(true);
    expect(result.current.denied).toBe(false);
    expect(mockGetSkills).not.toHaveBeenCalled();
  });

  it('reuses the catalog when suggestions are reopened', async () => {
    const { result, rerender } = renderHook(
      ({ enabled }) => useSkills(enabled),
      { wrapper, initialProps: { enabled: true } },
    );

    await waitFor(() => expect(result.current.skills).toEqual(skills));
    rerender({ enabled: false });
    rerender({ enabled: true });

    expect(result.current.skills).toEqual(skills);
    expect(mockGetSkills).toHaveBeenCalledTimes(1);
  });

  it('distinguishes an HTTP 403 from other catalog failures', async () => {
    const error = Object.assign(new Error('Forbidden'), { status: 403 });
    mockGetSkills.mockRejectedValue(error);
    const { result } = renderHook(() => useSkills(true), { wrapper });

    await waitFor(() => expect(result.current.denied).toBe(true));
    expect(result.current.error).toBe(error);
    expect(result.current.skills).toEqual([]);
    expect(result.current.loading).toBe(false);
  });

  it('reports catalog failures immediately without retries', async () => {
    const error = new Error('Network unavailable');
    mockGetSkills.mockRejectedValue(error);
    const { result } = renderHook(() => useSkills(true), { wrapper });

    await waitFor(() => expect(result.current.error).toBe(error));
    expect(result.current.skills).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.denied).toBe(false);
    expect(mockGetSkills).toHaveBeenCalledTimes(1);
  });

  it('hides cached skills if refreshing the catalog fails', async () => {
    const { result } = renderHook(() => useSkills(true), { wrapper });
    await waitFor(() => expect(result.current.skills).toEqual(skills));

    const error = new Error('Catalog unavailable');
    mockGetSkills.mockRejectedValue(error);
    await act(async () => {
      await queryClient.invalidateQueries({ queryKey: ['skills'] });
    });

    await waitFor(() => expect(result.current.error).toBe(error));
    expect(result.current.skills).toEqual([]);
  });
});
