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
import { renderHook, act } from '@testing-library/react';
import useGreeting from '../useGreeting';
import { mockUseTranslation } from '../../test-utils/mockTranslations';

// Mock the useTranslation hook
jest.mock('../useTranslation', () => ({
  useTranslation: () => mockUseTranslation(),
}));

describe('useGreeting', () => {
  beforeAll(() => {
    jest.useFakeTimers();
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it('returns "Good morning" before 12 PM', () => {
    jest.setSystemTime(new Date(2023, 0, 1, 9, 0, 0)); // 9 AM
    const { result } = renderHook(() => useGreeting());
    expect(result.current).toBe('Good morning');
  });

  it('returns "Good afternoon" between 12 PM and 6 PM', () => {
    jest.setSystemTime(new Date(2023, 0, 1, 14, 0, 0)); // 2 PM
    const { result } = renderHook(() => useGreeting());
    expect(result.current).toBe('Good afternoon');
  });

  it('returns "Good evening" after 6 PM', () => {
    jest.setSystemTime(new Date(2023, 0, 1, 20, 0, 0)); // 8 PM
    const { result } = renderHook(() => useGreeting());
    expect(result.current).toBe('Good evening');
  });

  it('updates greeting after a minute', () => {
    jest.setSystemTime(new Date(2023, 0, 1, 11, 59, 0)); // 11:59 AM
    const { result } = renderHook(() => useGreeting());
    expect(result.current).toBe('Good morning');

    act(() => {
      jest.advanceTimersByTime(60000); // Advance by 1 minute
    });

    expect(result.current).toBe('Good afternoon');
  });
});
