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

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Box from '@material-ui/core/Box';
import Divider from '@material-ui/core/Divider';
import { makeStyles } from '@material-ui/core/styles';
import { useBaseFiltersStyles } from '../../../components/filtersStyles';
import { SelectComponent } from './SelectComponent';
import { AutocompleteComponent } from './AutocompleteComponent';
import { useApi } from '@backstage/core-plugin-api';
import { costManagementSlimApiRef } from '../../../apis';
import useAsync from 'react-use/lib/useAsync';
import debounce from 'lodash/debounce';
import { useThemeBackgroundColor } from '../../../hooks/useThemeBackgroundColor';

const useFiltersStyles = makeStyles(
  theme => ({
    filters: {
      '& > *': {
        marginTop: theme.spacing(0),
      },
    },
    filterSection: {
      marginBottom: theme.spacing(0),
    },
    divider: {
      margin: theme.spacing(2, 0),
    },
  }),
  { name: 'OpenShiftFilters' },
);

/** @public */
export type FiltersProps = {
  groupBy: string;
  overheadDistribution: string;
  timeRange: string;
  currency: string;
  filterBy: string;
  filterOperation: string;
  filterValue: string;
  tags?: string[];
  selectedTag?: string;
  selectedTagKey?: string;
  selectedTagValue?: string;
  onGroupByChange: (value: string) => void;
  onOverheadDistributionChange: (value: string) => void;
  onTimeRangeChange: (value: string) => void;
  onCurrencyChange: (value: string) => void;
  onFilterByChange: (value: string) => void;
  onFilterOperationChange: (value: string) => void;
  onFilterValueChange: (value: string) => void;
  onSelectedTagChange: (value: string) => void;
  onSelectedTagKeyChange: (value: string) => void;
  onSelectedTagValueChange: (value: string) => void;
};

export type CurrencyOption = {
  label: string;
  value: string;
};

/** @public */
export function Filters(props: FiltersProps) {
  const {
    groupBy,
    overheadDistribution,
    timeRange,
    currency,
    filterBy,
    filterOperation,
    filterValue,
    tags = [],
    selectedTag = '',
    selectedTagKey = '',
    selectedTagValue = '',
    onGroupByChange,
    onOverheadDistributionChange,
    onTimeRangeChange,
    onCurrencyChange,
    onFilterByChange,
    onFilterOperationChange,
    onFilterValueChange,
    onSelectedTagChange,
    onSelectedTagKeyChange,
    onSelectedTagValueChange,
  } = props;
  const baseClasses = useBaseFiltersStyles();
  const classes = useFiltersStyles();
  const api = useApi(costManagementSlimApiRef);

  const { filterTableBackgroundColor } = useThemeBackgroundColor();
  // State for search input and debounced search
  const [searchInput, setSearchInput] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');

  // Debounce function to update debouncedSearch after 500ms
  const debouncedSetSearch = useMemo(
    () =>
      debounce((value: string) => {
        setDebouncedSearch(value);
      }, 500),
    [],
  );

  // Update debounced search when searchInput changes
  useEffect(() => {
    debouncedSetSearch(searchInput);
    return () => {
      debouncedSetSearch.cancel();
    };
  }, [searchInput, debouncedSetSearch]);

  // Reset search when filterBy changes
  useEffect(() => {
    setSearchInput('');
    setDebouncedSearch('');
  }, [filterBy]);

  // Fetch resource options based on filterBy and debouncedSearch
  const { value: resourceOptions, loading: isLoadingOptions } =
    useAsync(async () => {
      // For tags, filter the tags array based on search input (for tag key selection)
      if (filterBy === 'tag') {
        if (!debouncedSearch.trim()) {
          return tags;
        }
        const searchLower = debouncedSearch.toLocaleLowerCase('en-US');
        return tags.filter(tag =>
          tag.toLocaleLowerCase('en-US').includes(searchLower),
        );
      }

      // Don't fetch if there's no search term
      if (!debouncedSearch.trim()) {
        return [];
      }

      try {
        let response;
        switch (filterBy) {
          case 'project':
            response = await api.searchOpenShiftProjects(debouncedSearch);
            break;
          case 'cluster':
            response = await api.searchOpenShiftClusters(debouncedSearch);
            break;
          case 'node':
            response = await api.searchOpenShiftNodes(debouncedSearch);
            break;
          default:
            return [];
        }
        const data = await response.json();
        // Extract the 'value' property from each object in the data array
        return (data.data || []).map((item: { value: string }) => item.value);
      } catch {
        // Silently return empty array on error
        return [];
      }
    }, [filterBy, debouncedSearch, api, tags]);

  // Fetch tag values when a tag key is selected for filtering
  const { value: tagValuesData, loading: isLoadingTagValues } =
    useAsync(async () => {
      if (filterBy === 'tag' && selectedTagKey) {
        try {
          const timeScopeValue = timeRange === 'month-to-date' ? -1 : -2;
          const response = await api.getOpenShiftTagValues(
            selectedTagKey,
            timeScopeValue,
          );
          const data = await response.json();
          // Extract all unique values from all items in the data array
          const allValues = new Set<string>();
          for (const item of data.data || []) {
            if (item.values) {
              for (const value of item.values) {
                allValues.add(value);
              }
            }
          }
          return Array.from(allValues).sort((a, b) =>
            a.localeCompare(b, 'en-US'),
          );
        } catch {
          return [];
        }
      }
      return [];
    }, [filterBy, selectedTagKey, timeRange, api]);

  // Generate filter value options based on API results
  // Always include the current filterValue if it's set, so it doesn't disappear
  const getFilterValueOptions = useMemo((): string[] => {
    const options = resourceOptions || [];
    // If filterValue is set and not already in options, add it
    if (filterValue && !options.includes(filterValue)) {
      return [filterValue, ...options];
    }
    return options;
  }, [resourceOptions, filterValue]);

  // Handle input change in autocomplete
  const handleInputChange = useCallback(
    (_event: React.ChangeEvent<{}>, value: string, reason: string) => {
      // Only update search input when user is typing (not when clearing or resetting)
      if (reason === 'input') {
        setSearchInput(value);
      }
    },
    [],
  );

  const currencyOptions: CurrencyOption[] = [
    { label: 'AUD (A$) - Australian Dollar', value: 'AUD' },
    { label: 'BRL (R$) - Brazilian Real', value: 'BRL' },
    { label: 'CAD (CA$) - Canadian Dollar', value: 'CAD' },
    { label: 'CHF (CHF) - Swiss Franc', value: 'CHF' },
    { label: 'CNY (CN¥) - Chinese Yuan', value: 'CNY' },
    { label: 'CZK (Kč) - Czech Koruna', value: 'CZK' },
    { label: 'DKK (DKK) - Danish Krone', value: 'DKK' },
    { label: 'EUR (€) - Euro', value: 'EUR' },
    { label: 'GBP (£) - British Pound', value: 'GBP' },
    { label: 'HKD (HK$) - Hong Kong Dollar', value: 'HKD' },
    { label: 'INR (₹) - Indian Rupee', value: 'INR' },
    { label: 'JPY (¥) - Japanese Yen', value: 'JPY' },
    { label: 'NGN (₦) - Nigerian Naira', value: 'NGN' },
    { label: 'NOK (NOK) - Norwegian Krone', value: 'NOK' },
    { label: 'NZD (NZ$) - New Zealand Dollar', value: 'NZD' },
    { label: 'SEK (SEK) - Swedish Krona', value: 'SEK' },
    { label: 'SGD (SGD) - Singapore Dollar', value: 'SGD' },
    { label: 'USD ($) - United States Dollar', value: 'USD' },
    { label: 'ZAR (ZAR) - South African Rand', value: 'ZAR' },
  ];

  return (
    <Box className={baseClasses.root}>
      <Box className={`${baseClasses.filters} ${classes.filters}`}>
        {/* Group by */}
        <div className={classes.filterSection}>
          <Box p={1} pt={0}>
            <SelectComponent
              freeSolo
              selectOnFocus
              clearOnBlur
              handleHomeEndKeys
              filterSelectedOptions
              label="Group by"
              options={['project', 'cluster', 'node', 'tag']}
              value={groupBy}
              placeholder="Group by"
              onChange={(event): void =>
                onGroupByChange(event.target.value as string)
              }
            />
            {groupBy === 'tag' && (
              <Box p={0} pt={0}>
                <AutocompleteComponent
                  label="Choose key"
                  options={tags}
                  value={selectedTag}
                  placeholder="Choose key"
                  loading={false}
                  onChange={(_event, value): void => {
                    onSelectedTagChange((value as string) ?? '');
                  }}
                />
              </Box>
            )}
          </Box>
        </div>

        {/* Overhead cost */}
        <div className={classes.filterSection}>
          <Box p={1}>
            <SelectComponent
              freeSolo
              selectOnFocus
              clearOnBlur
              handleHomeEndKeys
              filterSelectedOptions
              label="Overhead cost"
              options={[
                'Distribute through cost models',
                "Don't distribute overhead costs",
              ]}
              value={
                overheadDistribution === 'distribute'
                  ? 'Distribute through cost models'
                  : "Don't distribute overhead costs"
              }
              placeholder="Overhead cost"
              onChange={(event): void => {
                const value = event.target.value as string;
                const mappedValue =
                  value === 'Distribute through cost models'
                    ? 'distribute'
                    : 'dont_distribute';
                onOverheadDistributionChange(mappedValue);
              }}
            />
          </Box>
        </div>

        {/* Time */}
        <div className={classes.filterSection}>
          <Box p={1}>
            <SelectComponent
              freeSolo
              selectOnFocus
              clearOnBlur
              handleHomeEndKeys
              filterSelectedOptions
              label="Time"
              options={['Month to date', 'Previous month']}
              value={
                timeRange === 'month-to-date'
                  ? 'Month to date'
                  : 'Previous month'
              }
              placeholder="Time"
              onChange={(event): void => {
                const value = event.target.value as string;
                const mappedValue =
                  value === 'Month to date'
                    ? 'month-to-date'
                    : 'previous-month';
                onTimeRangeChange(mappedValue);
              }}
            />
          </Box>
        </div>

        <Box marginX={2}>
          <Divider className={classes.divider} />
        </Box>

        {/* Filter table by */}
        <div className={classes.filterSection}>
          <div
            style={{
              backgroundColor: filterTableBackgroundColor,
              padding: 16,
              borderRadius: 8,
            }}
          >
            <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
              Filter table by
            </div>
            <SelectComponent
              freeSolo
              selectOnFocus
              clearOnBlur
              handleHomeEndKeys
              filterSelectedOptions
              label=""
              options={['project', 'cluster', 'node', 'tag']}
              value={filterBy}
              placeholder=""
              onChange={(event): void => {
                const newFilterBy = event.target.value as string;
                onFilterByChange(newFilterBy);
                onFilterValueChange('');
                // Clear tag-related selections when filterBy changes away from 'tag'
                if (newFilterBy !== 'tag') {
                  onSelectedTagKeyChange('');
                  onSelectedTagValueChange('');
                }
              }}
            />
            <SelectComponent
              freeSolo
              selectOnFocus
              clearOnBlur
              handleHomeEndKeys
              filterSelectedOptions
              label=""
              options={['includes', 'excludes', 'exact']}
              value={filterOperation}
              placeholder=""
              onChange={(event): void => {
                onFilterOperationChange(event.target.value as string);
              }}
            />

            {filterBy === 'tag' ? (
              <>
                <AutocompleteComponent
                  label=""
                  options={getFilterValueOptions}
                  value={selectedTagKey}
                  placeholder="Select tag key"
                  loading={false}
                  onInputChange={handleInputChange}
                  onChange={(_event, value): void => {
                    const tagKey = (value as string) ?? '';
                    onSelectedTagKeyChange(tagKey);
                    // Clear tag value when tag key changes
                    onSelectedTagValueChange('');
                    // Clear search input when a value is selected
                    setSearchInput('');
                    setDebouncedSearch('');
                  }}
                />
                {selectedTagKey && (
                  <Box style={{ marginTop: '-8px' }}>
                    <AutocompleteComponent
                      label=""
                      options={tagValuesData || []}
                      value={selectedTagValue}
                      placeholder="Select tag value"
                      loading={isLoadingTagValues}
                      onChange={(_event, value): void => {
                        onSelectedTagValueChange((value as string) ?? '');
                      }}
                    />
                  </Box>
                )}
              </>
            ) : (
              <AutocompleteComponent
                label=""
                options={getFilterValueOptions}
                value={filterValue}
                placeholder={`Filter by ${filterBy || 'project'}`}
                loading={isLoadingOptions}
                onInputChange={handleInputChange}
                onChange={(_event, value): void => {
                  onFilterValueChange((value as string) ?? '');
                  // Clear search input when a value is selected
                  setSearchInput('');
                  setDebouncedSearch('');
                }}
              />
            )}
          </div>
        </div>

        <Box marginX={2}>
          <Divider className={classes.divider} />
        </Box>

        {/* Currency */}
        <div className={classes.filterSection}>
          <Box p={2}>
            <SelectComponent
              freeSolo
              selectOnFocus
              clearOnBlur
              handleHomeEndKeys
              filterSelectedOptions
              label="Currency"
              options={currencyOptions.map(
                (value: CurrencyOption) => value.label,
              )}
              value={
                currencyOptions.find(
                  (item: CurrencyOption) => item.value === currency,
                )?.label ?? ''
              }
              placeholder="Select currency"
              onChange={(event): void => {
                const selectedLabel = event.target.value as string;
                const selectedCurrency =
                  currencyOptions.find(
                    (item: CurrencyOption) => item.label === selectedLabel,
                  )?.value ?? '';
                onCurrencyChange(selectedCurrency);
              }}
            />
          </Box>
        </div>
      </Box>
    </Box>
  );
}
