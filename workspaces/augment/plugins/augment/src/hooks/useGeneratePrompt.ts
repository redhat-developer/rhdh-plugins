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
import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useApi } from '@backstage/core-plugin-api';
import { augmentApiRef } from '../api';
import type { PromptCapabilities } from '../types';
import { normalizeErrorMessage } from '../utils';

/**
 * Hook wrapping the generateSystemPrompt API call with loading/error state.
 * Accepts an optional capabilities object so the meta-prompt can reference
 * specific tool descriptions and user-selected features.
 */
export function useGeneratePrompt() {
  const api = useApi(augmentApiRef);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);
  const requestIdRef = useRef(0);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const generate = useCallback(
    async (
      description: string,
      model?: string,
      capabilities?: PromptCapabilities,
    ): Promise<string> => {
      const thisRequest = ++requestIdRef.current;
      setGenerating(true);
      setError(null);
      try {
        const prompt = await api.generateSystemPrompt(
          description,
          model,
          capabilities,
        );
        if (thisRequest !== requestIdRef.current) {
          return prompt;
        }
        return prompt;
      } catch (err) {
        if (thisRequest === requestIdRef.current && mountedRef.current) {
          setError(normalizeErrorMessage(err, 'Failed to generate prompt'));
        }
        throw err;
      } finally {
        if (thisRequest === requestIdRef.current && mountedRef.current) {
          setGenerating(false);
        }
      }
    },
    [api],
  );

  return useMemo(
    () => ({ generate, generating, error }),
    [generate, generating, error],
  );
}
