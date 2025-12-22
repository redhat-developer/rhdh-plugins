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

import React, { useMemo, useState, useCallback, useRef } from 'react';
import type { ExportFormat } from '@red-hat-developer-hub/plugin-redhat-resource-optimization-common/clients';
import {
  Table,
  TableColumn,
  InfoCard,
  ResponseErrorPanel,
} from '@backstage/core-components';
import Typography from '@material-ui/core/Typography';
import { BasePage } from '../../components/BasePage';
import { PageLayout } from '../../components/PageLayout';
import { Filters } from './components/Filters';
import { Divider, useTheme } from '@material-ui/core';
import { PageHeader } from './components/PageHeader';
import { TableToolbar } from './components/TableToolbar';
import { useApi } from '@backstage/core-plugin-api';
import { costManagementSlimApiRef } from '../../apis';
import useAsync from 'react-use/lib/useAsync';
import { CURRENCY_SYMBOLS } from '../../constants/currencies';
import { DownloadIconButton } from './components/DownloadIconButton';

const formatCurrency = (value: number, currencyCode: string): string => {
  const symbol = CURRENCY_SYMBOLS[currencyCode] || currencyCode;
  return `${symbol}${value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

interface ProjectCost {
  id: string;
  projectName: string;
  cost: number;
  costPercentage: number;
  monthOverMonthChange: number;
  monthOverMonthValue: number;
  includesOverhead: boolean;
  previousPeriodCost: number;
  infrastructureCost: number;
  infrastructureCostPercentage: number;
  supplementaryCost: number;
  supplementaryCostPercentage: number;
}

/**
 * Generates date range text based on time range selection
 * @param timeRange - 'month-to-date' or 'previous-month'
 * @returns Formatted string like "December 1-3" or "November 1-30"
 */
function getDateRangeText(timeRange: string): string {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const currentDay = now.getDate();

  if (timeRange === 'month-to-date') {
    // Current month: MONTH 1-<CURRENT_DAY>
    const monthName = now.toLocaleString('en-US', { month: 'long' });
    return `${monthName} 1-${currentDay}`;
  }
  // Previous month: PREVIOUS_MONTH 1-<LAST_DAY>
  const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
  const prevMonthDate = new Date(prevYear, prevMonth + 1, 0); // Last day of previous month
  const lastDay = prevMonthDate.getDate();
  const monthName = prevMonthDate.toLocaleString('en-US', { month: 'long' });
  return `${monthName} 1-${lastDay}`;
}

/**
 * Configuration for building query parameters
 */
interface QueryParamsConfig {
  groupBy: string;
  selectedTag: string;
  overheadDistribution: string;
  timeRange: string;
  currency: string;
  showPlatformSum: boolean;
  filterBy: string;
  filterValue: string;
  filterOperation: string;
  selectedTagKey: string;
  selectedTagValue: string;
  sortField: string | null;
  sortDirection: 'asc' | 'desc';
}

/**
 * Options for building query parameters
 */
interface BuildQueryParamsOptions {
  /** Pagination limit - omit for download (uses 0) */
  limit?: number;
  /** Pagination offset - omit for download */
  offset?: number;
  /** Specific item name to filter by (for row-level download) */
  specificItemName?: string;
}

/**
 * Builds query parameters for cost management API requests
 * Shared between data fetching and download functionality
 */
function buildCostManagementQueryParams(
  config: QueryParamsConfig,
  options: BuildQueryParamsOptions = {},
): Record<string, string | number> {
  const {
    groupBy,
    selectedTag,
    overheadDistribution,
    timeRange,
    currency,
    showPlatformSum,
    filterBy,
    filterValue,
    filterOperation,
    selectedTagKey,
    selectedTagValue,
    sortField,
    sortDirection,
  } = config;

  const { limit, offset, specificItemName } = options;

  // Build group by parameter
  const groupByParam =
    groupBy === 'tag' ? `group_by[tag:${selectedTag}]` : `group_by[${groupBy}]`;

  // Determine delta parameter
  const deltaParam =
    groupBy === 'project' && overheadDistribution === 'distribute'
      ? 'distributed_cost'
      : 'cost';

  const timeScopeValue = timeRange === 'month-to-date' ? -1 : -2;

  const queryParams: Record<string, string | number> = {
    currency,
    delta: deltaParam,
    'filter[resolution]': 'monthly',
    'filter[time_scope_units]': 'month',
    'filter[time_scope_value]': timeScopeValue,
  };

  // Add pagination if provided
  if (limit !== undefined) {
    queryParams['filter[limit]'] = limit;
  }
  if (offset !== undefined) {
    queryParams['filter[offset]'] = offset;
  }

  // Add category parameter when showPlatformSum is enabled
  if (showPlatformSum) {
    queryParams.category = 'Platform';
  }

  queryParams[groupByParam] = '*';

  // Handle filtering
  if (specificItemName) {
    // Filter for specific item (row-level download)
    queryParams[`filter[${groupBy}]`] = specificItemName;
  } else if (filterBy === 'tag' && selectedTagKey && selectedTagValue) {
    // Tag filtering
    const filterPrefix = filterOperation === 'excludes' ? 'exclude' : 'filter';
    queryParams[`${filterPrefix}[tag:${selectedTagKey}]`] = selectedTagValue;
  } else if (filterValue) {
    // Regular filtering
    const filterPrefix = filterOperation === 'excludes' ? 'exclude' : 'filter';
    queryParams[`${filterPrefix}[${filterBy}]`] = filterValue;
  }

  // Add sorting
  let apiSortField: string;
  if (sortField) {
    if (sortField === 'cost') {
      apiSortField = deltaParam;
    } else if (sortField === 'projectName') {
      apiSortField = groupBy;
    } else {
      apiSortField = deltaParam;
    }
    queryParams[`order_by[${apiSortField}]`] = sortDirection;
  } else {
    queryParams[`order_by[${deltaParam}]`] = 'desc';
  }

  return queryParams;
}

/** @public */
export function OpenShiftPage() {
  const api = useApi(costManagementSlimApiRef);
  const [groupBy, setGroupBy] = useState('project');
  const [overheadDistribution, setOverheadDistribution] =
    useState('distribute');
  const [timeRange, setTimeRange] = useState('month-to-date');
  const [currency, setCurrency] = useState('USD');
  const [filterBy, setFilterBy] = useState('project');
  const [filterOperation, setFilterOperation] = useState('includes');
  const [filterValue, setFilterValue] = useState('');
  const [showPlatformSum, setShowPlatformSum] = useState(false);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(5);
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [tags, setTags] = useState<string[]>([]);
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [selectedTagKey, setSelectedTagKey] = useState<string>('');
  const [selectedTagValue, setSelectedTagValue] = useState<string>('');
  const [showMonthOverMonthChange, setShowMonthOverMonthChange] =
    useState(true);
  const [showInfrastructureCost, setShowInfrastructureCost] = useState(false);
  const [showSupplementaryCost, setShowSupplementaryCost] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const theme = useTheme();
  const isDarkMode = (theme.palette as any).mode === 'dark';

  // Ref to store display data for use in download handlers
  const displayDataRef = useRef<typeof displayData | null>(null);

  // Fetch tags on first load
  useAsync(async () => {
    try {
      const timeScopeValue = timeRange === 'month-to-date' ? -1 : -2;
      const response = await api.getOpenShiftTags(timeScopeValue);
      const tagsData = await response.json();
      setTags(tagsData.data || []);
    } catch {
      // Silently fail if tags can't be loaded
      setTags([]);
    }
  }, [api, timeRange]);

  // Build config object for query params builder (memoized to prevent unnecessary re-renders)
  const queryParamsConfig: QueryParamsConfig = useMemo(
    () => ({
      groupBy,
      selectedTag,
      overheadDistribution,
      timeRange,
      currency,
      showPlatformSum,
      filterBy,
      filterValue,
      filterOperation,
      selectedTagKey,
      selectedTagValue,
      sortField,
      sortDirection,
    }),
    [
      groupBy,
      selectedTag,
      overheadDistribution,
      timeRange,
      currency,
      showPlatformSum,
      filterBy,
      filterValue,
      filterOperation,
      selectedTagKey,
      selectedTagValue,
      sortField,
      sortDirection,
    ],
  );

  const {
    value: costData,
    loading,
    error,
  } = useAsync(async () => {
    // Don't make API call if groupBy is 'tag' but no tag is selected
    if (groupBy === 'tag' && !selectedTag) {
      return null;
    }

    try {
      const offset = currentPage * pageSize;
      const queryParams = buildCostManagementQueryParams(queryParamsConfig, {
        limit: pageSize,
        offset,
      });

      const response = await api.getCostManagementReport({
        query: queryParams,
      });
      return response.json();
    } catch {
      return null;
    }
  }, [
    currency,
    overheadDistribution,
    timeRange,
    groupBy,
    filterBy,
    filterValue,
    filterOperation,
    showPlatformSum,
    api,
    currentPage,
    pageSize,
    sortField,
    sortDirection,
    selectedTag,
    selectedTagKey,
    selectedTagValue,
  ]);

  const displayData = useMemo(() => {
    // If costData is null, return empty structure to keep table visible during loading
    if (!costData) {
      const today = new Date();
      const month =
        timeRange === 'previous-month'
          ? new Date(
              today.getFullYear(),
              today.getMonth() - 1,
              1,
            ).toLocaleString('en-US', { month: 'long' })
          : today.toLocaleString('en-US', { month: 'long' });
      const endDate =
        timeRange === 'previous-month'
          ? new Date(today.getFullYear(), today.getMonth(), 0)
              .getDate()
              .toString()
          : today.getDate().toString();

      return {
        totalCost: 0,
        month,
        endDate,
        currencyCode: currency,
        projects: [],
      };
    }

    const arrayKey = `${groupBy}s` as keyof (typeof costData.data)[0];
    const groupedArray = costData.data?.[0]?.[arrayKey] as
      | Array<{ [key: string]: unknown; values: unknown[] }>
      | undefined;

    const projects =
      groupedArray?.map((item, index) => {
        const value =
          (item.values?.[0] as {
            cost?: {
              distributed?: { value?: number };
              total?: { value?: number };
              network_unattributed_distributed?: { value?: number };
              worker_unallocated_distributed?: { value?: number };
              platform_distributed?: { value?: number };
              storage_unattributed_distributed?: { value?: number };
            };
            infrastructure?: {
              total?: { value?: number };
            };
            supplementary?: {
              total?: { value?: number };
            };
            delta_percent?: number;
            delta_value?: number;
          }) || {};

        const nameField = groupBy as keyof typeof item;
        const itemName = (item[nameField] as string) || 'Unknown';

        const costField =
          groupBy === 'project' && overheadDistribution === 'distribute'
            ? 'distributed'
            : 'total';
        const costValue =
          value?.cost?.[costField as keyof typeof value.cost]?.value || 0;

        const deltaPercent = value?.delta_percent || 0;
        const deltaValue = value?.delta_value || 0;

        const infrastructureValue = value?.infrastructure?.total?.value || 0;
        const supplementaryValue = value?.supplementary?.total?.value || 0;

        return {
          id: `${index}`,
          projectName: itemName,
          cost: costValue,
          costPercentage: 0,
          monthOverMonthChange: deltaPercent,
          monthOverMonthValue: Math.abs(deltaValue),
          includesOverhead:
            value?.cost?.network_unattributed_distributed?.value !== 0 ||
            value?.cost?.worker_unallocated_distributed?.value !== 0 ||
            value?.cost?.platform_distributed?.value !== 0 ||
            value?.cost?.storage_unattributed_distributed?.value !== 0,
          previousPeriodCost: costValue + Math.abs(deltaValue),
          infrastructureCost: infrastructureValue,
          infrastructureCostPercentage: 0,
          supplementaryCost: supplementaryValue,
          supplementaryCostPercentage: 0,
        };
      }) || [];

    const totalCost = costData.meta?.total?.cost?.total?.value || 0;
    const totalInfrastructureCost =
      costData.meta?.total?.infrastructure?.total?.value || 0;
    const totalSupplementaryCost =
      costData.meta?.total?.supplementary?.total?.value || 0;

    const currencyCode = costData.meta?.currency || currency;

    const projectsWithPercentage = projects.map(p => ({
      ...p,
      costPercentage: totalCost > 0 ? (p.cost / totalCost) * 100 : 0,
      infrastructureCostPercentage:
        totalInfrastructureCost > 0
          ? (p.infrastructureCost / totalInfrastructureCost) * 100
          : 0,
      supplementaryCostPercentage:
        totalSupplementaryCost > 0
          ? (p.supplementaryCost / totalSupplementaryCost) * 100
          : 0,
    }));

    let month: string;
    let endDate: string;

    if (timeRange === 'previous-month') {
      const today = new Date();
      const previousMonth = new Date(
        today.getFullYear(),
        today.getMonth() - 1,
        1,
      );
      month = previousMonth.toLocaleString('en-US', { month: 'long' });
      const lastDayOfPreviousMonth = new Date(
        today.getFullYear(),
        today.getMonth(),
        0,
      ).getDate();
      endDate = lastDayOfPreviousMonth.toString();
    } else {
      const today = new Date();
      month = today.toLocaleString('en-US', { month: 'long' });
      endDate = today.getDate().toString();
    }

    return {
      totalCost,
      month,
      endDate,
      currencyCode,
      projects: projectsWithPercentage,
    };
  }, [costData, currency, groupBy, overheadDistribution, timeRange]);

  // Update ref when displayData changes
  displayDataRef.current = displayData;

  /**
   * Builds query parameters for download request
   * @param specificItemName - Optional: specific item name to filter by (for row-level download)
   */
  const buildDownloadQueryParams = useCallback(
    (specificItemName?: string): Record<string, string | number> => {
      return buildCostManagementQueryParams(queryParamsConfig, {
        specificItemName,
      });
    },
    [queryParamsConfig],
  );

  /**
   * Handles download for header buttons (all data based on current filters)
   */
  const handleHeaderDownload = useCallback(
    async (format: ExportFormat) => {
      if (isDownloading) return;

      setIsDownloading(true);
      try {
        const queryParams = buildDownloadQueryParams();
        await api.downloadCostManagementReport({
          query: queryParams,
          format,
        });
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error(`Failed to download ${format}:`, err);
      } finally {
        setIsDownloading(false);
      }
    },
    [api, buildDownloadQueryParams, isDownloading],
  );

  /**
   * Handles download for row-level buttons (specific item)
   */
  const handleRowDownload = useCallback(
    async (itemName: string, format: ExportFormat) => {
      if (isDownloading) return;

      setIsDownloading(true);
      try {
        const queryParams = buildDownloadQueryParams(itemName);
        await api.downloadCostManagementReport({
          query: queryParams,
          format,
        });
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error(`Failed to download ${format} for ${itemName}:`, err);
      } finally {
        setIsDownloading(false);
      }
    },
    [api, buildDownloadQueryParams, isDownloading],
  );

  const handleRowSelect = useCallback(
    (rowId: string, isSelected: boolean) => {
      const newSelectedRows = new Set(selectedRows);
      if (isSelected) {
        newSelectedRows.add(rowId);
      } else {
        newSelectedRows.delete(rowId);
      }
      setSelectedRows(newSelectedRows);
    },
    [selectedRows],
  );

  const handleSelectAll = useCallback(
    (isSelected: boolean) => {
      if (isSelected && displayData) {
        setSelectedRows(
          new Set(displayData.projects.map(project => project.id)),
        );
      } else {
        setSelectedRows(new Set());
      }
    },
    [displayData],
  );

  const handlePageChange = useCallback((page: number, newPageSize: number) => {
    setCurrentPage(page);
    setPageSize(newPageSize);
  }, []);

  const handleRowsPerPageChange = useCallback((newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(0);
  }, []);

  const totalCount = costData?.meta?.count || 0;

  const isAllSelected =
    displayData !== null &&
    selectedRows.size === displayData.projects.length &&
    displayData.projects.length > 0;
  const isIndeterminate =
    displayData !== null &&
    selectedRows.size > 0 &&
    selectedRows.size < displayData.projects.length;

  const columns = useMemo<TableColumn<ProjectCost>[]>(() => {
    const getChangeColor = (change: number) => {
      if (change > 0) return '#d32f2f';
      if (isDarkMode) return '#4BB543';
      return '#2e7d32';
    };

    const cols: TableColumn<ProjectCost>[] = [
      {
        title: (
          <div style={{ marginLeft: 0, paddingLeft: 0 }}>
            <input
              type="checkbox"
              checked={isAllSelected}
              ref={input => {
                if (input) input.indeterminate = isIndeterminate;
              }}
              onChange={e => {
                e.stopPropagation();
                handleSelectAll(e.target.checked);
              }}
              style={{
                width: '18px',
                height: '18px',
                cursor: 'pointer',
                margin: 0,
                padding: 0,
              }}
            />
          </div>
        ),
        field: 'checkbox',
        sorting: false,
        width: '40px',
        cellStyle: {
          paddingLeft: '4px',
          paddingRight: '4px',
        },
        headerStyle: {
          paddingLeft: '4px',
          paddingRight: '4px',
        },
        render: data => (
          <div style={{ paddingRight: '4px' }}>
            <input
              type="checkbox"
              checked={selectedRows.has(data.id)}
              onChange={e => handleRowSelect(data.id, e.target.checked)}
              style={{
                width: '18px',
                height: '18px',
                cursor: 'pointer',
                margin: 0,
                padding: 0,
              }}
            />
          </div>
        ),
      },
      {
        title: (
          <Typography variant="body2" style={{ fontWeight: 'bold' }}>
            {groupBy.charAt(0).toLocaleUpperCase('en-US') + groupBy.slice(1)}{' '}
            name
          </Typography>
        ),
        field: 'projectName',
        render: data => (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Typography variant="body2">{data.projectName}</Typography>
            {data.includesOverhead && (
              <Typography
                variant="caption"
                style={{
                  padding: '2px 6px',
                  backgroundColor: '#F5F5F5',
                  border: '1px solid #D2D2D2',
                  borderRadius: '16px',
                  color: 'black',
                }}
              >
                Includes overhead
              </Typography>
            )}
          </div>
        ),
      },
    ];

    if (showMonthOverMonthChange) {
      cols.push({
        title: 'Month over month change',
        field: 'monthOverMonthChange',
        sorting: false,
        render: data => (
          <div>
            <div
              style={{
                color: getChangeColor(data.monthOverMonthChange),
              }}
            >
              {Math.abs(data.monthOverMonthChange).toFixed(2)}%
              {data.monthOverMonthChange > 0 ? ' ▲' : ' ▼'}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#666' }}>
              {formatCurrency(
                data.monthOverMonthValue,
                displayData?.currencyCode || '',
              )}{' '}
              for {getDateRangeText(timeRange)}
            </div>
          </div>
        ),
      });
    }

    cols.push({
      title: 'Cost',
      field: 'cost',
      render: data => (
        <div>
          <div>
            {formatCurrency(data.cost, displayData?.currencyCode || '')}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#666' }}>
            {data.costPercentage.toFixed(2)}% of cost
          </div>
        </div>
      ),
    });

    if (showInfrastructureCost) {
      cols.push({
        title: 'Infrastructure cost',
        field: 'infrastructureCost',
        render: data => (
          <div>
            <div>
              {formatCurrency(
                data.infrastructureCost,
                displayData?.currencyCode || '',
              )}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#666' }}>
              {data.infrastructureCostPercentage.toFixed(2)}% of cost
            </div>
          </div>
        ),
      });
    }

    if (showSupplementaryCost) {
      cols.push({
        title: 'Supplementary cost',
        field: 'supplementaryCost',
        render: data => (
          <div>
            <div>
              {formatCurrency(
                data.supplementaryCost,
                displayData?.currencyCode || '',
              )}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#666' }}>
              {data.supplementaryCostPercentage.toFixed(2)}% of cost
            </div>
          </div>
        ),
      });
    }

    cols.push({
      title: 'Actions',
      field: 'actions',
      sorting: false,
      render: data => (
        <div style={{ display: 'flex', gap: '8px' }}>
          <DownloadIconButton
            label="CSV"
            variant={isDarkMode ? 'white' : 'black'}
            onClick={() => handleRowDownload(data.projectName, 'csv')}
            disabled={isDownloading}
          />
          <DownloadIconButton
            label="JSON"
            variant={isDarkMode ? 'white' : 'black'}
            onClick={() => handleRowDownload(data.projectName, 'json')}
            disabled={isDownloading}
          />
        </div>
      ),
    });

    return cols;
  }, [
    handleRowSelect,
    handleRowDownload,
    isAllSelected,
    isIndeterminate,
    isDownloading,
    selectedRows,
    handleSelectAll,
    displayData?.currencyCode,
    groupBy,
    showMonthOverMonthChange,
    showInfrastructureCost,
    showSupplementaryCost,
    timeRange,
    isDarkMode,
  ]);

  const handleOrderChange = useCallback(
    (orderBy: number, orderDirection: 'asc' | 'desc') => {
      // If orderBy is -1, it means "no sorting" - ignore it to prevent removing sorting
      if (orderBy === -1) {
        return;
      }

      const column = columns[orderBy];
      if (
        column?.field &&
        column.field !== 'actions' &&
        column.sorting !== false
      ) {
        const newField = column.field as string;
        setSortField(newField);
        setSortDirection(orderDirection);

        setCurrentPage(0);
      }
    },
    [columns],
  );

  if (error) {
    return <ResponseErrorPanel error={error} />;
  }

  return (
    <BasePage pageTitle="" withContentPadding>
      <PageHeader
        totalCost={displayData.totalCost}
        month={displayData.month}
        endDate={displayData.endDate}
        currencyCode={displayData.currencyCode}
        customStyle={{ marginTop: '-24px' }}
      />

      <Divider
        style={{
          marginBottom: 24,
          marginLeft: '-24px',
          marginRight: '-24px',
          width: 'calc(100% + 48px)',
        }}
      />

      <PageLayout>
        <PageLayout.Filters>
          <Filters
            groupBy={groupBy}
            overheadDistribution={overheadDistribution}
            timeRange={timeRange}
            currency={currency}
            filterBy={filterBy}
            filterOperation={filterOperation}
            filterValue={filterValue}
            tags={tags}
            onGroupByChange={value => {
              setGroupBy(value);
              setCurrentPage(0);
              if (value !== 'tag') {
                setSelectedTag('');
              }
              // Reset showPlatformSum when groupBy changes away from 'project'
              if (value !== 'project') {
                setShowPlatformSum(false);
              }
            }}
            selectedTag={selectedTag}
            onSelectedTagChange={value => {
              setSelectedTag(value);
              setCurrentPage(0);
            }}
            onOverheadDistributionChange={value => {
              setOverheadDistribution(value);
              setCurrentPage(0);
            }}
            onTimeRangeChange={value => {
              setTimeRange(value);
              setCurrentPage(0);
            }}
            onCurrencyChange={value => {
              setCurrency(value);
              setCurrentPage(0);
            }}
            onFilterByChange={value => {
              setFilterBy(value);
              setCurrentPage(0);
              // Clear tag-related selections when filterBy changes away from 'tag'
              if (value !== 'tag') {
                setSelectedTagKey('');
                setSelectedTagValue('');
              }
            }}
            onFilterOperationChange={value => {
              setFilterOperation(value);
              setCurrentPage(0);
            }}
            onFilterValueChange={value => {
              setFilterValue(value);
              setCurrentPage(0);
            }}
            selectedTagKey={selectedTagKey}
            selectedTagValue={selectedTagValue}
            onSelectedTagKeyChange={value => {
              setSelectedTagKey(value);
              setSelectedTagValue('');
              setCurrentPage(0);
            }}
            onSelectedTagValueChange={value => {
              setSelectedTagValue(value);
              setCurrentPage(0);
            }}
          />
        </PageLayout.Filters>
        <PageLayout.Table>
          <div style={{ flex: 1 }}>
            <InfoCard>
              <Table<ProjectCost>
                data={displayData?.projects || []}
                isLoading={loading}
                components={{
                  Toolbar: () => (
                    <TableToolbar
                      showPlatformSum={showPlatformSum}
                      setShowPlatformSum={setShowPlatformSum}
                      projectsCount={displayData?.projects?.length || 0}
                      groupBy={groupBy}
                      showMonthOverMonthChange={showMonthOverMonthChange}
                      setShowMonthOverMonthChange={setShowMonthOverMonthChange}
                      showInfrastructureCost={showInfrastructureCost}
                      setShowInfrastructureCost={setShowInfrastructureCost}
                      showSupplementaryCost={showSupplementaryCost}
                      setShowSupplementaryCost={setShowSupplementaryCost}
                      onDownloadCsv={() => handleHeaderDownload('csv')}
                      onDownloadJson={() => handleHeaderDownload('json')}
                      isDownloading={isDownloading}
                    />
                  ),
                }}
                columns={columns}
                options={{
                  paging: true,
                  pageSize: pageSize,
                  pageSizeOptions: [5, 10, 25, 50],
                  search: false,
                  sorting: true,
                  padding: 'dense',
                  thirdSortClick: false,
                }}
                totalCount={totalCount}
                page={currentPage}
                onPageChange={handlePageChange}
                onRowsPerPageChange={handleRowsPerPageChange}
                onOrderChange={handleOrderChange}
                style={{ outline: 'none' }}
                localization={{
                  pagination: {
                    labelRowsPerPage: 'rows',
                  },
                }}
              />
            </InfoCard>
          </div>
        </PageLayout.Table>
      </PageLayout>
    </BasePage>
  );
}
OpenShiftPage.displayName = 'OpenShiftPage';
