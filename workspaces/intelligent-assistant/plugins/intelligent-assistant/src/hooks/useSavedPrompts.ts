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
import { useCallback } from 'react';

import { useApi } from '@backstage/core-plugin-api';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  SavedPrompt,
  SavedPromptsConfig,
} from '@red-hat-developer-hub/backstage-plugin-intelligent-assistant-common';

import { lightspeedApiRef } from '../api/api';

const DEFAULT_LIMITS: SavedPromptsConfig = {
  max_prompts_per_user: 100,
  max_display_name_length: 128,
  max_content_length: 5000,
};

type UseSavedPromptsReturn = {
  savedPrompts: SavedPrompt[];
  config: SavedPromptsConfig;
  loading: boolean;
  error: string | null;
  createPrompt: (name: string, content: string) => Promise<void>;
  deletePrompt: (promptId: string) => Promise<void>;
  refresh: () => void;
};

/**
 * Hook to manage saved prompts CRUD operations and configuration.
 * Fetches config once per session (cached in state with DEFAULT_LIMITS fallback).
 */
export const useSavedPrompts = (): UseSavedPromptsReturn => {
  const api = useApi(lightspeedApiRef);
  const queryClient = useQueryClient();

  const configQuery = useQuery({
    queryKey: ['savedPromptsConfig'],
    queryFn: async () => {
      try {
        return await api.getSavedPromptsConfig();
      } catch {
        return DEFAULT_LIMITS;
      }
    },
    staleTime: Infinity,
  });

  const promptsQuery = useQuery({
    queryKey: ['savedPrompts'],
    queryFn: () => api.getSavedPrompts(),
    staleTime: 1000 * 60 * 5,
  });

  const createMutation = useMutation({
    mutationFn: ({ name, content }: { name: string; content: string }) =>
      api.createSavedPrompt({ name, content }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['savedPrompts'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (promptId: string) => api.deleteSavedPrompt(promptId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['savedPrompts'] });
    },
  });

  const createPrompt = useCallback(
    async (name: string, content: string) => {
      await createMutation.mutateAsync({ name, content });
    },
    [createMutation],
  );

  const deletePrompt = useCallback(
    async (promptId: string) => {
      await deleteMutation.mutateAsync(promptId);
    },
    [deleteMutation],
  );

  const refresh = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ['savedPrompts'] });
  }, [queryClient]);

  let error: string | null = null;
  if (promptsQuery.error instanceof Error) {
    error = promptsQuery.error.message;
  } else if (promptsQuery.error) {
    error = 'Failed to fetch saved prompts';
  }

  return {
    savedPrompts: promptsQuery.data ?? [],
    config: configQuery.data ?? DEFAULT_LIMITS,
    loading: configQuery.isLoading || promptsQuery.isLoading,
    error,
    createPrompt,
    deletePrompt,
    refresh,
  };
};
