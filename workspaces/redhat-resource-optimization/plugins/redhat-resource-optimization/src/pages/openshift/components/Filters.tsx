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

import React from 'react';
import Box from '@material-ui/core/Box';
import Divider from '@material-ui/core/Divider';
import { makeStyles } from '@material-ui/core/styles';
import { useBaseFiltersStyles } from '../../../components/filtersStyles';
import { SelectComponent } from './SelectComponent';
import { AutocompleteComponent } from './AutocompleteComponent';

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
  onGroupByChange: (value: string) => void;
  onOverheadDistributionChange: (value: string) => void;
  onTimeRangeChange: (value: string) => void;
  onCurrencyChange: (value: string) => void;
  onFilterByChange: (value: string) => void;
  onFilterOperationChange: (value: string) => void;
  onFilterValueChange: (value: string) => void;
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
    onGroupByChange,
    onOverheadDistributionChange,
    onTimeRangeChange,
    onCurrencyChange,
    onFilterByChange,
    onFilterOperationChange,
    onFilterValueChange,
  } = props;
  const baseClasses = useBaseFiltersStyles();
  const classes = useFiltersStyles();

  // Generate filter value options based on the selected filterBy
  const getFilterValueOptions = (): string[] => {
    switch (filterBy) {
      case 'project':
        return [
          'analytics',
          'wolfpack',
          'cost-management',
          'install-test',
          'Worker unallocated',
        ];
      case 'cluster':
        return ['cluster-1', 'cluster-2', 'cluster-3', 'cluster-4'];
      case 'node':
        return ['node-1', 'node-2', 'node-3', 'node-4', 'node-5'];
      case 'tag':
        return ['production', 'staging', 'development', 'testing'];
      default:
        return ['Select a filter type first'];
    }
  };

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
            style={{ backgroundColor: '#F2F2F2', padding: 16, borderRadius: 8 }}
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
                onFilterByChange(event.target.value as string);
                onFilterValueChange('');
              }}
            />
            <SelectComponent
              freeSolo
              selectOnFocus
              clearOnBlur
              handleHomeEndKeys
              filterSelectedOptions
              label=""
              options={['includes', 'excludes']}
              value={filterOperation}
              placeholder=""
              onChange={(event): void => {
                onFilterOperationChange(event.target.value as string);
              }}
            />

            <AutocompleteComponent
              label=""
              options={getFilterValueOptions()}
              value={filterValue}
              placeholder={`Filter by ${filterBy || 'project'}`}
              onChange={(_event, value): void => {
                onFilterValueChange((value as string) ?? '');
              }}
            />
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
