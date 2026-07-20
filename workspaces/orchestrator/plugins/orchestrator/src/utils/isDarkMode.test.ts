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

import { useIsDarkMode } from './isDarkMode';

const mockUseTheme = jest.fn();

jest.mock('@mui/material/styles', () => ({
  useTheme: (...args: unknown[]) => mockUseTheme(...args),
}));

describe('useIsDarkMode', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns true when theme mode is dark', () => {
    mockUseTheme.mockReturnValue({ palette: { mode: 'dark' } });

    const { result } = renderHook(() => useIsDarkMode());

    expect(result.current).toBe(true);
  });

  it('returns false when theme mode is light', () => {
    mockUseTheme.mockReturnValue({ palette: { mode: 'light' } });

    const { result } = renderHook(() => useIsDarkMode());

    expect(result.current).toBe(false);
  });
});
