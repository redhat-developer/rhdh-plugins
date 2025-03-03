/*
 * Copyright The Backstage Authors
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

import React, { act } from 'react';
import { MemoryRouter, useLocation } from 'react-router-dom';

import { renderHook, screen } from '@testing-library/react';

import { useQueryArrayFilter } from './useQueryArrayFilter';

const RenderLocation = () => {
  const location = useLocation();
  return `${location.pathname}${location.search}`;
};

const createWrapper =
  (initialPath: string) =>
  ({ children }: { children: React.ReactNode }) => {
    return (
      <MemoryRouter initialEntries={[initialPath]}>
        <RenderLocation />
        {children}
      </MemoryRouter>
    );
  };

describe('useQueryArrayFilter', () => {
  it('returns an empty array when no search param is defined', async () => {
    const hook = renderHook(() => useQueryArrayFilter('test'), {
      wrapper: createWrapper('/'),
    });

    expect(screen.getByText('/')).toBeInTheDocument();
    expect(hook.result.current).toEqual({
      current: [],
      set: expect.any(Function),
      clear: expect.any(Function),
    });
  });

  it('returns the right filter if one search param is defined', async () => {
    const hook = renderHook(() => useQueryArrayFilter('filter-name'), {
      wrapper: createWrapper('/?filter=filter-name=filter value'),
    });

    expect(
      screen.getByText('/?filter=filter-name=filter value'),
    ).toBeInTheDocument();
    expect(hook.result.current).toEqual({
      current: ['filter value'],
      set: expect.any(Function),
      clear: expect.any(Function),
    });
  });

  it('returns the right filter if two search param is defined', async () => {
    const hook = renderHook(() => useQueryArrayFilter('filter-name'), {
      wrapper: createWrapper(
        '/?filter=filter-name=filter value&filter=filter-name=another value',
      ),
    });

    expect(
      screen.getByText(
        '/?filter=filter-name=filter value&filter=filter-name=another value',
      ),
    ).toBeInTheDocument();
    expect(hook.result.current).toEqual({
      current: ['filter value', 'another value'],
      set: expect.any(Function),
      clear: expect.any(Function),
    });
  });

  it('returns the right filter if other search param is defined', async () => {
    const hook = renderHook(() => useQueryArrayFilter('filter-name'), {
      wrapper: createWrapper(
        '/?filter=filter-name=filter value&filter=filter-name=another value&filter=unknown-filter-name=again another filter&page=2',
      ),
    });

    expect(
      screen.getByText(
        '/?filter=filter-name=filter value&filter=filter-name=another value&filter=unknown-filter-name=again another filter&page=2',
      ),
    ).toBeInTheDocument();
    expect(hook.result.current).toEqual({
      current: ['filter value', 'another value'],
      set: expect.any(Function),
      clear: expect.any(Function),
    });
  });

  it('changes the search params for a new filter string', async () => {
    const hook = renderHook(() => useQueryArrayFilter('filter-name'), {
      wrapper: createWrapper('/'),
    });
    expect(screen.getByText('/')).toBeInTheDocument();

    await act(async () => hook.result.current.set('new value'));
    hook.rerender();

    expect(hook.result.current.current).toEqual(['new value']);
    expect(
      screen.getByText('/?filter=filter-name%3Dnew+value'),
    ).toBeInTheDocument();
  });

  it('changes the search params for a new filter array', async () => {
    const hook = renderHook(() => useQueryArrayFilter('filter-name'), {
      wrapper: createWrapper('/'),
    });
    expect(screen.getByText('/')).toBeInTheDocument();

    await act(async () =>
      hook.result.current.set(['new value', 'another value']),
    );
    hook.rerender();

    expect(hook.result.current.current).toEqual(['new value', 'another value']);
    expect(
      screen.getByText(
        '/?filter=filter-name%3Dnew+value&filter=filter-name%3Danother+value',
      ),
    ).toBeInTheDocument();
  });

  it('keeps unrelated search params and filters when setting a string', async () => {
    const hook = renderHook(() => useQueryArrayFilter('filter-name'), {
      wrapper: createWrapper(
        '/?filter=another-filter=Another filter&filter=filter-name=old value&filter=filter-name=old value 2&page=2',
      ),
    });
    expect(hook.result.current.current).toEqual(['old value', 'old value 2']);
    expect(
      screen.getByText(
        '/?filter=another-filter=Another filter&filter=filter-name=old value&filter=filter-name=old value 2&page=2',
      ),
    ).toBeInTheDocument();

    await act(async () => hook.result.current.set('new value'));
    hook.rerender();

    expect(hook.result.current.current).toEqual(['new value']);
    expect(
      screen.getByText(
        '/?filter=another-filter%3DAnother+filter&filter=filter-name%3Dnew+value&page=2',
      ),
    ).toBeInTheDocument();
  });

  it('keeps unrelated search params and filters when setting a array', async () => {
    const hook = renderHook(() => useQueryArrayFilter('filter-name'), {
      wrapper: createWrapper(
        '/?filter=another-filter=Another filter&filter=filter-name=old value&filter=filter-name=old value 2&page=2',
      ),
    });
    expect(hook.result.current.current).toEqual(['old value', 'old value 2']);
    expect(
      screen.getByText(
        '/?filter=another-filter=Another filter&filter=filter-name=old value&filter=filter-name=old value 2&page=2',
      ),
    ).toBeInTheDocument();

    await act(async () =>
      hook.result.current.set(['new value', 'another value']),
    );
    hook.rerender();

    expect(hook.result.current.current).toEqual(['new value', 'another value']);
    expect(
      screen.getByText(
        '/?filter=another-filter%3DAnother+filter&filter=filter-name%3Dnew+value&filter=filter-name%3Danother+value&page=2',
      ),
    ).toBeInTheDocument();
  });

  it('keeps unrelated search params and filters when removing a filter', async () => {
    const hook = renderHook(() => useQueryArrayFilter('filter-name'), {
      wrapper: createWrapper(
        '/?filter=another-filter=Another filter&filter=filter-name=old value&filter=filter-name=old value 2&page=2',
      ),
    });
    expect(hook.result.current.current).toEqual(['old value', 'old value 2']);
    expect(
      screen.getByText(
        '/?filter=another-filter=Another filter&filter=filter-name=old value&filter=filter-name=old value 2&page=2',
      ),
    ).toBeInTheDocument();

    await act(async () => hook.result.current.clear());
    hook.rerender();

    expect(hook.result.current.current).toEqual([]);
    expect(
      screen.getByText('/?filter=another-filter%3DAnother+filter&page=2'),
    ).toBeInTheDocument();
  });
});
