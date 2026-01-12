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
import {
  addDays,
  addHours,
  getYear,
  isToday,
  isYesterday,
  startOfWeek,
  subDays,
} from 'date-fns';

import { utcToZonedTime, formatInTimeZone } from 'date-fns-tz';
import { TranslationFunction } from '@backstage/core-plugin-api/alpha';

import { APIsViewOptions } from '../types';
import { adoptionInsightsTranslationRef } from '../translations';

/**
 * Parse date string and normalize timezone format.
 * Converts +00 timezone format to Z for better browser compatibility.
 */
export const safeDate = (dateString: string): Date => {
  const normalizedDate = dateString.replace(/\+00$/, 'Z');
  return new Date(normalizedDate);
};

// =============================================================================
// LOCALIZATION UTILITIES
// =============================================================================

/**
 * Core date formatting utility with locale support and automatic timezone detection.
 * Handles user's language preferences while automatically detecting their timezone.
 *
 * @param date - The date to format
 * @param options - Intl.DateTimeFormat options for customizing output
 * @param locale - User's language preference (e.g., 'en', 'de', 'fr'), defaults to 'en'
 * @returns Formatted date string respecting user's locale and timezone
 *
 * @example
 * formatDate(new Date(), { year: 'numeric', month: 'short' }, 'de')
 * // German user in Tokyo: "Jan. 2024" (in Tokyo timezone)
 */
export const formatDate = (
  date: Date,
  options: Intl.DateTimeFormatOptions = {},
  locale?: string,
) => {
  const currentLocale = locale || 'en';
  const currentTimeZone = new Intl.DateTimeFormat().resolvedOptions().timeZone;
  return new Intl.DateTimeFormat(currentLocale, {
    timeZone: currentTimeZone,
    ...options,
  }).format(date);
};

/**
 * Format date in short format: "15 Jan 24"
 * @param date - Date to format
 * @param locale - User's language preference
 */
export const formatShortDate = (date: Date, locale?: string) =>
  formatDate(date, { year: 'numeric', month: 'short', day: 'numeric' }, locale);

/**
 * Format date in long format: "January 15, 2024"
 * @param date - Date to format
 * @param locale - User's language preference
 */
export const formatLongDate = (date: Date, locale?: string) =>
  formatDate(
    date,
    {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    },
    locale,
  );

/**
 * Format time respecting user's locale (12h vs 24h format): "14:30" or "2:30 PM"
 * @param date - Date to format
 * @param locale - User's language preference
 */
export const formatTime = (date: Date, locale?: string) =>
  formatDate(date, { hour: '2-digit', minute: '2-digit' }, locale);

/**
 * Format month and year: "Jan 2024"
 * @param date - Date to format
 * @param locale - User's language preference
 */
export const formatMonthYear = (date: Date, locale?: string) =>
  formatDate(date, { year: 'numeric', month: 'short' }, locale);

/**
 * Format numbers with locale-specific formatting (separators, notation)
 * @param value - Number to format
 * @param options - Intl.NumberFormat options
 * @param locale - User's language preference
 *
 * @example
 * formatNumber(1234.56, {}, 'de')    // "1.234,56" (German)
 * formatNumber(1234.56, {}, 'en')    // "1,234.56" (English)
 */
export const formatNumber = (
  value: number,
  options: Intl.NumberFormatOptions = {},
  locale?: string,
) => {
  const currentLocale = locale || 'en';
  return new Intl.NumberFormat(currentLocale, options).format(value);
};

// =============================================================================
// DATE RANGE UTILITIES
// =============================================================================

/**
 * Convert date range to API-compatible ISO strings with timezone awareness.
 * Used for backend API calls that expect specific date format.
 *
 * @param start - Start date
 * @param end - End date
 * @param timeZone - Timezone for conversion, defaults to 'UTC'
 * @returns Object with startDate and endDate as ISO strings
 */
export const formatRange = (
  start: Date,
  end: Date,
  timeZone: string = 'UTC',
): { startDate: string; endDate: string } => ({
  startDate: `${formatInTimeZone(start, timeZone, 'yyyy-MM-dd')}T00:00:00`,
  endDate: `${formatInTimeZone(end, timeZone, 'yyyy-MM-dd')}T23:59:59.999`,
});

/**
 * Convert date range selection to actual dates.
 * Maps user-friendly date range options to specific start/end dates.
 *
 * @param value - Date range option ('today', 'last-week', 'last-month', etc.)
 * @returns Object with startDate and endDate as ISO strings for API calls
 */
export const getDateRange = (value: string) => {
  const startDate: Date | null = null;
  const endDate: Date | null = null;

  // Get user's timezone for accurate date calculations
  const timeZone = new Intl.DateTimeFormat().resolvedOptions().timeZone;
  const today = utcToZonedTime(new Date(), timeZone);

  switch (value) {
    case 'today':
      return formatRange(today, today, timeZone);

    case 'last-week': {
      const startingDate = subDays(today, 6); // 7 days total (including today)
      return formatRange(startingDate, today, timeZone);
    }

    case 'last-month': {
      const startDay = subDays(today, 29); // 30 days total (including today)
      return formatRange(startDay, today, timeZone);
    }

    case 'last-28-days': {
      const startDay = subDays(today, 27); // 28 days total (including today)
      return formatRange(startDay, today, timeZone);
    }

    case 'last-year': {
      const startOfTheYear = subDays(today, 364); // 365 days total (including today)
      return formatRange(startOfTheYear, today, timeZone);
    }

    default:
      return { startDate, endDate };
  }
};

// =============================================================================
// CHART FORMATTING UTILITIES
// =============================================================================

/**
 * Calculate optimal X-axis tick positions to avoid overcrowding.
 * Intelligently selects which dates to show on chart axis based on data length and grouping.
 *
 * @param data - Chart data array with date property
 * @param grouping - Time grouping ('hourly', 'daily', 'weekly', 'monthly')
 * @returns Array of date strings to display as X-axis ticks
 */
export const getXAxisTickValues = (data: any, grouping: string): string[] => {
  if (!data || data.length === 0) return [];
  if (data.length <= 2) return data.map((d: { date: string }) => d.date);

  const first = data[0].date;
  const last = data[data.length - 1].date;
  const selectedDates: string[] = [];

  // Helper function to process grouping and avoid duplicate units (hours/days/months)
  const processGrouping = (unitExtractor: (date: string) => number) => {
    const selectedUnits = new Set<number>([
      unitExtractor(first),
      unitExtractor(last),
    ]);

    if (data.length <= 4) {
      // For small datasets, try to show unique units
      data.forEach((d: { date: string }) => {
        const unit = unitExtractor(d.date);
        if (!selectedUnits.has(unit)) {
          selectedUnits.add(unit);
          selectedDates.push(d.date);
        }
      });
    } else if (data.length === 6) {
      // For 6 items, show middle two
      selectedDates.push(data[2].date, data[3].date);
    } else if (data.length === 9) {
      // For 9 items, show evenly spaced items
      selectedDates.push(data[3].date, data[5].date);
    } else {
      // For larger datasets, show 1/3 and 2/3 points
      const intervals = [];
      if (data.length !== 5) {
        intervals.push(Math.floor((data.length - 1) / 3));
      }
      intervals.push(Math.floor(((data.length - 1) * 2) / 3));
      intervals.forEach(i => selectedDates.push(data[i].date));
    }
  };

  // Apply grouping-specific logic
  if (grouping === 'hourly') {
    processGrouping(date => safeDate(date).getHours());
  } else if (grouping === 'daily' || grouping === 'weekly') {
    processGrouping(date => safeDate(date).getDate());
  } else if (grouping === 'monthly') {
    processGrouping(date => safeDate(date).getMonth());
  }

  // Always include first and last dates, plus selected middle dates
  return [first, ...selectedDates, last];
};

/**
 * Format dates for X-axis display based on grouping level.
 * Automatically chooses appropriate detail level for each time grouping.
 *
 * @param date - Date string to format
 * @param grouping - Time grouping level
 * @param locale - User's language preference
 * @returns Formatted date string for chart axis
 */
export const getXAxisformat = (
  date: string,
  grouping: string,
  locale?: string,
) => {
  const dateObj = safeDate(date);

  // Handle invalid dates gracefully
  if (isNaN(dateObj.getTime())) {
    return formatShortDate(safeDate(date), locale);
  }

  // Format according to grouping level
  switch (grouping) {
    case 'hourly':
      return formatTime(dateObj, locale); // "14:30" or "2:30 PM"
    case 'daily':
    case 'weekly':
      return formatShortDate(dateObj, locale); // "15 Jan 24"
    case 'monthly':
      return formatMonthYear(dateObj, locale); // "Jan 2024"
    default:
      return date;
  }
};

/**
 * Format "last used" date with smart relative formatting.
 * Shows "Today"/"Yesterday" for recent dates, otherwise formatted date.
 *
 * @param timestamp - Date timestamp to format
 * @param t - Translation function for "Today"/"Yesterday"
 * @param locale - User's language preference
 * @returns Formatted date string with relative terms when appropriate
 */
export const getLastUsedDay = (
  timestamp: string,
  t?: TranslationFunction<typeof adoptionInsightsTranslationRef.T>,
  locale?: string,
) => {
  const date = safeDate(timestamp);

  if (isToday(date)) {
    return t ? t('common.today') : 'Today';
  } else if (isYesterday(date)) {
    return t ? t('common.yesterday') : 'Yesterday';
  }
  return formatShortDate(date, locale);
};

// =============================================================================
// DATA CALCULATION UTILITIES
// =============================================================================

/**
 * Calculate average value for a specific key across data array.
 * Safely handles missing or invalid data.
 *
 * @param data - Array of data objects
 * @param key - Property key to calculate average for
 * @returns Average value, or 0 if no valid data
 */
export const getAverage = <T extends Record<string, any>>(
  data: T[],
  key: keyof T,
) => {
  if (!data || data.length === 0) return 0;

  const totalSum = data.reduce(
    (sum, entry) => sum + Number(entry[key] || 0),
    0,
  );
  return totalSum / data.length;
};

/**
 * Calculate total sum for a specific key across data array.
 * Safely handles missing or invalid data.
 *
 * @param data - Array of data objects
 * @param key - Property key to sum up
 * @returns Total sum, or 0 if no valid data
 */
export const getTotal = <T extends Record<string, any>>(
  data: T[],
  key: keyof T,
) => {
  const totalSum = data?.reduce(
    (sum, entry) => sum + Number(entry[key] || 0),
    0,
  );
  return totalSum;
};

/**
 * Extract unique catalog entity kinds with proper capitalization.
 * Applies locale-aware capitalization for entity type names.
 *
 * @param data - Array of objects with 'kind' property
 * @param locale - User's language preference for capitalization rules
 * @returns Array of unique, properly capitalized entity kinds
 */
export const getUniqueCatalogEntityKinds = (
  data: { kind: string }[],
  locale?: string,
) => {
  const allKinds = data.map(
    item => item.kind.charAt(0).toLocaleUpperCase(locale) + item.kind.slice(1),
  );
  const uniqueKinds = Array.from(new Set([...allKinds]));
  return uniqueKinds;
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Generate URL with query parameters for API calls.
 * Safely converts options object to URL search parameters.
 *
 * @param baseUrl - Base URL for the API endpoint
 * @param options - Options object to convert to query parameters
 * @returns Complete URL with query string
 */
export const generateEventsUrl = (
  baseUrl: string,
  options: APIsViewOptions,
): string => {
  const params = new URLSearchParams();

  // Add each non-empty option as URL parameter
  Object.entries(options).forEach(([key, value]) => {
    if (value && value !== undefined) {
      params.append(key, String(value));
    }
  });

  return `${baseUrl}?${params.toString()}`;
};

/**
 * Determine appropriate data grouping based on date range.
 * Automatically selects optimal time granularity for charts.
 *
 * @param startDate - Range start date
 * @param endDate - Range end date
 * @param t - Translation function for error messages
 * @returns Grouping level: 'hourly', 'daily', 'weekly', or 'monthly'
 */
export const determineGrouping = (
  startDate: Date | null,
  endDate: Date | null,
  t?: TranslationFunction<typeof adoptionInsightsTranslationRef.T>,
): string => {
  // Validate dates
  if (
    startDate &&
    endDate &&
    (isNaN(startDate.getTime()) || isNaN(endDate.getTime()))
  ) {
    const errorMessage = t
      ? t('common.invalidDateFormat')
      : 'Invalid date format';
    throw new Error(errorMessage);
  }

  if (startDate && endDate) {
    const diffInMs = endDate.getTime() - startDate.getTime();
    const daysDiff = Math.ceil(diffInMs / (1000 * 60 * 60 * 24));

    // Choose grouping based on date range
    if (daysDiff <= 1) return 'hourly'; // 1 day: show hours
    if (daysDiff <= 7) return 'daily'; // 1 week: show days
    if (daysDiff <= 30) return 'weekly'; // 1 month: show weeks
  }

  return 'monthly'; // Default: show months
};

// =============================================================================
// CHART TOOLTIP FORMATTING
// =============================================================================

/**
 * Legacy function for formatting dates with timezone (used by existing code).
 * Consider using formatDate() for new implementations.
 *
 * @param date - Date to format
 * @param formatStr - date-fns format string
 * @returns Formatted date string
 */
export const formatWithTimeZone = (
  date: Date,
  formatStr: string = 'yyyy-MM-dd',
) => {
  const timezone = new Intl.DateTimeFormat().resolvedOptions().timeZone;
  return formatInTimeZone(date, timezone, formatStr);
};

/**
 * Format hourly time bucket for tooltips.
 * Shows full date with start and end times: "January 15, 2024, 14:30–15:30"
 *
 * @param date - Start date of the hour bucket
 * @param locale - User's language preference
 * @returns Formatted hourly bucket string
 */
export const formatHourlyBucket = (date: Date, locale?: string): string => {
  const start = formatTime(date, locale);
  const end = formatTime(addHours(date, 1), locale);
  const labelDate = formatLongDate(date, locale);

  return `${labelDate}, ${start}–${end}`;
};

/**
 * Format date with filtering range context for monthly tooltips.
 * Shows date with filter range: "January 15, 2024\n  (filtered by Jan 1, 2024 – Dec 31, 2024)"
 *
 * @param date - Date to display
 * @param startDateRange - Filter range start
 * @param endDateRange - Filter range end
 * @param t - Translation function
 * @param locale - User's language preference
 * @returns Formatted date with range context
 */
export const formatDateWithRange = (
  date: Date,
  startDateRange?: Date | null,
  endDateRange?: Date | null,
  t?: TranslationFunction<typeof adoptionInsightsTranslationRef.T>,
  locale?: string,
): string => {
  const currentTimeZone = new Intl.DateTimeFormat().resolvedOptions().timeZone;
  const today = utcToZonedTime(new Date(), currentTimeZone);
  const end = endDateRange ?? today;
  const start = startDateRange ?? subDays(end, 364); // Default to 1 year range

  const startLabel = formatDate(
    start,
    { year: 'numeric', month: 'short', day: 'numeric' },
    locale,
  );
  const endLabel = formatDate(
    end,
    { year: 'numeric', month: 'short', day: 'numeric' },
    locale,
  );
  const labelDate = formatLongDate(date, locale);
  const filteredByText = t ? t('common.filteredBy') : 'filtered by';
  return `${labelDate}\n  (${filteredByText} ${startLabel} – ${endLabel})`;
};

/**
 * Format weekly date range for tooltips.
 * Shows week span: "Jan 15 – Jan 21, 2024" or "Dec 30, 2023 – Jan 5, 2024"
 *
 * @param date - Any date within the week
 * @param locale - User's language preference
 * @returns Formatted weekly range string
 */
export const formatWeeklyBucket = (date: Date, locale?: string): string => {
  const start = startOfWeek(date, { weekStartsOn: 1 }); // Monday start
  const end = addDays(start, 6); // Sunday end

  const sameYear = getYear(start) === getYear(end);

  // If same year, omit year from start date for cleaner display
  const startLabel = formatDate(
    start,
    sameYear
      ? { month: 'short', day: 'numeric' }
      : { year: 'numeric', month: 'short', day: 'numeric' },
    locale,
  );
  const endLabel = formatDate(
    end,
    { year: 'numeric', month: 'short', day: 'numeric' },
    locale,
  );

  return `${startLabel} – ${endLabel}`;
};

/**
 * Convert snake_case API keys to human-readable labels.
 * Transforms database field names to display-friendly text.
 *
 * @param key - Snake_case key from API (e.g., "new_users", "search_count")
 * @returns Human-readable label (e.g., "New users", "Search count")
 */
export const formatTooltipHeaderLabel = (key: string) => {
  const words = key.replace(/_/g, ' ').toLowerCase().split(' ');
  return words
    .map((word, index) =>
      index === 0 ? word.charAt(0).toUpperCase() + word.slice(1) : word,
    )
    .join(' ');
};

/**
 * Get the appropriate label for a grouping type.
 * Maps grouping values to their corresponding translation keys.
 *
 * @param grouping - The grouping type ('hourly', 'daily', 'weekly', 'monthly')
 * @param t - Translation function
 * @param section - The translation section ('activeUsers' or 'searches')
 * @returns Translated label for the grouping type
 */
export const getGroupingLabel = (
  grouping: string,
  t: TranslationFunction<typeof adoptionInsightsTranslationRef.T>,
  section: 'activeUsers' | 'searches',
): string => {
  switch (grouping) {
    case 'hourly':
      return t(`${section}.hour`);
    case 'daily':
      return t(`${section}.day`);
    case 'weekly':
      return t(`${section}.week`);
    case 'monthly':
      return t(`${section}.month`);
    default:
      return t(`${section}.day`); // fallback to day
  }
};
