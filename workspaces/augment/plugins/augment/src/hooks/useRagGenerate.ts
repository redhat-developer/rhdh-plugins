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
import { useState, useCallback, useRef, useEffect } from 'react';
import { useApi } from '@backstage/core-plugin-api';
import { augmentApiRef } from '../api';
import type { RagGenerateResult } from '../types';
import { normalizeErrorMessage } from '../utils';

/**
 * Hook for end-to-end RAG generation: retrieval + LLM answer.
 */
export function useRagGenerate() {
  const api = useApi(augmentApiRef);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RagGenerateResult | null>(null);
  const [generateTimeMs, setGenerateTimeMs] = useState<number | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const generate = useCallback(
    async (
      query: string,
      maxResults?: number,
      vectorStoreId?: string,
      vectorStoreIds?: string[],
    ): Promise<RagGenerateResult> => {
      if (!query.trim()) {
        const msg = 'Query cannot be empty';
        setError(msg);
        throw new Error(msg);
      }
      if (query.length > 2000) {
        const msg = 'Query must be at most 2000 characters';
        setError(msg);
        throw new Error(msg);
      }

      try {
        setLoading(true);
        setError(null);
        setGenerateTimeMs(null);
        const t0 = Date.now();
        const genResult = await api.generateRagAnswer(
          query.trim(),
          maxResults,
          vectorStoreId,
          vectorStoreIds,
        );
        const elapsed = Date.now() - t0;
        if (mountedRef.current) {
          setResult(genResult);
          setGenerateTimeMs(elapsed);
        }
        return genResult;
      } catch (err) {
        const msg = normalizeErrorMessage(err, 'RAG generation failed');
        if (mountedRef.current) {
          setError(msg);
          setGenerateTimeMs(null);
        }
        throw err;
      } finally {
        if (mountedRef.current) {
          setLoading(false);
        }
      }
    },
    [api],
  );

  const clearResult = useCallback(() => {
    setResult(null);
    setGenerateTimeMs(null);
  }, []);
  const clearError = useCallback(() => setError(null), []);

  return {
    generate,
    loading,
    error,
    result,
    generateTimeMs,
    clearResult,
    clearError,
  };
}
