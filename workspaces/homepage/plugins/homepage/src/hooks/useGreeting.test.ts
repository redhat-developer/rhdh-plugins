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

// CRITICAL: Import mocks BEFORE components
import { mockUseTranslation } from '../test-utils/mockTranslations';

jest.mock('./useTranslation', () => ({
  useTranslation: mockUseTranslation,
}));

jest.mock('./useLanguage', () => ({
  useLanguage: () => 'en', // Mock English locale for tests
}));

// Component imports AFTER mocks
import { renderHook, waitFor } from '@testing-library/react';

import useGreeting from './useGreeting';

jest.useFakeTimers();
const RealDate = Date;

describe('useGreeting', () => {
  afterEach(() => {
    jest.clearAllTimers();
    global.Date = RealDate;
  });

  const mockDate = (isoDate: string) => {
    global.Date = class extends RealDate {
      constructor() {
        super();
        return new RealDate(isoDate);
      }
    } as any;
  };

  it('should return correct greeting initially and updates after interval', async () => {
    mockDate('2023-01-01T11:59:00Z'); // 11:59 AM
    const { result } = renderHook(() => useGreeting('UTC'));

    expect(result.current).toBe('Good morning');

    // Simulate time change to 12:00 PM
    mockDate('2023-01-01T12:00:00Z');

    // Advance fake timers by 1 minute
    jest.advanceTimersByTime(60000);

    await waitFor(() => {
      expect(result.current).toBe('Good afternoon');
    });
  });

  it('should clear interval on unmount', () => {
    const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
    const { unmount } = renderHook(() => useGreeting('UTC'));

    unmount();

    expect(clearIntervalSpy).toHaveBeenCalled();
  });
});
