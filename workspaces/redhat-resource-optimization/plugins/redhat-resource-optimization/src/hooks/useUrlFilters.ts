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

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useDebouncedCallbackWithAbort } from './useDebouncedCallbackWithAbort';

/**
 * Filter configuration for URL parameter management
 */
export interface FilterConfig {
  /** Default value if not in URL */
  defaultValue: string | number | boolean;
  /** Function to parse string from URL to the correct type */
  parse?: (value: string) => string | number | boolean;
  /** Function to serialize value to URL string */
  serialize?: (value: string | number | boolean) => string;
}

/**
 * Filter definitions - maps filter keys to their configuration
 */
export type FilterDefinitions = Record<string, FilterConfig>;

/**
 * Filter values - the actual filter state
 */
export type FilterValues = Record<string, string | number | boolean>;

/**
 * Options for useUrlFilters hook
 */
export interface UseUrlFiltersOptions {
  /** Filter definitions */
  filters: FilterDefinitions;
  /** Debounce delay for API calls in milliseconds (default: 300) */
  debounceMs?: number;
  /** Callback when filters change (for API calls) */
  onFiltersChange?: (filters: FilterValues) => void | Promise<void>;
  /** Whether to use replace instead of push for URL updates (default: true) */
  replace?: boolean;
}

/**
 * Return type for useUrlFilters hook
 */
export interface UseUrlFiltersReturn {
  /** Current filter values */
  filters: FilterValues;
  /** Set a single filter value */
  setFilter: (key: string, value: string | number | boolean | null) => void;
  /** Set multiple filter values at once */
  setFilters: (updates: Partial<FilterValues>) => void;
  /** Reset all filters to defaults */
  resetFilters: () => void;
  /** Check if filters have changed from defaults */
  hasFilters: boolean;
}

/**
 * Custom hook for managing filters synchronized with URL parameters
 *
 * Features:
 * - Bidirectional sync between URL and state
 * - Debounced API calls
 * - Prevents infinite loops
 * - Handles browser back/forward navigation
 * - Type-safe filter management
 *
 * @param options - Configuration options
 * @returns Filter state and control functions
 *
 * @example
 * ```tsx
 * const { filters, setFilter } = useUrlFilters({
 *   filters: {
 *     groupBy: { defaultValue: 'project' },
 *     currency: { defaultValue: 'USD' },
 *     page: { defaultValue: 0, parse: Number },
 *   },
 *   onFiltersChange: async (filters) => {
 *     await fetchData(filters);
 *   },
 * });
 * ```
 */
export function useUrlFilters(
  options: UseUrlFiltersOptions,
): UseUrlFiltersReturn {
  const {
    filters: filterDefinitions,
    debounceMs = 300,
    onFiltersChange,
    replace = true,
  } = options;

  const location = useLocation();
  const navigate = useNavigate();

  // Track if we're updating URL from state to prevent sync loop
  const isUpdatingUrlFromStateRef = useRef(false);
  // Track if this is the initial mount
  const isInitialMountRef = useRef(true);

  // Initialize filter state from URL or defaults
  const initialFilters = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const initial: FilterValues = {};

    for (const [key, config] of Object.entries(filterDefinitions)) {
      const urlValue = params.get(key);
      if (urlValue !== null) {
        // Parse value from URL
        initial[key] = config.parse ? config.parse(urlValue) : urlValue;
      } else {
        // Use default value
        initial[key] = config.defaultValue;
      }
    }

    return initial;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount - URL changes are handled by separate effect

  const [filters, setFiltersState] = useState<FilterValues>(initialFilters);

  // Create debounced callback for API calls
  const {
    callback: debouncedOnFiltersChange,
    cleanup: cleanupDebouncedCallback,
  } = useDebouncedCallbackWithAbort(onFiltersChange, debounceMs);

  // Sync state with URL when URL changes (e.g., browser back/forward)
  useEffect(() => {
    // Skip on initial mount (we already initialized from URL)
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      return;
    }

    // Skip if we're updating URL from state
    if (isUpdatingUrlFromStateRef.current) {
      return;
    }

    const params = new URLSearchParams(location.search);
    const updates: Partial<FilterValues> = {};
    let hasUpdates = false;

    // Read all filters from URL
    for (const [key, config] of Object.entries(filterDefinitions)) {
      const urlValue = params.get(key);
      const currentValue = filters[key];

      let newValue: string | number | boolean;
      if (urlValue !== null) {
        newValue = config.parse ? config.parse(urlValue) : urlValue;
      } else {
        newValue = config.defaultValue;
      }

      // Only update if value changed
      if (newValue !== currentValue) {
        updates[key] = newValue;
        hasUpdates = true;
      }
    }

    // Update state if there are changes
    if (hasUpdates) {
      setFiltersState(prev => ({ ...prev, ...updates } as FilterValues));
    }
  }, [location.search, filterDefinitions, filters]); // Only depend on URL and definitions

  // Update URL when filters change
  useEffect(() => {
    // Skip on initial mount
    if (isInitialMountRef.current) {
      return;
    }

    // Mark that we're updating URL from state
    isUpdatingUrlFromStateRef.current = true;

    const params = new URLSearchParams(location.search);

    // Update URL params based on current filter state
    for (const [key, value] of Object.entries(filters)) {
      const config = filterDefinitions[key];
      if (!config) continue;

      const defaultValue = config.defaultValue;
      const serializedValue = config.serialize
        ? config.serialize(value)
        : String(value);

      // Only include in URL if different from default
      if (value !== defaultValue) {
        params.set(key, serializedValue);
      } else {
        // Remove from URL if it's the default value
        params.delete(key);
      }
    }

    // Build new URL
    const newSearch = params.toString();
    const newUrl = newSearch ? `?${newSearch}` : location.pathname;

    // Only update if URL actually changed
    if (location.search !== newSearch) {
      navigate(newUrl, { replace });
    }

    // Reset flag after navigation completes
    requestAnimationFrame(() => {
      setTimeout(() => {
        isUpdatingUrlFromStateRef.current = false;
      }, 100);
    });
  }, [
    filters,
    filterDefinitions,
    navigate,
    location.pathname,
    location.search,
    replace,
  ]);

  // Trigger API call when filters change (debounced)
  useEffect(() => {
    if (debouncedOnFiltersChange) {
      debouncedOnFiltersChange(filters);
    }

    // Cleanup: cancel debounced call and abort controller on unmount
    return cleanupDebouncedCallback;
  }, [filters, debouncedOnFiltersChange, cleanupDebouncedCallback]);

  // Set a single filter value
  const setFilter = useCallback(
    (key: string, value: string | number | boolean | null) => {
      const config = filterDefinitions[key];
      if (!config) {
        return;
      }

      // Use default value if null/undefined
      const newValue = value ?? config.defaultValue;

      setFiltersState(prev => ({
        ...prev,
        [key]: newValue,
      }));
    },
    [filterDefinitions],
  );

  // Set multiple filter values at once
  const setFilters = useCallback(
    (updates: Partial<FilterValues>) => {
      setFiltersState(prev => {
        const next = { ...prev };
        for (const [key, value] of Object.entries(updates)) {
          const config = filterDefinitions[key];
          if (!config) {
            continue;
          }
          next[key] = value ?? config.defaultValue;
        }
        return next;
      });
    },
    [filterDefinitions],
  );

  // Reset all filters to defaults
  const resetFilters = useCallback(() => {
    const defaults: FilterValues = {};
    for (const [key, config] of Object.entries(filterDefinitions)) {
      defaults[key] = config.defaultValue;
    }
    setFiltersState(defaults);
  }, [filterDefinitions]);

  // Check if any filters differ from defaults
  const hasFilters = useMemo(() => {
    return Object.entries(filters).some(
      ([key, value]) => value !== filterDefinitions[key]?.defaultValue,
    );
  }, [filters, filterDefinitions]);

  return {
    filters,
    setFilter,
    setFilters,
    resetFilters,
    hasFilters,
  };
}
