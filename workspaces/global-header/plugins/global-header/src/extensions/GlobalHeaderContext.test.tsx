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
import type { PropsWithChildren } from 'react';

import type {
  GlobalHeaderComponentData,
  GlobalHeaderMenuItemData,
} from '../types';
import {
  GlobalHeaderProvider,
  useGlobalHeaderComponents,
  useGlobalHeaderMenuItems,
} from './GlobalHeaderContext';

const CompA = () => <div>A</div>;
const CompB = () => <div>B</div>;

const testComponents: GlobalHeaderComponentData[] = [
  { component: CompA, priority: 100 },
  { component: CompB, priority: 50 },
];

const testMenuItems: GlobalHeaderMenuItemData[] = [
  { target: 'profile', title: 'Settings', type: 'data' },
  { target: 'help', title: 'Docs', type: 'data' },
  { target: 'profile', title: 'Logout', type: 'component' },
];

function createWrapper(
  components: GlobalHeaderComponentData[],
  menuItems: GlobalHeaderMenuItemData[],
) {
  return ({ children }: PropsWithChildren) => (
    <GlobalHeaderProvider components={components} menuItems={menuItems}>
      {children}
    </GlobalHeaderProvider>
  );
}

describe('useGlobalHeaderComponents', () => {
  it('returns all components from the provider', () => {
    const { result } = renderHook(() => useGlobalHeaderComponents(), {
      wrapper: createWrapper(testComponents, []),
    });

    expect(result.current).toHaveLength(2);
    expect(result.current[0].component).toBe(CompA);
    expect(result.current[1].component).toBe(CompB);
  });

  it('returns empty array when no provider is present', () => {
    const { result } = renderHook(() => useGlobalHeaderComponents());
    expect(result.current).toEqual([]);
  });
});

describe('useGlobalHeaderMenuItems', () => {
  it('filters items by target', () => {
    const { result } = renderHook(() => useGlobalHeaderMenuItems('profile'), {
      wrapper: createWrapper([], testMenuItems),
    });

    expect(result.current).toHaveLength(2);
    expect(result.current.every(i => i.target === 'profile')).toBe(true);
  });

  it('returns empty array for unmatched target', () => {
    const { result } = renderHook(
      () => useGlobalHeaderMenuItems('nonexistent'),
      { wrapper: createWrapper([], testMenuItems) },
    );

    expect(result.current).toEqual([]);
  });

  it('returns empty array when no provider is present', () => {
    const { result } = renderHook(() => useGlobalHeaderMenuItems('profile'));
    expect(result.current).toEqual([]);
  });
});
