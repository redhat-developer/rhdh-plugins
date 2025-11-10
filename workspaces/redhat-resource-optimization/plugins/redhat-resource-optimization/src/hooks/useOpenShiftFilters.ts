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
 * OpenShift filter state
 */
export interface OpenShiftFilters {
  groupBy: string;
  overheadDistribution: string;
  timeRange: string;
  currency: string;
  filterBy: string;
  filterValue: string;
  currentPage: number;
  pageSize: number;
}

/**
 * Options for useOpenShiftFilters hook
 */
export interface UseOpenShiftFiltersOptions {
  /** Callback when filters change (for API calls) */
  onFiltersChange?: (filters: OpenShiftFilters) => void | Promise<void>;
  /** Debounce delay for API calls in milliseconds (default: 300) */
  debounceMs?: number;
  /** Default filter values */
  defaults?: Partial<OpenShiftFilters>;
}

/**
 * Return type for useOpenShiftFilters hook
 */
export interface UseOpenShiftFiltersReturn {
  /** Current filter values */
  filters: OpenShiftFilters;
  /** Set a filter value */
  setFilter: <K extends keyof OpenShiftFilters>(
    key: K,
    value: OpenShiftFilters[K],
  ) => void;
  /** Set multiple filters at once */
  setFilters: (updates: Partial<OpenShiftFilters>) => void;
  /** Reset all filters to defaults */
  resetFilters: () => void;
}

/**
 * Default filter values
 */
const DEFAULT_FILTERS: OpenShiftFilters = {
  groupBy: 'project',
  overheadDistribution: 'distribute',
  timeRange: 'month-to-date',
  currency: 'USD',
  filterBy: 'project',
  filterValue: '',
  currentPage: 0,
  pageSize: 5,
};

/**
 * Parse URL parameters to extract OpenShift filters
 */
function parseFiltersFromUrl(search: string): Partial<OpenShiftFilters> {
  const params = new URLSearchParams(search);
  const filters: Partial<OpenShiftFilters> = {};

  // Extract groupBy from group_by[project], group_by[cluster], etc.
  for (const key of ['project', 'cluster', 'node', 'tag']) {
    if (params.get(`group_by[${key}]`)) {
      filters.groupBy = key;
      break;
    }
  }

  // Extract filterBy and filterValue
  for (const key of ['project', 'cluster', 'node']) {
    const filterVal = params.get(`filter[${key}]`);
    if (filterVal) {
      filters.filterBy = key;
      filters.filterValue = filterVal;
      break;
    }
  }

  // Determine overheadDistribution from order_by
  const hasDistributedCost = params.has('order_by[distributed_cost]');
  filters.overheadDistribution = hasDistributedCost
    ? 'distribute'
    : 'dont_distribute';

  // Determine timeRange
  const timeScopeValue = params.get('filter[time_scope_value]');
  filters.timeRange =
    timeScopeValue === '-2' ? 'previous-month' : 'month-to-date';

  // Extract currency
  const currency = params.get('currency');
  if (currency) {
    filters.currency = currency;
  }

  // Extract pagination
  const limit = params.get('filter[limit]');
  const offset = params.get('filter[offset]');
  if (limit) {
    filters.pageSize = Number(limit) || DEFAULT_FILTERS.pageSize;
  }
  if (limit && offset) {
    filters.currentPage = Math.floor(Number(offset) / Number(limit)) || 0;
  }

  return filters;
}

/**
 * Build URL search string from filters
 */
function buildUrlFromFilters(filters: OpenShiftFilters): string {
  const params = new URLSearchParams();

  // Calculate delta and order_by based on overheadDistribution
  let deltaParam = 'cost';
  if (
    filters.groupBy === 'project' &&
    filters.overheadDistribution === 'distribute'
  ) {
    deltaParam = 'distributed_cost';
  }

  // Calculate time scope
  const timeScopeValue = filters.timeRange === 'month-to-date' ? -1 : -2;
  const offset = filters.currentPage * filters.pageSize;

  // Add all query parameters
  params.set('currency', filters.currency);
  params.set('delta', deltaParam);
  params.set('filter[limit]', String(filters.pageSize));
  params.set('filter[offset]', String(offset));
  params.set('filter[resolution]', 'monthly');
  params.set('filter[time_scope_units]', 'month');
  params.set('filter[time_scope_value]', String(timeScopeValue));
  params.set(`group_by[${filters.groupBy}]`, '*');
  params.set(`order_by[${deltaParam}]`, 'desc');

  // Add filter parameter if filterValue is set
  if (filters.filterValue && filters.filterBy) {
    params.set(`filter[${filters.filterBy}]`, filters.filterValue);
  }

  return params.toString();
}

/**
 * Custom hook for managing OpenShift filters synchronized with URL parameters
 *
 * Features:
 * - Bidirectional sync between URL and state
 * - Debounced API calls
 * - Prevents infinite loops
 * - Handles browser back/forward navigation
 * - Handles complex URL structure (filter[project], group_by[project], etc.)
 *
 * @param options - Configuration options
 * @returns Filter state and control functions
 */
export function useOpenShiftFilters(
  options: UseOpenShiftFiltersOptions = {},
): UseOpenShiftFiltersReturn {
  const { onFiltersChange, debounceMs = 300, defaults = {} } = options;

  const location = useLocation();
  const navigate = useNavigate();

  // Track if we're updating URL from state to prevent sync loop
  const isUpdatingUrlFromStateRef = useRef(false);
  // Track if this is the initial mount
  const isInitialMountRef = useRef(true);

  // Merge defaults
  const defaultFilters: OpenShiftFilters = useMemo(
    () => ({
      ...DEFAULT_FILTERS,
      ...defaults,
    }),
    [defaults],
  );

  // Initialize filter state from URL or defaults
  const initialFilters = useMemo(() => {
    const urlFilters = parseFiltersFromUrl(location.search);
    return {
      ...defaultFilters,
      ...urlFilters,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount - URL changes are handled by separate effect

  const [filters, setFiltersState] = useState<OpenShiftFilters>(initialFilters);

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

    const urlFilters = parseFiltersFromUrl(location.search);
    const updates: Partial<OpenShiftFilters> = {};
    let hasUpdates = false;

    // Check each filter and update if changed
    for (const [key, urlValue] of Object.entries(urlFilters)) {
      const filterKey = key as keyof OpenShiftFilters;
      const currentValue = filters[filterKey];
      if (urlValue !== undefined && urlValue !== currentValue) {
        (updates as any)[filterKey] = urlValue;
        hasUpdates = true;
      }
    }

    // Special handling for filterValue: don't clear if state has value but URL doesn't (timing issue)
    if (urlFilters.filterValue === undefined && filters.filterValue) {
      // URL doesn't have filterValue but state does - likely timing issue, skip update
      delete updates.filterValue;
      hasUpdates = Object.keys(updates).length > 0;
    }

    // Update state if there are changes
    if (hasUpdates) {
      setFiltersState(prev => ({ ...prev, ...updates }));
    }
  }, [location.search, filters]); // Only depend on URL and filters

  // Update URL when filters change
  useEffect(() => {
    // Skip on initial mount
    if (isInitialMountRef.current) {
      return;
    }

    // Mark that we're updating URL from state
    isUpdatingUrlFromStateRef.current = true;

    const newSearch = buildUrlFromFilters(filters);
    const newUrl = newSearch ? `?${newSearch}` : location.pathname;

    // Only update if URL actually changed
    if (location.search !== `?${newSearch}`) {
      navigate(newUrl, { replace: true });
    }

    // Reset flag after navigation completes
    requestAnimationFrame(() => {
      setTimeout(() => {
        isUpdatingUrlFromStateRef.current = false;
      }, 100);
    });
  }, [filters, navigate, location.pathname, location.search]);

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
    <K extends keyof OpenShiftFilters>(key: K, value: OpenShiftFilters[K]) => {
      setFiltersState(prev => ({
        ...prev,
        [key]: value,
      }));
    },
    [],
  );

  // Set multiple filter values at once
  const setFilters = useCallback((updates: Partial<OpenShiftFilters>) => {
    setFiltersState(prev => ({
      ...prev,
      ...updates,
    }));
  }, []);

  // Reset all filters to defaults
  const resetFilters = useCallback(() => {
    setFiltersState(defaultFilters);
  }, [defaultFilters]);

  return {
    filters,
    setFilter,
    setFilters,
    resetFilters,
  };
}
