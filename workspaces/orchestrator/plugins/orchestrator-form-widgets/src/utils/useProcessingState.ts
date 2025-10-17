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

/**
 * Custom hook to manage processing state and notify parent context about loading status.
 * This hook tracks both fetch loading and post-fetch processing, ensuring that the
 * parent form knows when async operations are complete.
 *
 * @param fetchLoading - Whether data is currently being fetched
 * @param handleFetchStarted - Optional callback to notify when processing starts
 * @param handleFetchEnded - Optional callback to notify when processing ends
 * @returns Object containing processing state management
 */
export const useProcessingState = (
  fetchLoading: boolean,
  handleFetchStarted?: () => void,
  handleFetchEnded?: () => void,
) => {
  const [isProcessing, setIsProcessing] = useState(false);

  // Complete loading = fetch loading OR post-fetch processing
  const completeLoading = fetchLoading || isProcessing;

  // Notify parent context about the complete loading state
  useEffect(() => {
    if (completeLoading && handleFetchStarted) {
      handleFetchStarted();
      return () => {
        if (handleFetchEnded) {
          handleFetchEnded();
        }
      };
    }
    return undefined;
  }, [completeLoading, handleFetchStarted, handleFetchEnded]);

  // Helper to wrap async processing with setIsProcessing
  const wrapProcessing = useCallback(
    async <T>(fn: () => Promise<T>): Promise<T> => {
      setIsProcessing(true);
      try {
        return await fn();
      } finally {
        setIsProcessing(false);
      }
    },
    [],
  );

  return {
    isProcessing,
    setIsProcessing,
    completeLoading,
    wrapProcessing,
  };
};
