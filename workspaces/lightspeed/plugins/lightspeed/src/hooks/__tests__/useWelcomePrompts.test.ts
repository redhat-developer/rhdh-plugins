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
import { ConfigApi, useApi } from '@backstage/core-plugin-api';

import { renderHook, waitFor } from '@testing-library/react';

import { useWelcomePrompts } from '../useWelcomePrompts';

jest.mock('@backstage/core-plugin-api', () => ({
  useApi: jest.fn(),
}));

describe('useWelcomePrompts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useApi as jest.Mock).mockReturnValue({
      getOptionalConfigArray: jest.fn(),
      getOptionalBoolean: jest.fn().mockReturnValue(false),
    });
  });

  it('should return welcome prompts from user prompts', async () => {
    const getMockString = (prompt: { title: string; message: string }) =>
      ({
        getString: jest.fn().mockImplementation(key => {
          return prompt[key as keyof typeof prompt];
        }),
      }) as unknown as ConfigApi;

    const userPrompts = [
      { title: 'User Prompt 1', message: 'Message 1' },
      { title: 'User Prompt 2', message: 'Message 2' },
      { title: 'User Prompt 3', message: 'Message 3' },
    ];

    (useApi as jest.Mock).mockReturnValue({
      getOptionalBoolean: jest.fn().mockReturnValue(true),
      getOptionalConfigArray: jest
        .fn()
        .mockReturnValue(userPrompts.map(getMockString)),
    });
    const { result } = renderHook(() => useWelcomePrompts());
    await waitFor(() => {
      expect(result.current).toBeDefined();
      expect(result.current.length).toBe(3);
      const userPromptsTitles = userPrompts.map(p => p.title);
      const [prompt1, prompt2, prompt3] = result.current;

      expect(userPromptsTitles).toContain(prompt1.title);
      expect(userPromptsTitles).toContain(prompt2.title);
      expect(userPromptsTitles).toContain(prompt3.title);
    });
  });

  it('should return welcome prompts from default prompts', async () => {
    const { result } = renderHook(() => useWelcomePrompts());
    await waitFor(() => {
      expect(result.current).toBeDefined();
      expect(result.current.length).toBe(3);
    });
  });
});
