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

import { orchestratorTranslationRef } from '../translations';
import { useTranslation } from './useTranslation';

const mockUseTranslationRef = jest.fn();

jest.mock('@backstage/core-plugin-api/alpha', () => ({
  useTranslationRef: (...args: unknown[]) => mockUseTranslationRef(...args),
}));

jest.mock('../translations', () => ({
  orchestratorTranslationRef: { id: 'plugin.orchestrator.test' },
}));

describe('useTranslation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('delegates to useTranslationRef with orchestrator translation ref', () => {
    const translator = { t: jest.fn() };
    mockUseTranslationRef.mockReturnValue(translator);

    const { result } = renderHook(() => useTranslation());

    expect(mockUseTranslationRef).toHaveBeenCalledWith(
      orchestratorTranslationRef,
    );
    expect(result.current).toBe(translator);
  });
});
