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

import { act, renderHook, waitFor } from '@testing-library/react';

import { useSavedPrompts } from '../useSavedPrompts';

jest.mock('@backstage/core-plugin-api', () => ({
  ...jest.requireActual('@backstage/core-plugin-api'),
  useApi: jest.fn(),
}));

const mockGetSavedPromptsConfig = jest.fn();
const mockGetSavedPrompts = jest.fn();
const mockCreateSavedPrompt = jest.fn();
const mockDeleteSavedPrompt = jest.fn();

describe('useSavedPrompts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useApi as jest.Mock).mockReturnValue({
      getSavedPromptsConfig: mockGetSavedPromptsConfig,
      getSavedPrompts: mockGetSavedPrompts,
      createSavedPrompt: mockCreateSavedPrompt,
      deleteSavedPrompt: mockDeleteSavedPrompt,
    });
  });

  it('should fetch prompts and config on mount', async () => {
    const mockConfig = {
      max_prompts_per_user: 50,
      max_display_name_length: 100,
      max_content_length: 3000,
    };
    const mockPrompts = [
      {
        id: '1',
        name: 'Test',
        content: 'Test content',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
    ];

    mockGetSavedPromptsConfig.mockResolvedValue(mockConfig);
    mockGetSavedPrompts.mockResolvedValue(mockPrompts);

    const { result } = renderHook(() => useSavedPrompts());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.savedPrompts).toEqual(mockPrompts);
    expect(result.current.config).toEqual(mockConfig);
    expect(result.current.error).toBeNull();
  });

  it('should use DEFAULT_LIMITS when config fetch fails', async () => {
    mockGetSavedPromptsConfig.mockRejectedValue(new Error('Network error'));
    mockGetSavedPrompts.mockResolvedValue([]);

    const { result } = renderHook(() => useSavedPrompts());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.config).toEqual({
      max_prompts_per_user: 100,
      max_display_name_length: 128,
      max_content_length: 5000,
    });
  });

  it('should set error when prompts fetch fails', async () => {
    mockGetSavedPromptsConfig.mockResolvedValue({
      max_prompts_per_user: 100,
      max_display_name_length: 128,
      max_content_length: 5000,
    });
    mockGetSavedPrompts.mockRejectedValue(new Error('Fetch failed'));

    const { result } = renderHook(() => useSavedPrompts());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Fetch failed');
    expect(result.current.savedPrompts).toEqual([]);
  });

  it('should create a prompt and refresh list', async () => {
    const newPrompt = {
      id: '2',
      name: 'New Prompt',
      content: 'New content',
      created_at: '2024-01-02T00:00:00Z',
      updated_at: '2024-01-02T00:00:00Z',
    };

    mockGetSavedPromptsConfig.mockResolvedValue({
      max_prompts_per_user: 100,
      max_display_name_length: 128,
      max_content_length: 5000,
    });
    mockGetSavedPrompts
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([newPrompt]);
    mockCreateSavedPrompt.mockResolvedValue(newPrompt);

    const { result } = renderHook(() => useSavedPrompts());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.createPrompt('New Prompt', 'New content');
    });

    expect(mockCreateSavedPrompt).toHaveBeenCalledWith({
      name: 'New Prompt',
      content: 'New content',
    });

    await waitFor(() => {
      expect(result.current.savedPrompts).toEqual([newPrompt]);
    });
  });

  it('should delete a prompt and refresh list', async () => {
    const prompt = {
      id: '1',
      name: 'Test',
      content: 'content',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    };

    mockGetSavedPromptsConfig.mockResolvedValue({
      max_prompts_per_user: 100,
      max_display_name_length: 128,
      max_content_length: 5000,
    });
    mockGetSavedPrompts
      .mockResolvedValueOnce([prompt])
      .mockResolvedValueOnce([]);
    mockDeleteSavedPrompt.mockResolvedValue({
      prompt_id: '1',
      deleted: true,
      response: 'Deleted',
    });

    const { result } = renderHook(() => useSavedPrompts());

    await waitFor(() => {
      expect(result.current.savedPrompts).toEqual([prompt]);
    });

    await act(async () => {
      await result.current.deletePrompt('1');
    });

    expect(mockDeleteSavedPrompt).toHaveBeenCalledWith('1');

    await waitFor(() => {
      expect(result.current.savedPrompts).toEqual([]);
    });
  });
});
