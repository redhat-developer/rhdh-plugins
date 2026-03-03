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

import { useRef, useMemo } from 'react';
import debounce from 'lodash/debounce';

/**
 * Return type for useDebouncedCallbackWithAbort hook
 */
export interface DebouncedCallbackWithAbort<T> {
  /** The debounced callback function */
  callback: ((value: T) => void) | null;
  /** Cleanup function to cancel pending calls and abort in-flight requests */
  cleanup: () => void;
}

/**
 * Creates a debounced callback that handles AbortController for canceling previous calls.
 * This utility prevents race conditions by canceling in-flight requests when new ones are made.
 *
 * @param callback - The async callback function to debounce (can return void or Promise<void>)
 * @param debounceMs - Debounce delay in milliseconds
 * @returns An object with the debounced callback and cleanup function
 */
export function useDebouncedCallbackWithAbort<T>(
  callback:
    | ((value: T) => void | Promise<void>)
    | ((value: T) => Promise<void>)
    | ((value: T) => void)
    | undefined,
  debounceMs: number,
): DebouncedCallbackWithAbort<T> {
  const abortControllerRef = useRef<AbortController | null>(null);

  const debouncedCallback = useMemo(
    () =>
      callback
        ? debounce(async (value: T) => {
            // Cancel previous API call if still pending
            if (abortControllerRef.current) {
              abortControllerRef.current.abort();
            }

            // Create new AbortController for this call
            const abortController = new AbortController();
            abortControllerRef.current = abortController;

            try {
              await Promise.resolve(callback(value));
            } catch (error) {
              if (error instanceof Error && error.name === 'AbortError') {
                // Request was canceled, ignore
                return;
              }
              // Re-throw other errors
              throw error;
            } finally {
              // Clear abort controller if this was the current one
              if (abortControllerRef.current === abortController) {
                abortControllerRef.current = null;
              }
            }
          }, debounceMs)
        : null,
    [callback, debounceMs],
  );

  const cleanup = useMemo(
    () => () => {
      if (debouncedCallback) {
        debouncedCallback.cancel();
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    },
    [debouncedCallback],
  );

  return { callback: debouncedCallback, cleanup };
}
