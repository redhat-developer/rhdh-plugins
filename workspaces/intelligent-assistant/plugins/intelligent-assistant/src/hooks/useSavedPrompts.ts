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
import { useCallback, useEffect, useState } from 'react';

import { useApi } from '@backstage/core-plugin-api';

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

  const [config, setConfig] = useState<SavedPromptsConfig>(DEFAULT_LIMITS);
  const [configLoaded, setConfigLoaded] = useState(false);
  const [savedPrompts, setSavedPrompts] = useState<SavedPrompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!configLoaded) {
      api
        .getSavedPromptsConfig()
        .then(c => {
          setConfig(c);
          setConfigLoaded(true);
        })
        .catch(() => {
          setConfigLoaded(true);
        });
    }
  }, [api, configLoaded]);

  const fetchPrompts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const prompts = await api.getSavedPrompts();
      setSavedPrompts(prompts);
    } catch (e) {
      const message =
        e instanceof Error ? e.message : 'Failed to fetch saved prompts';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    fetchPrompts();
  }, [fetchPrompts]);

  const createPrompt = useCallback(
    async (name: string, content: string) => {
      await api.createSavedPrompt({ name, content });
      await fetchPrompts();
    },
    [api, fetchPrompts],
  );

  const deletePrompt = useCallback(
    async (promptId: string) => {
      await api.deleteSavedPrompt(promptId);
      await fetchPrompts();
    },
    [api, fetchPrompts],
  );

  const refresh = useCallback(() => {
    fetchPrompts();
  }, [fetchPrompts]);

  return {
    savedPrompts,
    config,
    loading,
    error,
    createPrompt,
    deletePrompt,
    refresh,
  };
};
